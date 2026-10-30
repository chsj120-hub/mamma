// 실제 구글 로그인 (Firebase Auth) + 서버 저장 (Firestore). 설정: docs/FIREBASE_SETUP.md
// - 가입 정보는 users/{uid} 문서 한 장(가입 경로·가입 완료 여부·가입 시각)이다. 이 문서가 있어야 '가입된 계정'이다.
// - 데이터는 users/{uid}/data/{키} 문서들 (lib/cloud.ts). 보안 규칙(firestore.rules)이 본인만 읽고 쓰게 막는다.
import type { User } from 'firebase/auth'
import { LEGAL_VERSIONS } from '../data/legal'
import { pullAll, push, subscribe, SYNC_KEYS, type SyncKey } from '../lib/cloud'
import { getDb, getFirebaseAuth } from '../lib/firebase'
import type { AuthService, AuthUser, FamilyService, SignInResult } from './types'

const toUser = (u: User, dataUid: string): AuthUser => ({ uid: u.uid, provider: 'google', displayName: u.displayName ?? '구글 계정', email: u.email, dataUid })

type Registry = { onboarded: boolean; consented: boolean; householdId: string }

async function readRegistry(uid: string): Promise<Registry | null> {
  const [db, { doc, getDoc }] = await Promise.all([getDb(), import('firebase/firestore')])
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  const c = snap.data().consent as Partial<Record<'terms' | 'privacy' | 'sensitive', string>> | undefined
  const consented = c?.terms === LEGAL_VERSIONS.terms && c.privacy === LEGAL_VERSIONS.privacy && c.sensitive === LEGAL_VERSIONS.sensitive
  // 가족 기록에 참여한 계정이면 그 멤버로 아직 등록돼 있는지 확인한다 (내보내졌거나 주인이 탈퇴했으면 내 기록으로 돌아온다)
  let householdId = typeof snap.data().householdId === 'string' ? (snap.data().householdId as string) : uid
  if (householdId !== uid) {
    const { getDoc: get } = await import('firebase/firestore')
    const member = await get(doc(db, 'users', householdId, 'members', uid)).catch(() => null)
    if (!member?.exists()) {
      householdId = uid
      void import('firebase/firestore').then(({ updateDoc }) => updateDoc(doc(db, 'users', uid), { householdId: uid })).catch(() => {})
    }
  }
  return { onboarded: snap.data().onboarded === true, consented, householdId }
}

async function createRegistry(uid: string) {
  const [db, { doc, serverTimestamp, setDoc }] = await Promise.all([getDb(), import('firebase/firestore')])
  await setDoc(doc(db, 'users', uid), { provider: 'google', onboarded: false, createdAt: serverTimestamp() })
}

async function currentUserOnce() {
  const [auth, { onAuthStateChanged }] = await Promise.all([getFirebaseAuth(), import('firebase/auth')])
  return new Promise<User | null>((resolve) => {
    const off = onAuthStateChanged(auth, (u) => {
      off()
      resolve(u)
    })
  })
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const INVITE_DAYS = 7

function newInviteCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(10))
  return Array.from(bytes, (b) => CODE_CHARS[b % CODE_CHARS.length]).join('')
}

