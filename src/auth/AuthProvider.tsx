// 로그인 상태와 사용자별 데이터 저장소를 관리한다. 인증 방식은 authService(src/auth/index.ts)가 정한다.
// - 로그인하면 저장 접두어를 사용자별로 바꾸고 앱을 다시 그려서 그 사용자의 데이터를 읽게 한다 (아이디별 데이터 분리).
// - 서버 저장소(authService.cloud)가 있는 구현이면 로그인 때 가져오고, 저장할 때마다 0.8초 뒤 올린다.
// - 서버가 없는 구현(mock)은 이 기기에 남은 데이터가 유일한 사본이라, 로그아웃해도 지우지 않는다.
import { createContext, Fragment, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { isSyncKey, SYNC_KEYS } from '../lib/cloud'
import { adoptGuestData, clearPrefix, guestPrefix, notifyRemoteChange, readRaw, removeRaw, setSaveListener, setStoragePrefix, userPrefix, writeRaw } from '../lib/storage'
import { authService } from './index'
import { hasKakaoCallback } from './kakao'
import type { AuthUser, DeleteAccountResult, FamilyMember, FamilyResult, Provider, SignInOptions, SignInResult } from './types'

export type SyncStatus = 'off' | 'idle' | 'saving' | 'saved' | 'error'
/** 로그인 화면에 띄우는 안내 */
export type LoginNotice = 'not-registered' | 'incomplete' | 'deleted' | null

type AuthCtx = {
  user: AuthUser | null
  /** 아기 정보 입력까지 마친 계정인지 */
  onboarded: boolean
  /** 현재 약관·방침 버전에 동의한 계정인지 (아니면 동의 화면을 먼저 보여 준다) */
  consented: boolean
  /** 로그인 버튼을 누른 뒤 결과를 기다리는 중인 소셜 */
  signingIn: Provider | null
  notice: LoginNotice
  loginError: string | null
  /** 서버 저장 상태 (서버 저장소가 없는 구현이면 'off') */
  syncStatus: SyncStatus
  syncError: string | null
  signIn: (provider: Provider, options: SignInOptions) => Promise<SignInResult>
  signOutNow: () => Promise<void>
  completeOnboarding: () => Promise<void>
  recordConsent: () => Promise<void>
  /** 회원 탈퇴: 서버 기록과 계정, 이 기기의 사용자 데이터를 모두 지운다. 실패하면 이유를 돌려주고 아무것도 바꾸지 않는다 */
  deleteAccount: () => Promise<DeleteAccountResult>
  /** 가족 공유를 쓸 수 있는지 (서버 저장을 쓰는 구현일 때) */
  familyEnabled: boolean
  /** 초대받아 다른 사람의 기록을 함께 쓰는 중인지 */
  inFamily: boolean
  createInvite: () => Promise<FamilyResult<{ code: string; expiresAt: string }>>
  listMembers: () => Promise<FamilyMember[]>
  removeMember: (memberUid: string) => Promise<FamilyResult>
  /** 초대 코드로 참여: 이 기기의 기록이 초대한 사람의 기록으로 바뀐다 */
  joinFamily: (code: string) => Promise<FamilyResult>
  /** 가족 기록에서 나가 내 기록으로 돌아간다 */
  leaveFamily: () => Promise<FamilyResult>
}

const Ctx = createContext<AuthCtx | null>(null)
const DEBOUNCE_MS = 800

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [onboarded, setOnboarded] = useState(false)
  const [consented, setConsented] = useState(false)
  const [ready, setReady] = useState(false)
  /** 값이 바뀌면 앱 전체를 다시 그려서 새 사용자의 데이터를 읽게 한다 */
  const [epoch, setEpoch] = useState(0)
  const [signingIn, setSigningIn] = useState<Provider | null>(null)
  const [notice, setNotice] = useState<LoginNotice>(null)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(authService.cloud ? 'idle' : 'off')
  const [syncError, setSyncError] = useState<string | null>(null)
  const pending = useRef(new Map<string, unknown>())
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const uidRef = useRef<string | null>(null)
  /** 기록이 저장된 곳(서버)의 주인 uid. 가족 기록에 참여했으면 uidRef와 다르다 */
  const dataUidRef = useRef<string | null>(null)
  const userRef = useRef<AuthUser | null>(null)
  /** 서버와 마지막으로 주고받은 값(JSON). 같은 값이 되돌아오는 것(에코)을 걸러낸다 */
  const lastKnown = useRef(new Map<string, string>())
  const unsubscribe = useRef<(() => void) | null>(null)

  const flush = useCallback(async () => {
    const cloud = authService.cloud
    const uid = dataUidRef.current
    if (!cloud || !uid || pending.current.size === 0) return
    const batch = [...pending.current]
    pending.current.clear()
    try {
      setSyncStatus('saving')
      await Promise.all(batch.map(([key, value]) => cloud.push(uid, key, value)))
      batch.forEach(([key, value]) => lastKnown.current.set(key, JSON.stringify(value)))
      setSyncStatus('saved')
      setSyncError(null)
    } catch (e) {
      // 실패한 값은 다시 대기열에 넣어 다음 저장 때 같이 보낸다
      batch.forEach(([key, value]) => !pending.current.has(key) && pending.current.set(key, value))
      setSyncStatus('error')
      setSyncError(e instanceof Error ? e.message : '서버에 저장하지 못했어요')
    }
  }, [])

  /** 로그인한 사용자로 저장소를 바꾸고 앱을 다시 그린다 */
  const activate = useCallback(
    async (u: AuthUser, isOnboarded: boolean, created: boolean, isConsented: boolean, replaceLocal = false) => {
      if (timer.current) clearTimeout(timer.current)
      await flush()
      unsubscribe.current?.()
      unsubscribe.current = null
      lastKnown.current.clear()
      const prefix = userPrefix(u.uid)
      const cloud = authService.cloud
      // 다른 기록으로 바꿔 끼울 때는 이 기기에 있던 같은 종류의 기록을 먼저 비워서 섞이지 않게 한다
      if (replaceLocal) SYNC_KEYS.forEach((key) => removeRaw(prefix, key))

      try {
        if (cloud) {
          setSyncStatus('saving')
          const remote = await cloud.pullAll(u.dataUid)
          if (Object.keys(remote).length > 0) {
            for (const [key, json] of Object.entries(remote)) {
              writeRaw(prefix, key, json)
              lastKnown.current.set(key, json)
            }
          } else {
            // 서버가 비어 있는 첫 로그인: 이 기기에서 쓰던 데이터를 내 계정으로 옮기고 서버에 올린다
            for (const key of SYNC_KEYS) {
              const json = readRaw(guestPrefix(), key)
              if (json !== null) {
                writeRaw(prefix, key, json)
                pending.current.set(key, JSON.parse(json))
              }
            }
          }
        } else if (created) {
          // 새 계정: 로그인 없이 쓰던 데이터가 있으면 이어받는다 (한 번만 옮기고 원래 자리에선 지움)
          adoptGuestData(prefix)
        }
      } catch (e) {
        setSyncStatus('error')
        setSyncError(e instanceof Error ? e.message : '서버 데이터를 가져오지 못했어요')
      }

      uidRef.current = u.uid
      dataUidRef.current = u.dataUid
      userRef.current = u
      setStoragePrefix(prefix)
      setSaveListener(
        cloud
          ? (key, value) => {
              if (!isSyncKey(key)) return
              if (lastKnown.current.get(key) === JSON.stringify(value)) return // 서버에서 막 받은 값이거나 이미 올린 값
              pending.current.set(key, value)
              if (timer.current) clearTimeout(timer.current)
              timer.current = setTimeout(flush, DEBOUNCE_MS)
            }
          : null,
      )
      // 다른 기기(PC↔모바일)에서 바뀐 값을 실시간으로 받아 화면에 반영한다
      if (cloud) {
        unsubscribe.current = cloud.subscribe(
          u.dataUid,
          (key, json) => {
            if (!isSyncKey(key) || lastKnown.current.get(key) === json) return
            if (pending.current.has(key)) return // 이 기기에서 아직 못 올린 변경이 있으면 그게 먼저 (곧 올라간다)
            lastKnown.current.set(key, json)
            writeRaw(prefix, key, json)
            notifyRemoteChange(key)
          },
          () => {
            setSyncStatus('error')
            setSyncError('실시간 반영 연결이 끊겼어요. 화면으로 돌아올 때 새로 불러와요.')
          },
        )
      }
      setUser(u)
      setOnboarded(isOnboarded)
      setConsented(isConsented)
      setEpoch((n) => n + 1)
      if (cloud) {
        setSyncStatus('saved')
        if (pending.current.size > 0) timer.current = setTimeout(flush, DEBOUNCE_MS)
      }
    },
    [flush],
  )

  // 앱을 열 때 저장돼 있던 로그인 상태 복원
  useEffect(() => {
    let disposed = false
    void (async () => {
      try {
        const restored = await authService.restore()
        if (disposed) return
        if (restored) await activate(restored.user, restored.onboarded, false, restored.consented)
      } catch {
        // 복원에 실패하면 로그인 화면으로
      } finally {
        if (!disposed) setReady(true)
      }
    })()
    return () => {
      disposed = true
    }
  }, [activate])

  // 실시간 연결이 불안정해도 다른 기기의 변경을 놓치지 않게, 화면으로 돌아오거나 인터넷이 다시 연결될 때 서버 값을 한 번 확인한다
  const lastRefresh = useRef(0)
  const refreshFromServer = useCallback(async () => {
    const cloud = authService.cloud
    const dataUid = dataUidRef.current
    const u = userRef.current
    if (!cloud || !dataUid || !u || Date.now() - lastRefresh.current < 10_000) return
    lastRefresh.current = Date.now()
    try {
      const remote = await cloud.pullAll(dataUid)
      const prefix = userPrefix(u.uid)
      for (const [key, json] of Object.entries(remote)) {
        if (!isSyncKey(key) || lastKnown.current.get(key) === json || pending.current.has(key)) continue
        lastKnown.current.set(key, json)
        writeRaw(prefix, key, json)
        notifyRemoteChange(key)
      }
    } catch {
      // 오프라인 등: 다음 기회에
    }
  }, [])

  useEffect(() => {
    const onVisible = () => document.visibilityState === 'visible' && void refreshFromServer()
    const onOnline = () => void refreshFromServer()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onOnline)
    window.addEventListener('online', onOnline)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onOnline)
      window.removeEventListener('online', onOnline)
    }
  }, [refreshFromServer])

  // 카카오 로그인 페이지에서 돌아왔다면(주소의 코드가 기억돼 있다면) 로그인을 마무리한다
  useEffect(() => {
    if (ready && uidRef.current === null && hasKakaoCallback()) void signIn('kakao', { allowSignUp: true, keepSignedIn: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  // 탭을 닫거나 숨길 때 아직 못 보낸 변경을 보낸다 (최선 노력)
  useEffect(() => {
    const onHide = () => document.visibilityState === 'hidden' && void flush()
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [flush])

  const signIn = useCallback(
    async (provider: Provider, options: SignInOptions) => {
      setNotice(null)
      setLoginError(null)
      setSigningIn(provider)
      try {
        const result = await authService.signIn(provider, options)
        if (result.kind === 'signed-in') await activate(result.user, result.onboarded, result.created, result.consented)
        else if (result.kind === 'not-registered' || result.kind === 'incomplete') setNotice(result.kind)
        else if (result.kind === 'error') setLoginError(result.message)
        return result
      } catch (e) {
        const message = e instanceof Error ? e.message : '로그인하지 못했어요. 잠시 뒤 다시 시도해 주세요.'
        setLoginError(message)
        return { kind: 'error', message } as SignInResult
      } finally {
        setSigningIn(null)
      }
    },
    [activate],
  )

  const signOutNow = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current)
    await flush()
    await authService.signOut()
    unsubscribe.current?.()
    unsubscribe.current = null
    lastKnown.current.clear()
    // 서버에 사본이 있는 구현만 이 기기의 사용자 데이터를 지운다 (공용 PC 대비)
    if (authService.cloud && uidRef.current) clearPrefix(userPrefix(uidRef.current))
    uidRef.current = null
    dataUidRef.current = null
    userRef.current = null
    setSaveListener(null)
    setStoragePrefix(guestPrefix())
    setUser(null)
    setOnboarded(false)
    setConsented(false)
    setNotice(null)
    setSyncStatus(authService.cloud ? 'idle' : 'off')
    setEpoch((n) => n + 1)
  }, [flush])

  const completeOnboarding = useCallback(async () => {
    if (!uidRef.current) return
    await authService.completeOnboarding(uidRef.current)
    setOnboarded(true)
  }, [])

  const recordConsent = useCallback(async () => {
    if (!uidRef.current) return
    await authService.recordConsent(uidRef.current)
    setConsented(true)
  }, [])

  const deleteAccount = useCallback(async (): Promise<DeleteAccountResult> => {
    const uid = uidRef.current
    if (!uid) return { ok: false, message: '로그인 정보를 확인하지 못했어요.' }
    // 지우는 동안 올라가는 저장·실시간 구독이 방해하지 않도록 먼저 멈춘다
    if (timer.current) clearTimeout(timer.current)
    pending.current.clear()
    unsubscribe.current?.()
    unsubscribe.current = null
    setSaveListener(null)
    let result: DeleteAccountResult
    try {
      result = await authService.deleteAccount(uid)
    } catch {
      result = { ok: false, message: '삭제하지 못했어요. 잠시 뒤 다시 시도해 주세요.' }
    }
    if (!result.ok) {
      // 실패: 계정은 그대로이므로 저장·구독을 다시 켠다 (로그인 상태를 다시 맞춘다)
      const restored = await authService.restore().catch(() => null)
      if (restored) await activate(restored.user, restored.onboarded, false, restored.consented)
      return result
    }
    clearPrefix(userPrefix(uid))
    lastKnown.current.clear()
    uidRef.current = null
    dataUidRef.current = null
    userRef.current = null
    setStoragePrefix(guestPrefix())
    setUser(null)
    setOnboarded(false)
    setConsented(false)
    setLoginError(null)
    setNotice('deleted')
    setSyncStatus(authService.cloud ? 'idle' : 'off')
    setEpoch((n) => n + 1)
    return result
  }, [activate])

  const family = authService.family
  const familyOff = { ok: false, message: '가족 공유는 로그인한 뒤 서버 저장을 쓸 때만 쓸 수 있어요.' } as const

  const createInvite = useCallback(async () => (family && uidRef.current ? family.createInvite(uidRef.current) : familyOff), [family])
  const listMembers = useCallback(async () => (family && uidRef.current ? family.listMembers(uidRef.current) : []), [family])
  const removeMember = useCallback(async (memberUid: string) => (family && uidRef.current ? family.removeMember(uidRef.current, memberUid) : familyOff), [family])

  const joinFamily = useCallback(
    async (code: string): Promise<FamilyResult> => {
      const u = userRef.current
      if (!family || !u) return familyOff
      const r = await family.join(u.uid, u.displayName, code)
      if (!r.ok) return r
      // 초대 링크로 새로 가입한 사람은 아기 정보를 따로 적지 않으므로, 여기서 가입 완료로 표시한다
      if (!onboarded) await authService.completeOnboarding(u.uid).catch(() => {})
      await activate({ ...u, dataUid: r.ownerUid }, true, false, true, true)
      return { ok: true }
    },
    [family, activate, onboarded],
  )

  const leaveFamily = useCallback(async (): Promise<FamilyResult> => {
    const u = userRef.current
    if (!family || !u || u.dataUid === u.uid) return familyOff
    const r = await family.leave(u.uid, u.dataUid)
    if (!r.ok) return r
    await activate({ ...u, dataUid: u.uid }, true, false, true, true)
    return { ok: true }
  }, [family, activate])

  const familyEnabled = Boolean(family)
  const inFamily = Boolean(user && user.dataUid !== user.uid)

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      onboarded,
      consented,
      signingIn,
      notice,
      loginError,
      syncStatus,
      syncError,
      signIn,
      signOutNow,
      completeOnboarding,
      recordConsent,
      deleteAccount,
      familyEnabled,
      inFamily,
      createInvite,
      listMembers,
      removeMember,
      joinFamily,
      leaveFamily,
    }),
    [user, onboarded, consented, signingIn, notice, loginError, syncStatus, syncError, signIn, signOutNow, completeOnboarding, recordConsent, deleteAccount, familyEnabled, inFamily, createInvite, listMembers, removeMember, joinFamily, leaveFamily],
  )

  if (!ready) {
    return (
      <div role="status" className="flex min-h-dvh items-center justify-center bg-bg text-sm text-sub">
        불러오는 중이에요…
      </div>
    )
  }
  return (
    <Ctx.Provider value={value}>
      <Fragment key={epoch}>{children}</Fragment>
    </Ctx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth는 AuthProvider 안에서만 사용할 수 있어요')
  return ctx
}
