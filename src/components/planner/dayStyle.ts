import type { DayStatus } from '../../lib/meal'

/** 날짜 카드의 상태 태그 (오늘 > 완료 > 예정 > 비어 있음) */
export function dayTag(date: string, today: string, status: DayStatus) {
  if (date === today) return { text: '오늘', cls: 'bg-ink text-white' }
  if (status === 'done') return { text: '완료', cls: 'bg-done text-white' }
  if (status === 'empty') return { text: '비어 있음', cls: 'bg-track text-sub' }
  return { text: '예정', cls: 'bg-track text-sub' }
}

/** 요일 글자색: 일요일 빨강, 토요일 파랑 */
export const dowInk = (dow: number) => (dow === 0 ? 'text-urgent' : dow === 6 ? 'text-sat' : 'text-muted')
