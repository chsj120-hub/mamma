// 카카오 중계 Worker 테스트. 카카오 서버는 가짜로 흉내 내고, 만들어진 커스텀 토큰의 서명과 내용을 실제로 검증한다.
import { webcrypto } from 'node:crypto'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import worker, { CALLBACK_PATH } from './index.mjs'

const ORIGIN = 'https://mamma.example.com'
let env
let publicKey

const toPem = (der) => {
  const b64 = Buffer.from(der).toString('base64').match(/.{1,64}/g).join('\n')
  return `-----BEGIN PRIVATE KEY-----\n${b64}\n-----END PRIVATE KEY-----\n`
}
const fromB64url = (s) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64')

beforeAll(async () => {
  const pair = await webcrypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify'])
  publicKey = pair.publicKey
  env = {
    KAKAO_REST_API_KEY: 'rest-key',
    KAKAO_CLIENT_SECRET: 'secret',
    FIREBASE_SA_EMAIL: 'mamma-kakao-auth@test-project.iam.gserviceaccount.com',
    FIREBASE_SA_PRIVATE_KEY: toPem(await webcrypto.subtle.exportKey('pkcs8', pair.privateKey)),
    ALLOWED_ORIGINS: `${ORIGIN}, http://localhost:5173`,
  }
})

const call = (body, { origin = ORIGIN, method = 'POST', path = '/kakao/exchange' } = {}) =>
  worker.fetch(new Request(`https://worker.test${path}`, { method, headers: { Origin: origin, 'content-type': 'application/json' }, body: method === 'POST' ? JSON.stringify(body) : undefined }), env)

const mockKakao = ({ tokenOk = true, meOk = true, me = { id: 123456789, kakao_account: { profile: { nickname: '맘마엄마' } } } } = {}) => {
  const seen = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url, init) => {
      seen.push({ url: String(url), init })
      if (String(url).includes('/oauth/token')) return tokenOk ? Response.json({ access_token: 'kakao-access' }) : Response.json({ error: 'invalid_grant' }, { status: 400 })
      if (String(url).includes('/v2/user/me')) return meOk ? Response.json(me) : Response.json({}, { status: 401 })
      throw new Error('예상하지 못한 호출: ' + url)
    }),
  )
  return seen
}

describe('카카오 중계 Worker', () => {
  it('로그인 코드를 받으면 uid가 kakao:회원번호인 Firebase 커스텀 토큰을 만든다', async () => {
    const seen = mockKakao()
    const res = await call({ code: 'a'.repeat(30), redirectUri: ORIGIN + CALLBACK_PATH })
    expect(res.status).toBe(200)
    expect(res.headers.get('access-control-allow-origin')).toBe(ORIGIN)
    const { token, name } = await res.json()
    expect(name).toBe('맘마엄마')

    const [h, p, s] = token.split('.')
    expect(JSON.parse(fromB64url(h).toString())).toEqual({ alg: 'RS256', typ: 'JWT' })
    const payload = JSON.parse(fromB64url(p).toString())
    expect(payload.uid).toBe('kakao:123456789')
    expect(payload.iss).toBe(env.FIREBASE_SA_EMAIL)
    expect(payload.sub).toBe(env.FIREBASE_SA_EMAIL)
    expect(payload.aud).toBe('https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit')
    expect(payload.exp - payload.iat).toBe(3600)
    expect(payload.claims).toEqual({ name: '맘마엄마', provider: 'kakao' })
    // 서명이 서비스 계정 키로 만들어졌는지 공개키로 검증
    const ok = await webcrypto.subtle.verify('RSASSA-PKCS1-v1_5', publicKey, fromB64url(s), new TextEncoder().encode(`${h}.${p}`))
    expect(ok).toBe(true)

    // 카카오에는 클라이언트 시크릿과 등록된 redirect_uri를 보냈는지
    const form = seen[0].init.body.toString()
    expect(form).toContain('client_secret=secret')
    expect(form).toContain(encodeURIComponent(ORIGIN + CALLBACK_PATH))
    expect(seen[1].init.headers.authorization).toBe('Bearer kakao-access')
  })

  it('허용되지 않은 사이트(Origin)에서 온 요청은 거부한다', async () => {
    mockKakao()
    const res = await call({ code: 'a'.repeat(30), redirectUri: 'https://evil.example/auth/kakao' }, { origin: 'https://evil.example' })
    expect(res.status).toBe(403)
    expect(res.headers.get('access-control-allow-origin')).toBeNull()
  })

  it('redirectUri가 사이트 주소 + /auth/kakao가 아니면 거부한다', async () => {
    const seen = mockKakao()
    const res = await call({ code: 'a'.repeat(30), redirectUri: 'https://mamma.example.com/other' })
    expect(res.status).toBe(400)
    expect(seen).toHaveLength(0)
  })

  it('코드가 비었거나 이상하면 카카오를 부르지 않고 거부한다', async () => {
    const seen = mockKakao()
    for (const code of [undefined, '', 'short', 'x'.repeat(600), 123]) {
      expect((await call({ code, redirectUri: ORIGIN + CALLBACK_PATH })).status).toBe(400)
    }
    expect(seen).toHaveLength(0)
  })

  it('카카오가 코드를 거절하면 토큰을 만들지 않는다', async () => {
    mockKakao({ tokenOk: false })
    const res = await call({ code: 'a'.repeat(30), redirectUri: ORIGIN + CALLBACK_PATH })
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'kakao_token_failed' })
  })

  it('카카오 사용자 정보를 못 가져오면 토큰을 만들지 않는다', async () => {
    mockKakao({ meOk: false })
    expect((await call({ code: 'a'.repeat(30), redirectUri: ORIGIN + CALLBACK_PATH })).status).toBe(401)
  })

  it('닉네임이 없어도 로그인은 된다 (이름은 빈 값)', async () => {
    mockKakao({ me: { id: 42 } })
    const res = await call({ code: 'a'.repeat(30), redirectUri: ORIGIN + CALLBACK_PATH })
    expect(res.status).toBe(200)
    expect((await res.json()).name).toBe('')
  })

  it('다른 경로와 GET은 404, 허용된 사이트의 사전 요청(OPTIONS)은 204', async () => {
    expect((await call({}, { path: '/other' })).status).toBe(404)
    expect((await call(undefined, { method: 'GET' })).status).toBe(404)
    const pre = await call(undefined, { method: 'OPTIONS' })
    expect(pre.status).toBe(204)
    expect(pre.headers.get('access-control-allow-methods')).toBe('POST')
  })
})
