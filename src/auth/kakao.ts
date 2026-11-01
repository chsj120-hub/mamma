// 카카오 로그인 (브라우저 쪽). 흐름은 docs/KAKAO_LOGIN.md
//  1) 로그인 버튼 → 카카오 로그인 페이지로 이동 (startKakaoRedirect)
//  2) 로그인하면 카카오가 우리 사이트 주소(/auth/kakao?code=…&state=…)로 돌려보냄 → main.tsx가 captureKakaoCallback()으로 코드를 잠깐 기억하고 주소를 '/'로 바꿈
//  3) 앱이 시작되면 코드를 중계 서버(Cloudflare Worker)에 보내 Firebase 커스텀 토큰을 받고 로그인함 (exchangeKakaoCode)
// 클라이언트 시크릿(비밀 키)은 중계 서버에만 있다. 여기 있는 건 공개돼도 되는 REST API 키뿐이다.

const REST_KEY = import.meta.env.VITE_KAKAO_REST_KEY as string | undefined
const EXCHANGE_URL = (import.meta.env.VITE_KAKAO_AUTH_URL as string | undefined)?.replace(/\/$/, '')

/** 카카오 로그인에 필요한 설정이 모두 있는지 */
export const kakaoConfigured = Boolean(REST_KEY && EXCHANGE_URL)

export const KAKAO_CALLBACK_PATH = '/auth/kakao'
const STATE_KEY = 'mamma:kakao:state'
const CALLBACK_KEY = 'mamma:kakao:callback'
const MAX_AGE_MS = 10 * 60_000

const read = <T,>(key: string): T | null => {
  try {
    return JSON.parse(sessionStorage.getItem(key) ?? 'null') as T | null
  } catch {
    return null
  }
}
const write = (key: string, value: unknown) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 저장소를 못 쓰는 환경이면 카카오 로그인은 이어갈 수 없다
  }
}

/** 카카오 로그인 페이지로 이동한다 (이 함수 뒤로는 화면이 넘어간다). state는 돌아왔을 때 우리가 보낸 요청인지 확인하는 값 */
export function startKakaoRedirect(keepSignedIn: boolean) {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  const state = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  write(STATE_KEY, { state, keep: keepSignedIn, at: Date.now() })
  const params = new URLSearchParams({
    client_id: REST_KEY ?? '',
    redirect_uri: location.origin + KAKAO_CALLBACK_PATH,
    response_type: 'code',
    state,
  })
  location.assign(`https://kauth.kakao.com/oauth/authorize?${params}`)
}

/** 앱을 열 때 한 번 부른다. 카카오에서 돌아온 주소면 결과를 기억하고 주소창을 '/'로 바꾼다 */
export function captureKakaoCallback() {
  try {
    if (location.pathname !== KAKAO_CALLBACK_PATH) return
    const q = new URLSearchParams(location.search)
    write(CALLBACK_KEY, { code: q.get('code') ?? undefined, state: q.get('state') ?? undefined, error: q.get('error') ?? undefined })
    history.replaceState(null, '', '/')
  } catch {
    // 주소를 못 읽는 환경이면 로그인을 마칠 수 없다
  }
}

export const hasKakaoCallback = () => read(CALLBACK_KEY) !== null

export type KakaoCallback = { code: string; keep: boolean } | { error: 'denied' | 'state' | 'failed' }

/** 기억해 둔 돌아온 결과를 꺼내 확인한다 (한 번만 쓰이도록 지운다). 없으면 null */
export function takeKakaoCallback(): KakaoCallback | null {
  const cb = read<{ code?: string; state?: string; error?: string }>(CALLBACK_KEY)
  const saved = read<{ state: string; keep: boolean; at: number }>(STATE_KEY)
  try {
    sessionStorage.removeItem(CALLBACK_KEY)
    sessionStorage.removeItem(STATE_KEY)
  } catch {
    // 무시
  }
  if (!cb) return null
  if (cb.error) return { error: cb.error === 'access_denied' ? 'denied' : 'failed' }
  if (!cb.code || !saved || cb.state !== saved.state || Date.now() - saved.at > MAX_AGE_MS) return { error: 'state' }
  return { code: cb.code, keep: saved.keep }
}

/** 코드를 중계 서버에 보내 Firebase 커스텀 토큰과 닉네임을 받는다 */
export async function exchangeKakaoCode(code: string): Promise<{ token: string; name: string }> {
  const res = await fetch(`${EXCHANGE_URL}/kakao/exchange`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code, redirectUri: location.origin + KAKAO_CALLBACK_PATH }),
  })
  if (!res.ok) throw new Error(`kakao exchange ${res.status}`)
  const data = (await res.json()) as { token?: string; name?: string }
  if (!data.token) throw new Error('kakao exchange: no token')
  return { token: data.token, name: data.name ?? '' }
}
