// 카카오 로그인의 브라우저 쪽 흐름(state 확인, 돌아온 주소 처리) 테스트. 브라우저 객체는 가짜로 대신한다.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { captureKakaoCallback, hasKakaoCallback, KAKAO_CALLBACK_PATH, startKakaoRedirect, takeKakaoCallback } from './kakao'

let store: Record<string, string>
let loc: { pathname: string; search: string; origin: string; assign: ReturnType<typeof vi.fn> }
const replaceState = vi.fn()

beforeEach(() => {
  store = {}
  loc = { pathname: '/', search: '', origin: 'https://mamma.example.com', assign: vi.fn() }
  replaceState.mockClear()
  vi.stubGlobal('sessionStorage', { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => void (store[k] = v), removeItem: (k: string) => void delete store[k] })
  vi.stubGlobal('location', loc)
  vi.stubGlobal('history', { replaceState })
})

/** 카카오 페이지로 보낸 뒤, 그 state를 달고 돌아온 것처럼 만든다 */
function goAndReturn(returnQuery: (state: string) => string, keep = true) {
  startKakaoRedirect(keep)
  const url = new URL(loc.assign.mock.calls[0][0] as string)
  const state = url.searchParams.get('state')!
  loc.pathname = KAKAO_CALLBACK_PATH
  loc.search = returnQuery(state)
  captureKakaoCallback()
  return url
}

describe('카카오 로그인 (브라우저 쪽)', () => {
  it('카카오 로그인 페이지로 code 방식·등록한 redirect 주소·state를 달아 보낸다', () => {
    const url = goAndReturn((s) => `?code=abc&state=${s}`)
    expect(url.origin + url.pathname).toBe('https://kauth.kakao.com/oauth/authorize')
    expect(url.searchParams.get('response_type')).toBe('code')
    expect(url.searchParams.get('redirect_uri')).toBe('https://mamma.example.com/auth/kakao')
    expect(url.searchParams.get('state')).toMatch(/^[0-9a-f]{32}$/)
    expect(url.searchParams.has('scope')).toBe(false) // 이메일 등 추가 동의는 요청하지 않는다
  })

  it('돌아오면 코드를 기억하고 주소창을 지운다', () => {
    goAndReturn((s) => `?code=abc&state=${s}`)
    expect(replaceState).toHaveBeenCalledWith(null, '', '/')
    expect(hasKakaoCallback()).toBe(true)
  })

  it('state가 맞으면 코드와 로그인 유지 선택을 돌려주고, 한 번만 쓸 수 있다', () => {
    goAndReturn((s) => `?code=abc&state=${s}`, false)
    expect(takeKakaoCallback()).toEqual({ code: 'abc', keep: false })
    expect(takeKakaoCallback()).toBeNull()
  })

  it('state가 다르면 거부한다 (다른 곳에서 만든 요청 방지)', () => {
    goAndReturn(() => '?code=abc&state=forged')
    expect(takeKakaoCallback()).toEqual({ error: 'state' })
  })

  it('보낸 적이 없는데 돌아온 경우도 거부한다', () => {
    loc.pathname = KAKAO_CALLBACK_PATH
    loc.search = '?code=abc&state=anything'
    captureKakaoCallback()
    expect(takeKakaoCallback()).toEqual({ error: 'state' })
  })

  it('10분이 지나면 거부한다', () => {
    vi.useFakeTimers()
    try {
      goAndReturn((s) => `?code=abc&state=${s}`)
      vi.setSystemTime(Date.now() + 11 * 60_000)
      expect(takeKakaoCallback()).toEqual({ error: 'state' })
    } finally {
      vi.useRealTimers()
    }
  })

  it('사용자가 취소하면 denied, 그 밖의 오류는 failed', () => {
    loc.pathname = KAKAO_CALLBACK_PATH
    loc.search = '?error=access_denied&error_description=x'
    captureKakaoCallback()
    expect(takeKakaoCallback()).toEqual({ error: 'denied' })
    loc.search = '?error=server_error'
    captureKakaoCallback()
    expect(takeKakaoCallback()).toEqual({ error: 'failed' })
  })

  it('다른 주소에서는 아무것도 하지 않는다', () => {
    loc.pathname = '/cube'
    captureKakaoCallback()
    expect(hasKakaoCallback()).toBe(false)
    expect(replaceState).not.toHaveBeenCalled()
  })
})