const family: FamilyService = {
  async createInvite(uid) {
    try {
      const [db, fs] = await Promise.all([getDb(), import('firebase/firestore')])
      const code = newInviteCode()
      const expires = new Date(Date.now() + INVITE_DAYS * 86_400_000)
      await fs.setDoc(fs.doc(db, 'invites', code), { owner: uid, expiresAt: fs.Timestamp.fromDate(expires) })
      return { ok: true, code, expiresAt: expires.toISOString() }
    } catch {
      return { ok: false, message: '초대 코드를 만들지 못했어요. 잠시 뒤 다시 시도해 주세요.' }
    }
  },

  async listMembers(uid) {
    const [db, fs] = await Promise.all([getDb(), import('firebase/firestore')])
    const snap = await fs.getDocs(fs.collection(db, 'users', uid, 'members'))
    return snap.docs.map((d) => ({ uid: d.id, name: String(d.data().name ?? ''), joinedAt: String(d.data().joinedAt ?? '') }))
  },

  async removeMember(ownerUid, memberUid) {
    try {
      const [db, fs] = await Promise.all([getDb(), import('firebase/firestore')])
      await fs.deleteDoc(fs.doc(db, 'users', ownerUid, 'members', memberUid))
      return { ok: true }
    } catch {
      return { ok: false, message: '내보내지 못했어요. 잠시 뒤 다시 시도해 주세요.' }
    }
  },

  async join(uid, name, rawCode) {
    const code = rawCode.trim().toUpperCase()
    if (!/^[A-Z0-9]{8,20}$/.test(code)) return { ok: false, message: '초대 코드를 다시 확인해 주세요.' }
    try {
      const [db, fs] = await Promise.all([getDb(), import('firebase/firestore')])
      const invite = await fs.getDoc(fs.doc(db, 'invites', code))
      if (!invite.exists()) return { ok: false, message: '없는 코드이거나 이미 사라진 코드예요.' }
      const ownerUid = String(invite.data().owner)
      if (ownerUid === uid) return { ok: false, message: '내가 만든 초대 코드예요. 다른 보호자에게 보내 주세요.' }
      if (invite.data().expiresAt.toMillis() < Date.now()) return { ok: false, message: '만료된 코드예요. 새 코드를 받아 주세요.' }
      await fs.setDoc(fs.doc(db, 'users', ownerUid, 'members', uid), { code, joinedAt: new Date().toISOString(), name: name.slice(0, 40) })
      await fs.updateDoc(fs.doc(db, 'users', uid), { householdId: ownerUid })
      return { ok: true, ownerUid }
    } catch {
      return { ok: false, message: '참여하지 못했어요. 코드를 확인하고 다시 시도해 주세요.' }
    }
  },

  async leave(uid, ownerUid) {
    try {
      const [db, fs] = await Promise.all([getDb(), import('firebase/firestore')])
      await fs.updateDoc(fs.doc(db, 'users', uid), { householdId: uid })
      await fs.deleteDoc(fs.doc(db, 'users', ownerUid, 'members', uid))
      return { ok: true }
    } catch {
      return { ok: false, message: '나가지 못했어요. 잠시 뒤 다시 시도해 주세요.' }
    }
  },
}

