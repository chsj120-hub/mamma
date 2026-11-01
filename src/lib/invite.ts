// 가족 초대 링크: https://<주소>/join/<코드> 로 들어오면 코드를 이 기기에 잠깐 기억해 두었다가,
// 로그인·동의를 마친 뒤 '가족 기록에 참여' 화면을 보여 준다 (코드를 직접 입력하지 않아도 되게).
// 코드는 주소창에 남지 않도록 곧바로 지우고, 7일이 지나면 버린다 (초대 코드의 유효기간과 같다).
import { guestPrefix, readRaw, removeRaw, writeRaw } from './storage'

const KEY = 'pendingInvite'
const VALID_MS = 7 * 86_400_000
const CODE_RE = /^[A-Z0-9]{8,20}$/

/** 앱을 열 때 한 번 부른다. 초대 링크로 들어왔으면 코드를 기억하고 주소를 '/'로 바꾼다 */
export function captureInviteFromUrl() {
  try {
    const fromPath = location.pathname.match(/^\/join\/([A-Za-z0-9]+)\/?$/)?.[1]
    const fromQuery = new URLSearchParams(location.search).get('join')
    const code = (fromPath ?? fromQuery ?? '').toUpperCase()
    if (!fromPath && !fromQuery) return
    if (CODE_RE.test(code)) writeRaw(guestPrefix(), KEY, JSON.stringify({ code, at: Date.now() }))
    history.replaceState(null, '', '/')
  } catch {
    // 주소를 못 읽는 환경이면 직접 입력으로 참여할 수 있다
  }
}

/** 기억해 둔 초대 코드 (없거나 만료됐으면 null) */
export function pendingInvite(): string | null {
  try {
    const v = JSON.parse(readRaw(guestPrefix(), KEY) ?? 'null') as { code?: string; at?: number } | null
    if (v?.code && typeof v.at === 'number' && Date.now() - v.at < VALID_MS && CODE_RE.test(v.code)) return v.code
  } catch {
    // 깨진 값은 무시
  }
  return null
}

export const clearPendingInvite = () => removeRaw(guestPrefix(), KEY)

/** 초대 링크 */
export const inviteLink = (code: string) => `${location.origin}/join/${code}`
