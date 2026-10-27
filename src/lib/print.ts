// 출력(인쇄·PDF) 설정과 기간 계산
import { addDays, addMonths, md, monthStart, weekStart } from './date'

export type PrintKind = 'week' | 'month' | 'report' | 'cube' | 'milestone'
export type PrintRange = 'current' | 'prev' | 'next' | 'custom'
export type PrintOptions = { icons: boolean; allergen: boolean; shopping: boolean; memo: boolean }
export type Paper = 'portrait' | 'landscape'

export type PrintSettings = {
  kind: PrintKind
  range: PrintRange
  /** range가 custom일 때 고른 날짜 (주간: 그 주, 월간: 그 달) */
  customDate: string
  options: PrintOptions
  paper: Paper
  mono: boolean
}

export const PRINT_KINDS: { id: PrintKind; name: string; sub: string }[] = [
  { id: 'week', name: '주간 식단표', sub: '냉장고에 붙이기 좋은 한 장' },
  { id: 'month', name: '월간 식단표', sub: '달력 형태' },
  { id: 'report', name: '성장 리포트', sub: '섭취량 · 알레르기 기록' },
  { id: 'cube', name: '홈큐브 재고표', sub: '수량 · 소진 기한' },
  { id: 'milestone', name: '마일스톤 체크리스트', sub: '단계별 체크 · 체크한 날짜' },
]

/** 종류마다 의미 있는 '포함할 항목' */
export const OPTION_FOR: Record<PrintKind, (keyof PrintOptions)[]> = {
  week: ['icons', 'allergen', 'shopping', 'memo'],
  month: ['icons', 'allergen', 'shopping', 'memo'],
  report: ['icons', 'allergen', 'memo'],
  cube: ['icons', 'shopping', 'memo'],
  milestone: ['memo'],
}

/** 기간을 고르는 종류 (홈큐브는 오늘 기준, 마일스톤은 전체) */
export const hasRange = (kind: PrintKind) => kind === 'week' || kind === 'month' || kind === 'report'

const unit = (kind: PrintKind) => (kind === 'month' ? 'month' : 'week')

export function rangeChoices(kind: PrintKind) {
  const u = unit(kind) === 'month' ? '달' : '주'
  return [
    { id: 'current' as const, label: `이번 ${u}` },
    { id: 'prev' as const, label: `지난 ${u}` },
    { id: 'next' as const, label: `다음 ${u}` },
    { id: 'custom' as const, label: '직접 선택' },
  ]
}

/** 출력할 기간의 시작일 (주간·리포트: 월요일, 월간: 1일) */
export function periodStart(kind: PrintKind, range: PrintRange, customDate: string, today: string) {
  if (unit(kind) === 'month') {
    const base = range === 'custom' && customDate ? monthStart(customDate) : monthStart(today)
    return range === 'prev' ? addMonths(base, -1) : range === 'next' ? addMonths(base, 1) : base
  }
  const base = weekStart(range === 'custom' && customDate ? customDate : today)
  return range === 'prev' ? addDays(base, -7) : range === 'next' ? addDays(base, 7) : base
}

export const dotDate = (key: string) => key.replaceAll('-', '.')
export const shortDot = (key: string) => `${md(key).month}.${String(md(key).day).padStart(2, '0')}`

/** 인쇄 가능 영역 (A4에서 여백 12mm씩 뺀 크기, mm) */
export const PAGE_MM: Record<Paper, { w: number; h: number }> = {
  portrait: { w: 186, h: 273 },
  landscape: { w: 273, h: 186 },
}
export const PX_PER_MM = 96 / 25.4