export const firebaseAuthService: AuthService = {
  name: 'firebase',

  async restore() {
    const u = await currentUserOnce()
    if (!u) return null
    const reg = await readRegistry(u.uid)
    if (!reg) {
      // 로그인 정보는 있는데 가입 기록이 없는 계정 (PC에서 로그인만 하고 간 경우 등): 들어오지 못하게 로그아웃
      const [auth, { signOut }] = await Promise.all([getFirebaseAuth(), import('firebase/auth')])
      await signOut(auth)
      return null
    }
    return { user: toUser(u, reg.householdId), onboarded: reg.onboarded, consented: reg.consented }
  },

  async signIn(provider, { allowSignUp, keepSignedIn }): Promise<SignInResult> {
    if (provider !== 'google') return { kind: 'error', message: '지금은 Google 로그인만 쓸 수 있어요.' }
    const [auth, fb] = await Promise.all([getFirebaseAuth(), import('firebase/auth')])
    try {
      await fb.setPersistence(auth, keepSignedIn ? fb.browserLocalPersistence : fb.browserSessionPersistence)
      const cred = await fb.signInWithPopup(auth, new fb.GoogleAuthProvider())
      const reg = await readRegistry(cred.user.uid)

      if (!reg) {
        if (!allowSignUp) {
          await fb.signOut(auth)
          return { kind: 'not-registered' }
        }
        await createRegistry(cred.user.uid)
        return { kind: 'signed-in', user: toUser(cred.user, cred.user.uid), created: true, onboarded: false, consented: false }
      }
      if (!allowSignUp && !reg.onboarded) {
        await fb.signOut(auth)
        return { kind: 'incomplete' }
      }
      return { kind: 'signed-in', user: toUser(cred.user, reg.householdId), created: false, onboarded: reg.onboarded, consented: reg.consented }
    } catch (e) {
      const code = (e as { code?: string }).code
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return { kind: 'cancelled' }
      if (code === 'auth/popup-blocked') return { kind: 'error', message: '팝업이 막혀 있어요. 이 사이트의 팝업을 허용하고 다시 눌러 주세요.' }
      if (code === 'auth/unauthorized-domain') return { kind: 'error', message: '이 주소는 로그인이 허용되지 않았어요. (Firebase 승인된 도메인에 추가가 필요해요)' }
      if (code === 'permission-denied' || /permission/i.test(String((e as Error).message))) return { kind: 'error', message: '서버 접근이 거부됐어요. Firestore 보안 규칙을 게시했는지 확인해 주세요.' }
      return { kind: 'error', message: '로그인하지 못했어요. 잠시 뒤 다시 시도해 주세요.' }
    }
  },

  async signOut() {
    const [auth, { signOut }] = await Promise.all([getFirebaseAuth(), import('firebase/auth')])
    await signOut(auth)
  },

  async completeOnboarding(uid) {
    const [db, { doc, updateDoc }] = await Promise.all([getDb(), import('firebase/firestore')])
    await updateDoc(doc(db, 'users', uid), { onboarded: true })
  },

  async recordConsent(uid) {
    const [db, { doc, updateDoc }] = await Promise.all([getDb(), import('firebase/firestore')])
    const { terms, privacy, sensitive } = LEGAL_VERSIONS
    await updateDoc(doc(db, 'users', uid), { consent: { terms, privacy, sensitive, at: new Date().toISOString() } })
  },

  async deleteAccount(uid) {
    const [auth, fb, db, fs] = await Promise.all([getFirebaseAuth(), import('firebase/auth'), getDb(), import('firebase/firestore')])
    const current = auth.currentUser
    if (!current || current.uid !== uid) return { ok: false, message: '로그인 정보를 확인하지 못했어요. 다시 로그인한 뒤 시도해 주세요.' }
    try {
      // 계정을 지우려면 최근(약 5분 안)에 로그인한 기록이 필요하다. 오래됐으면 구글 계정을 한 번 더 확인한다
      const lastSignIn = Date.parse(current.metadata.lastSignInTime ?? '')
      if (!(Date.now() - lastSignIn < 4 * 60_000)) await fb.reauthenticateWithPopup(current, new fb.GoogleAuthProvider())
    } catch (e) {
      const code = (e as { code?: string }).code
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return { ok: false, message: '구글 계정 확인을 취소했어요. 탈퇴하지 않았어요.' }
      if (code === 'auth/popup-blocked') return { ok: false, message: '팝업이 막혀 있어요. 이 사이트의 팝업을 허용하고 다시 눌러 주세요.' }
      return { ok: false, message: '계정을 확인하지 못했어요. 잠시 뒤 다시 시도해 주세요.' }
    }
    try {
      const reg = await readRegistry(uid)
      if (reg && reg.householdId !== uid) {
        // 가족 기록에 참여 중이면 그 기록은 초대한 사람의 것이라 지우지 않고 참여만 끝낸다
        await fs.deleteDoc(fs.doc(db, 'users', reg.householdId, 'members', uid))
      } else {
        // 내 가족 기록에 참여한 사람들의 참여 기록을 먼저 지운다
        const members = await fs.getDocs(fs.collection(db, 'users', uid, 'members'))
        await Promise.all(members.docs.map((m) => fs.deleteDoc(m.ref)))
      }
      // 데이터 문서 → 가입 기록 → 로그인 계정 순서 (규칙이 가입 기록이 있어야 데이터 쓰기를 허용한다)
      await Promise.all(SYNC_KEYS.map((key) => fs.deleteDoc(fs.doc(db, 'users', uid, 'data', key))))
      await fs.deleteDoc(fs.doc(db, 'users', uid))
      await fb.deleteUser(current)
      return { ok: true }
    } catch {
      return { ok: false, message: '삭제를 끝내지 못했어요. 잠시 뒤 다시 시도해 주세요. 계속 안 되면 계정 삭제 안내 페이지의 이메일로 알려 주세요.' }
    }
  },

  family,

  cloud: {
    pullAll,
    push: (uid, key, value) => push(uid, key as SyncKey, value),
    subscribe,
  },
}
