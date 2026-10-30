// CSV 일괄 입력: 템플릿 만들기, 파일 읽기(인코딩 자동 판별), 줄별 검사, 식단으로 바꾸기
import { addDays, daysInMonth, todayKey, weekStart } from './date'
import { findIngredientId, ingredientName, type IngredientId } from './ingredients'
import { newId, SLOTS, slotOptions, sortMeals, type SlotKey } from './meal'
import type { Meal, MealPlans } from './types'

export const MAX_CSV_BYTES = 1_000_000
export const MAX_CSV_ROWS = 2000

/** 열 순서 (템플릿 머리글). slot이 있는 열은 재료 이름을 받는다 */
export const CSV_COLUMNS = [
  { key: 'date', header: '날짜', note: '2026-11-02 형식' },
  { key: 'label', header: '끼니', note: '아침 / 점심 / 저녁 / 간식' },
  { key: 'time', header: '시간', note: '09:30 (비우면 끼니별 기본 시간)' },
  { key: 'base', header: '베이스', slot: 'base' },
  { key: 'meat', header: '고기·생선', slot: 'meat' },
  { key: 'veggie1', header: '채소1', slot: 'veggie1' },
  { key: 'veggie2', header: '채소2', slot: 'veggie2' },
  { key: 'fruit', header: '과일', slot: 'fruit' },
  { key: 'snack', header: '간식', slot: 'snack' },
  { key: 'allergen', header: '알레르기테스트', slot: 'allergen' },
  { key: 'status', header: '상태', note: '예정 / 완료 (비우면 예정)' },
  { key: 'eatenMl', header: '먹은양(ml)', note: '완료한 끼니만' },
] as const

type ColKey = (typeof CSV_COLUMNS)[number]['key']

const LABELS = ['아침', '점심', '저녁', '간식']
const DEFAULT_TIME: Record<string, string> = { 아침: '08:30', 점심: '12:30', 저녁: '17:30', 간식: '15:00' }

/** 머리글 이름 정규화: 공백 제거, 비슷한 이름 허용 */
const ALIASES: Record<string, ColKey> = {
  날짜: 'date',
  끼니: 'label',
  시간: 'time',
  베이스: 'base',
  고기: 'meat',
  '고기·생선': 'meat',
  고기생선: 'meat',
  채소1: 'veggie1',
  채소2: 'veggie2',
  과일: 'fruit',
  간식: 'snack',
  알레르기: 'allergen',
  알레르기테스트: 'allergen',
  상태: 'status',
  먹은양: 'eatenMl',
  '먹은양(ml)': 'eatenMl',
}
const normHeader = (h: string) => h.replace(/\s+/g, '').replace(/﻿/g, '')

// ---------- 템플릿 ----------

const quote = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v)

/** 예시가 들어 있는 CSV 템플릿 (엑셀에서 한글이 깨지지 않게 맨 앞에 BOM) */
export function buildTemplate(today = todayKey()) {
  const mon = addDays(weekStart(today), 7)
  const rows: string[][] = [
    [mon, '아침', '09:00', '쌀', '소고기', '애호박', '양파', '', '', '', '예정', ''],
    [mon, '저녁', '17:30', '쌀', '소고기', '브로콜리', '', '배', '', '', '예정', ''],
    [addDays(mon, 1), '아침', '', '쌀', '닭고기', '단호박', '', '', '', '', '예정', ''],
    [addDays(mon, 1), '저녁', '', '쌀', '닭고기', '당근', '', '사과', '', '계란노른자', '예정', ''],
    [addDays(mon, 2), '아침', '', '쌀', '소고기', '시금치', '감자', '', '', '', '예정', ''],
  ]
  const lines = [CSV_COLUMNS.map((c) => c.header), ...rows].map((r) => r.map(quote).join(','))
  return '﻿' + lines.join('\r\n') + '\r\n'
}

