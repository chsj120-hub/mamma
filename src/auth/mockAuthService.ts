// 가짜 로그인. 실제 소셜 연동 없이 흐름(가입·로그인·가입 확인)만 흉내 낸다.
// - 소셜마다 가짜 계정이 하나씩 있다 (예: 카카오 → mock-kakao). 버튼을 누르면 그 계정으로 로그인한다.
// - 계정 목록은 이 브라우저의 localStorage에만 있다 (서버 없음). 모바일 폭에서 가입한 뒤 PC 폭에서 로그인해 볼 수 있다.
import { SYNC_KEYS } from '../lib/cloud'
import { guestPrefix, readRaw, removeRaw, writeRaw } from '../lib/storage'
import { LEGAL_VERSIONS } from '../data/legal'
import type { AuthService, AuthUser, ConsentRecord, FamilyMember, FamilyService, Provider, SignInResult } from './types'

type Account = Omit<AuthUser, 'dataUid'> & { createdAt: string; onboarded: boolean; consent?: ConsentRecord; householdId?: string }

const ACCOUNTS_KEY = 'auth:accounts'
const SESSION_KEY = 'auth:session'
/** 로그인 버튼을 눌렀을 때 잠깐 기다리는 시간 (실제 연동처럼 '로그인 중' 상태를 볼 수 있게) */
const FAKE_LATENCY_MS = 450

const MOCK_USERS: Record<Provider, Pick<AuthUser, 'displayName' | 'email'>> = {
  kakao: { displayName: '카카오 테스트', email: 'kakao@mock.test' },
  naver: { displayName: '네이버 테스트', email: 'naver@mock.test' },
  google: { displayName: 'Google 테스트', email: 'google@mock.test' },
}

/**
 * 서버 대신 이 브라우저의 localStorage 한 칸을 '서버'처럼 쓴다. 로그인·로그아웃 때 데이터가 서버를 거쳐 오가는
 * 흐름(가져오기·올리기·다른 기기 변경 반영)을 Firebase 없이 확인하려는 용도다. 다른 기기와는 공유되지 않는다.
 */
const cloudKey = (uid: string, key: string) => `mockcloud:${uid}:${key}`

const mockCloud: AuthService['cloud'] = {
  async pullAll(uid) {
    const out: Record<string, string> = {}
    for (const key of SYNC_KEYS) {
      const json = readRaw(guestPrefix(), cloudKey(uid, key))
      if (json !== null) out[key] = json
    }
    return out
  },
  async push(uid, key, value) {
    writeRaw(guestPrefix(), cloudKey(uid, key), JSON.stringify(value))
  },
  subscribe(uid, onChange) {
    const full = guestPrefix() + cloudKey(uid, '')
    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith(full) && e.newValue !== null) onChange(e.key.slice(full.length), e.newValue)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  },
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function readAccounts(): Record<string, Account> {
  try {
    return JSON.parse(readRaw(guestPrefix(), ACCOUNTS_KEY) ?? '{}') as Record<string, Account>
  } catch {
    return {}
  }
}

const writeAccounts = (a: Record<string, Account>) => writeRaw(guestPrefix(), ACCOUNTS_KEY, JSON.stringify(a))

/** 로그인 상태 유지: localStorage(계속) / sessionStorage(브라우저 닫을 때까지) */
function readSession(): string | null {
  try {
    return localStorage.getItem(guestPrefix() + SESSION_KEY) ?? sessionStorage.getItem(guestPrefix() + SESSION_KEY)
  } catch {
    return null
  }
}

function writeSession(uid: string | null, keep: boolean) {
  try {
    localStorage.removeItem(guestPrefix() + SESSION_KEY)
    sessionStorage.removeItem(guestPrefix() + SESSION_KEY)
    if (uid) (keep ? localStorage : sessionStorage).setItem(guestPrefix() + SESSION_KEY, uid)
  } catch {
    // 저장소를 못 쓰는 환경이면 이번 방문에서만 유지
  }
}

/** 저장된 동의가 지금 약관·방침 버전과 같은지 */
const hasConsent = (acc: Account) =>
  acc.consent?.terms === LEGAL_VERSIONS.terms && acc.consent.privacy === LEGAL_VERSIONS.privacy && acc.consent.sensitive === LEGAL_VERSIONS.sensitive

const toUser = ({ uid, provider, displayName, email, householdId }: Account): AuthUser => ({ uid, provider, displayName, email, dataUid: householdId ?? uid })

