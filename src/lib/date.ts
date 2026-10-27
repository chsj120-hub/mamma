// 날짜는 'YYYY-MM-DD' 문자열로 주고받고, 계산은 Date.UTC 기준으로 해서 타임존·서머타임 오차를 없앤다.
const DAY = 86_400_000

const pad = (n: number) => String(n).padStart(2, '0')

/** 로컬 달력 기준 오늘 'YYYY-MM-DD' */
export function todayKey(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function toUTC(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

/** b - a 일수 */
export function daysBetween(a: string, b: string) {
  return Math.round((toUTC(b) - toUTC(a)) / DAY)
}

export function addDays(key: string, n: number) {
  const t = new Date(toUTC(key) + n * DAY)
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`
}

/** 생후 일수 (출생일 = D+0) */
export const dayCount = (birthDate: string, today = todayKey()) => daysBetween(birthDate, today)

/** 만 개월 수 */
export function monthsOld(birthDate: string, today = todayKey()) {
  const [by, bm, bd] = birthDate.split('-').map(Number)
  const [ty, tm, td] = today.split('-').map(Number)
  return (ty - by) * 12 + (tm - bm) - (td < bd ? 1 : 0)
}

/** 요일 (0=일 … 6=토) */
export const dowOf = (key: string) => new Date(toUTC(key)).getUTCDay()

export const DOW_KO = ['일', '월', '화', '수', '목', '금', '토']

/** 그 주 월요일 */
export const weekStart = (key: string) => addDays(key, -((dowOf(key) + 6) % 7))

/** 그 달 1일 */
export const monthStart = (key: string) => `${key.slice(0, 7)}-01`

export function daysInMonth(key: string) {
  const [y, m] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m, 0)).getUTCDate()
}

/** 한 달 앞뒤로 이동 (1일 기준) */
export function addMonths(key: string, n: number) {
  const [y, m] = key.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1 + n, 1))
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-01`
}

/** '2026-10-27' → { month: 10, day: 27 } */
export function md(key: string) {
  const [, m, d] = key.split('-').map(Number)
  return { month: m, day: d }
}

/** '2026-03-17' → '2026.03.17' */
export const dotted = (key: string) => key.replaceAll('-', '.')

/** '17:30' → '오후 5:30' */
export function koreanTime(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  const ampm = h < 12 ? '오전' : '오후'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${ampm} ${h12}:${pad(m)}`
}