export function downloadTemplate(today = todayKey()) {
  const blob = new Blob([buildTemplate(today)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `맘마_식단_입력_예시_${today}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ---------- 읽기 ----------

/** 파일 바이트를 글자로. UTF-8이 아니면(한국어 엑셀의 'CSV(쉼표로 분리)') EUC-KR(CP949)로 읽는다 */
export function decodeCsv(buf: ArrayBuffer) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf).replace(/^﻿/, '')
  } catch {
    return new TextDecoder('euc-kr').decode(buf)
  }
}

/** 따옴표·줄바꿈·쉼표(또는 탭)를 처리하는 CSV 분해. 빈 줄은 건너뛴다 */
export function parseCsv(text: string): { line: number; cells: string[] }[] {
  const firstLine = text.slice(0, text.search(/\r?\n|$/))
  const delim = firstLine.includes('\t') && !firstLine.includes(',') ? '\t' : ','
  const out: { line: number; cells: string[] }[] = []
  let cells: string[] = []
  let cur = ''
  let inQuotes = false
  let line = 1
  let startLine = 1
  const endCell = () => {
    cells.push(cur)
    cur = ''
  }
  const endRow = () => {
    endCell()
    if (cells.some((c) => c.trim() !== '')) out.push({ line: startLine, cells })
    cells = []
  }
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') (cur += '"', i++)
        else inQuotes = false
      } else {
        if (ch === '\n') line++
        cur += ch
      }
    } else if (ch === '"') inQuotes = true
    else if (ch === delim) endCell()
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      endRow()
      line++
      startLine = line
    } else cur += ch
  }
  if (cur !== '' || cells.length) endRow()
  return out
}

// ---------- 검사 ----------

export type CsvIssue = { line: number; message: string }
export type CsvMeal = { line: number; date: string; meal: Meal }
export type CsvCheck = {
  /** 날짜별로 정상인 끼니 (오류가 있는 날짜는 통째로 빠진다) */
  days: Map<string, CsvMeal[]>
  errors: CsvIssue[]
  warnings: CsvIssue[]
  /** 오류 때문에 통째로 건너뛰는 날짜 */
  skippedDates: string[]
  totalRows: number
}

function normDate(raw: string): string | null {
  const m = raw.trim().match(/^(\d{4})\D+(\d{1,2})\D+(\d{1,2})\D*$/)
  if (!m) return null
  const y = +m[1]
  const mo = +m[2]
  const d = +m[3]
  if (mo < 1 || mo > 12 || d < 1) return null
  const key = `${y}-${String(mo).padStart(2, '0')}-01`
  if (d > daysInMonth(key)) return null
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function normTime(raw: string): string | null {
  const m = raw.trim().match(/^(\d{1,2}):(\d{1,2})(?::\d{2})?$/)
  if (!m || +m[1] > 23 || +m[2] > 59) return null
  return `${m[1].padStart(2, '0')}:${m[2].padStart(2, '0')}`
}

/** 재료 이름 목록이 길어서 오류 문구엔 해당 열에서 고를 수 있는 이름 몇 개만 보여 준다 */
function slotHint(slot: SlotKey) {
  const def = SLOTS.find((s) => s.key === slot)!
  const names = slotOptions(def.categories).map(ingredientName)
  return names.length > 8 ? `${names.slice(0, 8).join(', ')} 등` : names.join(', ')
}

/** defaultTime: 시간 칸이 비었을 때 끼니 이름으로 기본 시간을 정한다 (설정한 식사 시간) */
export function checkCsv(rows: { line: number; cells: string[] }[], today = todayKey(), defaultTime?: (label: string) => string | undefined): CsvCheck {
  const errors: CsvIssue[] = []
  const warnings: CsvIssue[] = []
  const empty: CsvCheck = { days: new Map(), errors, warnings, skippedDates: [], totalRows: 0 }
  if (rows.length === 0) return { ...empty, errors: [{ line: 1, message: '파일이 비어 있어요.' }] }

  // 머리글 → 열 번호
  const head = rows[0].cells.map((h) => ALIASES[normHeader(h)])
  const col = {} as Record<ColKey, number>
  head.forEach((k, i) => k && !(k in col) && (col[k] = i))
  const missing = CSV_COLUMNS.filter((c) => (c.key === 'date' || c.key === 'label') && !(c.key in col))
  if (missing.length) {
    return { ...empty, errors: [{ line: rows[0].line, message: `머리글에 '${missing.map((m) => m.header).join("', '")}' 열이 없어요. 예시 파일의 첫 줄을 그대로 써 주세요.` }] }
  }
  const unknown = rows[0].cells.filter((h, i) => h.trim() && !head[i])
  if (unknown.length) warnings.push({ line: rows[0].line, message: `알 수 없는 열은 무시해요: ${unknown.join(', ')}` })

  const body = rows.slice(1)
  if (body.length > MAX_CSV_ROWS) {
    return { ...empty, totalRows: body.length, errors: [{ line: 1, message: `한 번에 ${MAX_CSV_ROWS}줄까지 넣을 수 있어요. (지금 ${body.length}줄)` }] }
  }

  const get = (cells: string[], k: ColKey) => (k in col ? (cells[col[k]] ?? '').trim() : '')
  const byDate = new Map<string, CsvMeal[]>()
  const badDates = new Set<string>()
  const rowErrorsByLine = new Map<number, string[]>()
  const labelSeen = new Set<string>()

  for (const { line, cells } of body) {
    const errs: string[] = []
    const dateRaw = get(cells, 'date')
    const date = normDate(dateRaw)
    if (!date) errs.push(`날짜 '${dateRaw}'을(를) 읽을 수 없어요 (예: 2026-11-02)`)

    const label = get(cells, 'label')
    if (!LABELS.includes(label)) errs.push(`끼니 '${label}'은(는) 아침·점심·저녁·간식 중 하나여야 해요`)

    let time = defaultTime?.(label) ?? DEFAULT_TIME[label] ?? '12:00'
    const timeRaw = get(cells, 'time')
    if (timeRaw) {
      const t = normTime(timeRaw)
      if (t) time = t
      else errs.push(`시간 '${timeRaw}'을 읽을 수 없어요 (예: 09:30)`)
    }

    const meal: Meal = { id: newId(), time, label, status: 'planned' }
    for (const c of CSV_COLUMNS) {
      if (!('slot' in c)) continue
      const name = get(cells, c.key)
      if (!name) continue
      const id = findIngredientId(name)
      const def = SLOTS.find((s) => s.key === c.slot)!
      if (!id) errs.push(`${c.header}: '${name}'은(는) 목록에 없는 재료예요 (예: ${slotHint(c.slot)})`)
      else if (!slotOptions(def.categories).includes(id)) errs.push(`${c.header}: '${name}'은(는) 이 열에 넣을 수 없어요 (예: ${slotHint(c.slot)})`)
      else (meal as Record<string, unknown>)[c.slot] = id as IngredientId
    }

    const status = get(cells, 'status')
    if (status && !['예정', '완료'].includes(status)) errs.push(`상태 '${status}'은(는) 예정 또는 완료여야 해요`)
    if (status === '완료') meal.status = 'done'

    const ml = get(cells, 'eatenMl')
    if (ml) {
      const n = Number(ml.replace(/ml$/i, ''))
      if (!Number.isFinite(n) || n < 0 || n > 500) errs.push(`먹은양 '${ml}'은 0~500 사이 숫자여야 해요`)
      else if (meal.status === 'done') meal.eatenMl = Math.round(n)
      else warnings.push({ line, message: '먹은양은 상태가 완료일 때만 저장해요 (이 값은 무시)' })
    }

    if (date && LABELS.includes(label)) {
      const k = `${date}|${label}`
      if (labelSeen.has(k)) warnings.push({ line, message: `${date} ${label}이(가) 두 번 나와요 (둘 다 넣어요)` })
      labelSeen.add(k)
    }

    if (errs.length) {
      rowErrorsByLine.set(line, errs)
      errs.forEach((message) => errors.push({ line, message }))
      if (date) badDates.add(date)
    } else if (date) {
      if (date < today) warnings.push({ line, message: `${date}은 지난 날짜예요` })
      byDate.set(date, [...(byDate.get(date) ?? []), { line, date, meal }])
    }
  }

  const skippedDates = [...badDates].sort()
  for (const d of skippedDates) byDate.delete(d)
  if (skippedDates.length) warnings.push({ line: 0, message: `오류가 있는 줄이 포함된 날짜는 통째로 건너뛰어요: ${skippedDates.join(', ')}` })

  return { days: byDate, errors, warnings, skippedDates, totalRows: body.length }
}

// ---------- 식단에 넣기 ----------

export type ImportMode = 'skip' | 'replace'

/** 이미 식단이 있는 날은 건너뛰거나(skip) CSV 내용으로 바꾼다(replace) */
export function applyCsv(plans: MealPlans, check: CsvCheck, mode: ImportMode) {
  const next: MealPlans = { ...plans }
  let days = 0
  let meals = 0
  const skippedExisting: string[] = []
  for (const [date, rows] of check.days) {
    if (mode === 'skip' && plans[date]?.meals.length) {
      skippedExisting.push(date)
      continue
    }
    next[date] = { date, meals: sortMeals(rows.map((r) => r.meal)) }
    days++
    meals += rows.length
  }
  return { plans: next, days, meals, skippedExisting: skippedExisting.sort() }
}