// 가족 공유 흉내: 초대와 참여를 이 브라우저 저장소에서만 처리한다 (다른 기기와는 공유되지 않는다)
const FAMILY_KEY = 'auth:family'
type FamilyStore = { invites: Record<string, { owner: string; expiresAt: string }>; members: Record<string, Record<string, Omit<FamilyMember, 'uid'>>> }
const readFamily = (): FamilyStore => {
  try {
    return { invites: {}, members: {}, ...(JSON.parse(readRaw(guestPrefix(), FAMILY_KEY) ?? '{}') as Partial<FamilyStore>) }
  } catch {
    return { invites: {}, members: {} }
  }
}
const writeFamily = (f: FamilyStore) => writeRaw(guestPrefix(), FAMILY_KEY, JSON.stringify(f))

const mockFamily: FamilyService = {
  async createInvite(uid) {
    const f = readFamily()
    const code = Array.from({ length: 10 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('')
    const expiresAt = new Date(Date.now() + 7 * 86_400_000).toISOString()
    f.invites[code] = { owner: uid, expiresAt }
    writeFamily(f)
    return { ok: true, code, expiresAt }
  },
  async listMembers(uid) {
    return Object.entries(readFamily().members[uid] ?? {}).map(([m, v]) => ({ uid: m, ...v }))
  },
  async removeMember(ownerUid, memberUid) {
    const f = readFamily()
    delete f.members[ownerUid]?.[memberUid]
    writeFamily(f)
    return { ok: true }
  },
  async join(uid, name, rawCode) {
    const f = readFamily()
    const invite = f.invites[rawCode.trim().toUpperCase()]
    if (!invite) return { ok: false, message: '없는 코드이거나 이미 사라진 코드예요.' }
    if (invite.owner === uid) return { ok: false, message: '내가 만든 초대 코드예요. 다른 보호자에게 보내 주세요.' }
    if (Date.parse(invite.expiresAt) < Date.now()) return { ok: false, message: '만료된 코드예요. 새 코드를 받아 주세요.' }
    f.members[invite.owner] = { ...f.members[invite.owner], [uid]: { name, joinedAt: new Date().toISOString() } }
    writeFamily(f)
    const accounts = readAccounts()
    if (accounts[uid]) writeAccounts({ ...accounts, [uid]: { ...accounts[uid], householdId: invite.owner } })
    return { ok: true, ownerUid: invite.owner }
  },
  async leave(uid, ownerUid) {
    const f = readFamily()
    delete f.members[ownerUid]?.[uid]
    writeFamily(f)
    const accounts = readAccounts()
    if (accounts[uid]) writeAccounts({ ...accounts, [uid]: { ...accounts[uid], householdId: uid } })
    return { ok: true }
  },
}

export const mockAuthService: AuthService = {
  name: 'mock',
  cloud: mockCloud,
  family: mockFamily,

  async restore() {
    const uid = readSession()
    const acc = uid ? readAccounts()[uid] : undefined
    return acc ? { user: toUser(acc), onboarded: acc.onboarded, consented: hasConsent(acc) } : null
  },

  async signIn(provider, { allowSignUp, keepSignedIn }): Promise<SignInResult> {
    await sleep(FAKE_LATENCY_MS)
    const uid = `mock-${provider}`
    const accounts = readAccounts()
    let acc = accounts[uid]
    let created = false

    if (!acc) {
      if (!allowSignUp) return { kind: 'not-registered' }
      acc = { uid, provider, ...MOCK_USERS[provider], createdAt: new Date().toISOString(), onboarded: false }
      accounts[uid] = acc
      writeAccounts(accounts)
      created = true
    } else if (!allowSignUp && !acc.onboarded) {
      // 모바일에서 가입을 시작만 하고 아기 정보를 안 적은 계정
      return { kind: 'incomplete' }
    }

    writeSession(uid, keepSignedIn)
    return { kind: 'signed-in', user: toUser(acc), created, onboarded: acc.onboarded, consented: hasConsent(acc) }
  },

  async signOut() {
    writeSession(null, false)
  },

  async completeOnboarding(uid) {
    const accounts = readAccounts()
    if (accounts[uid]) {
      accounts[uid] = { ...accounts[uid], onboarded: true }
      writeAccounts(accounts)
    }
  },
  async recordConsent(uid) {
    const accounts = readAccounts()
    if (accounts[uid]) {
      const { terms, privacy, sensitive } = LEGAL_VERSIONS
      accounts[uid] = { ...accounts[uid], consent: { terms, privacy, sensitive, at: new Date().toISOString() } }
      writeAccounts(accounts)
    }
  },

  async deleteAccount(uid) {
    await sleep(FAKE_LATENCY_MS)
    const accounts = readAccounts()
    delete accounts[uid]
    writeAccounts(accounts)
    for (const key of SYNC_KEYS) removeRaw(guestPrefix(), cloudKey(uid, key))
    writeSession(null, false)
    return { ok: true }
  },
}
