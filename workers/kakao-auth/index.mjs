// 카카오 로그인 중계 서버 (Cloudflare Worker). 설정·배포: docs/KAKAO_LOGIN.md
//
// 왜 필요한가: 카카오는 코드를 토큰으로 바꿀 때 '클라이언트 시크릿'(비밀 키)을 요구해서 브라우저에서는 할 수 없다.
// 그래서 이 Worker가 ① 브라우저가 받은 인가 코드를 카카오에 보내 로그인 정보를 확인하고 ② Firebase '커스텀 토큰'을 만들어 돌려준다.
// 브라우저는 그 토큰으로 Firebase에 로그인한다 (signInWithCustomToken). Firebase 무료 요금제(Spark)로 쓸 수 있고 Identity Platform 업그레이드가 필요 없다.
//
// 필요한 설정 (wrangler secret / vars)
//   KAKAO_REST_API_KEY        카카오 앱의 REST API 키
//   KAKAO_CLIENT_SECRET       그 키의 클라이언트 시크릿
//   FIREBASE_SA_EMAIL         서비스 계정 이메일 (예: mamma-kakao-auth@<프로젝트>.iam.gserviceaccount.com)
//   FIREBASE_SA_PRIVATE_KEY   그 서비스 계정 키(JSON)의 private_key (-----BEGIN PRIVATE KEY----- ...)
//   ALLOWED_ORIGINS           로그인을 허용할 사이트 주소들(쉼표로 구분). 예: https://mamma-one.vercel.app
//
// 기록(로그)에는 사용자 정보를 남기지 않는다.

const FIREBASE_AUD = 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit'
const KAKAO_TOKEN_URL = 'https://kauth.kakao.com/oauth/token'
const KAKAO_ME_URL = 'https://kapi.kakao.com/v2/user/me'
/** 카카오가 돌려보낼 주소. 사이트 주소 + 이 경로만 허용한다 */
export const CALLBACK_PATH = '/auth/kakao'
const TOKEN_LIFETIME_SECONDS = 3600
const enc = new TextEncoder()

const b64url = (data) => {
  const bytes = typeof data === 'string' ? enc.encode(data) : new Uint8Array(data)
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function pemToDer(pem) {
  const body = pem
    .replace(/\\n/g, '\n')
    .replace(/-----[^-]+-----/g, '')
    .replace(/\s+/g, '')
  const bin = atob(body)
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

/** Firebase 커스텀 토큰(JWT, RS256)을 서비스 계정 키로 서명해 만든다 */
export async function signCustomToken({ email, privateKey }, uid, claims = {}, nowMs = Date.now()) {
  const iat = Math.floor(nowMs / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = { iss: email, sub: email, aud: FIREBASE_AUD, iat, exp: iat + TOKEN_LIFETIME_SECONDS, uid, claims }
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`
  const key = await crypto.subtle.importKey('pkcs8', pemToDer(privateKey), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(unsigned))
  return `${unsigned}.${b64url(sig)}`
}

const json = (body, status, headers) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } })

export default {
  async fetch(req, env) {
    const url = new URL(req.url)
    const origin = req.headers.get('Origin') ?? ''
    const allowed = String(env.ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const originOk = allowed.includes(origin)
    const cors = originOk ? { 'access-control-allow-origin': origin, vary: 'Origin' } : { vary: 'Origin' }

    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: originOk ? 204 : 403,
        headers: { ...cors, 'access-control-allow-methods': 'POST', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '600' },
      })
    }
    if (url.pathname !== '/kakao/exchange' || req.method !== 'POST') return json({ error: 'not_found' }, 404, cors)
    if (!originOk) return json({ error: 'forbidden_origin' }, 403, cors)

    let body
    try {
      const text = await req.text()
      if (text.length > 4096) return json({ error: 'too_large' }, 413, cors)
      body = JSON.parse(text)
    } catch {
      return json({ error: 'bad_request' }, 400, cors)
    }
    const { code, redirectUri } = body ?? {}
    if (typeof code !== 'string' || code.length < 10 || code.length > 512 || redirectUri !== origin + CALLBACK_PATH) return json({ error: 'bad_request' }, 400, cors)

    // 1) 인가 코드 → 카카오 액세스 토큰 (클라이언트 시크릿은 여기서만 쓴다)
    const tokenRes = await fetch(KAKAO_TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded;charset=utf-8' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: env.KAKAO_REST_API_KEY,
        redirect_uri: redirectUri,
        code,
        client_secret: env.KAKAO_CLIENT_SECRET,
      }),
    })
    const tokenJson = await tokenRes.json().catch(() => ({}))
    if (!tokenRes.ok || typeof tokenJson.access_token !== 'string') return json({ error: 'kakao_token_failed' }, 401, cors)

    // 2) 액세스 토큰 → 회원번호·닉네임 (이메일은 받지 않는다)
    const meRes = await fetch(KAKAO_ME_URL, { headers: { authorization: `Bearer ${tokenJson.access_token}` } })
    const me = await meRes.json().catch(() => ({}))
    if (!meRes.ok || (typeof me.id !== 'number' && typeof me.id !== 'string')) return json({ error: 'kakao_user_failed' }, 401, cors)
    const nickname = String(me.kakao_account?.profile?.nickname ?? me.properties?.nickname ?? '').slice(0, 40)

    // 3) Firebase 커스텀 토큰 만들기 (uid는 'kakao:회원번호')
    try {
      const token = await signCustomToken({ email: env.FIREBASE_SA_EMAIL, privateKey: env.FIREBASE_SA_PRIVATE_KEY }, `kakao:${me.id}`, { name: nickname, provider: 'kakao' })
      return json({ token, name: nickname }, 200, cors)
    } catch {
      return json({ error: 'sign_failed' }, 500, cors)
    }
  },
}
