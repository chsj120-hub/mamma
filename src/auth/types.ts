// 인증 서비스 인터페이스. 화면 코드는 이 파일의 타입과 useAuth()만 알면 된다.
// 지금은 가짜(mock) 구현을 쓰고, 나중에 같은 인터페이스로 Firebase 구현을 만들어 src/auth/index.ts 한 줄만 바꾼다.

export type Provider = 'kakao' | 'naver' | 'google'

export const PROVIDERS: Provider[] = ['kakao', 'naver', 'google']

export const PROVIDER_NAME: Record<Provider, string> = { kakao: '카카오', naver: '네이버', google: 'Google' }

export type AuthUser = {
  uid: string
  provider: Provider
  displayName: string
  email: string | null
  /** 기록이 저장되는 곳의 주인 uid. 혼자 쓰면 내 uid, 가족 기록에 참여했으면 초대한 사람의 uid */
  dataUid: string
}

export type SignInOptions = {
  /** true면 가입된 계정이 없을 때 새로 만든다 (모바일). false면 만들지 않는다 (PC) */
  allowSignUp: boolean
  /** 이 기기에서 로그인 상태를 유지할지 (false면 브라우저를 닫을 때까지만) */
  keepSignedIn: boolean
}

/** 동의한 약관·방침 버전과 시각 (src/data/legal.ts의 LEGAL_VERSIONS와 같으면 동의가 유효) */
export type ConsentRecord = { terms: string; privacy: string; sensitive: string; at: string }

export type DeleteAccountResult = { ok: true } | { ok: false; message: string }

export type SignInResult =
  | { kind: 'signed-in'; user: AuthUser; created: boolean; onboarded: boolean; consented: boolean }
  /** 가입된 계정이 아님 (PC에서 로그인했는데 모바일에서 가입한 적이 없는 경우) */
  | { kind: 'not-registered' }
  /** 가입은 했지만 아기 정보 입력을 끝내지 않음 (PC에서는 들어갈 수 없다) */
  | { kind: 'incomplete' }
  | { kind: 'cancelled' }
  | { kind: 'error'; message: string }

/** 서버 저장소 어댑터(있을 때만). 로그인한 사용자의 데이터를 서버와 주고받는다 */
export type CloudAdapter = {
  pullAll(uid: string): Promise<Record<string, string>>
  push(uid: string, key: string, value: unknown): Promise<void>
  /**
   * 다른 기기에서 바뀐 값이 도착하면 (키, JSON 문자열)로 알려 준다. 이 기기가 방금 올린 값은 알리지 않는다.
   * 반환값을 부르면 구독을 끝낸다.
   */
  subscribe(uid: string, onChange: (key: string, json: string) => void): () => void
}

export type FamilyMember = { uid: string; name: string; joinedAt: string }

export type FamilyResult<T = object> = ({ ok: true } & T) | { ok: false; message: string }

/** 가족 공유: 한 사람이 초대 코드를 만들고, 다른 보호자가 코드로 참여하면 같은 기록(식단·큐브 등)을 함께 쓴다 */
export type FamilyService = {
  createInvite(uid: string): Promise<FamilyResult<{ code: string; expiresAt: string }>>
  listMembers(uid: string): Promise<FamilyMember[]>
  removeMember(ownerUid: string, memberUid: string): Promise<FamilyResult>
  join(uid: string, name: string, code: string): Promise<FamilyResult<{ ownerUid: string }>>
  leave(uid: string, ownerUid: string): Promise<FamilyResult>
}

export interface AuthService {
  readonly name: 'mock' | 'firebase'
  /** 앱을 열 때 저장돼 있던 로그인 상태를 되살린다. 없으면 null */
  restore(): Promise<{ user: AuthUser; onboarded: boolean; consented: boolean } | null>
  signIn(provider: Provider, options: SignInOptions): Promise<SignInResult>
  signOut(): Promise<void>
  /** 아기 정보 입력까지 마쳐서 가입을 완료로 표시 */
  completeOnboarding(uid: string): Promise<void>
  /** 현재 약관·방침 버전에 동의했다고 기록 */
  recordConsent(uid: string): Promise<void>
  /** 계정과 서버 기록을 모두 삭제한다 (회원 탈퇴). 되돌릴 수 없다 */
  deleteAccount(uid: string): Promise<DeleteAccountResult>
  /** 서버 저장을 쓰는 구현만 제공. 없으면 이 기기(localStorage)에만 저장 */
  readonly cloud?: CloudAdapter
  /** 가족 공유 (서버 저장을 쓰는 구현만) */
  readonly family?: FamilyService
}
