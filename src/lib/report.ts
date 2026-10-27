// 성장 리포트 계산 (주간 섭취량, 단계 진행도, 재료 3일 테스트 기록)
import { addDays, dayCount, daysInMonth, md, weekStart } from './date'
import { ALLERGENS, INGREDIENT_IDS, INGREDIENTS, type IngredientCategory, type IngredientId } from './ingredients'
import { mealItems } from './meal'
import type { BabyProfile, MealPlans, StageId } from './types'

/** 그 주(월요일 시작) 7일의 섭취량. ml은 기록이 없으면 null */
export function weekIntake(plans: MealPlans, start: string) {
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i)
    return { date, ...dayIntake(plans, date) }
  })
}

/** '10월 4주차' — 그 주 월요일이 속한 달의 몇 번째 월요일인지 */
export function weekLabel(start: string) {
  const { month, day } = md(start)
  return `${month}월 ${Math.ceil(day / 7)}주차`
}

const DAYS_PER_MONTH = 30.44

/** 진행 막대 3칸: 초기 / 중기 / 후기·완료기 */
export const STAGE_BARS: { stages: StageId[]; name: string; desc: string; fromMonth: number; months: number }[] = [
  { stages: ['early'], name: '초기', desc: '6개월 · 미음', fromMonth: 6, months: 1 },
  { stages: ['middle'], name: '중기', desc: '7~8개월 · 죽', fromMonth: 7, months: 2 },
  { stages: ['late', 'complete'], name: '후기·완료기', desc: '9~12개월 · 무른 밥·진밥', fromMonth: 9, months: 4 },
]

/** 각 칸의 채움 비율(0~1)과 현재 칸 여부. 현재 단계 칸은 월령으로 진행도를 계산한다 */
export function stageProgress(profile: BabyProfile, today: string) {
  const current = STAGE_BARS.findIndex((b) => b.stages.includes(profile.stage))
  const months = dayCount(profile.birthDate, today) / DAYS_PER_MONTH
  return STAGE_BARS.map((b, i) => ({
    ...b,
    current: i === current,
    fill: i < current ? 1 : i > current ? 0 : Math.min(1, Math.max(0.05, (months - b.fromMonth) / b.months)),
  }))
}

export type TestStatus = 'reaction' | 'passed' | 'running' | 'short' | 'planned' | 'untried'

const TEST_DAYS = 3

/**
 * 재료별 3일 테스트 기록. 오늘까지 식단에 처음 나온 날부터 며칠 연속으로 먹였는지 센다.
 * (알레르기 재료는 알레르기 테스트 칸, 그 외 재료는 일반 칸 기준)
 */
export function ingredientTests(plans: MealPlans, today: string, reactions: IngredientId[]) {
  const dates = Object.keys(plans).sort()
  const has = (date: string, id: IngredientId) =>
    plans[date]?.meals.some((m) => m.allergen === id || mealItems(m).includes(id)) ?? false

  const rows = INGREDIENT_IDS.map((id) => {
    const first = dates.find((d) => d <= today && has(d, id))
    const future = dates.some((d) => d > today && has(d, id))
    let days = 0
    if (first) while (days < TEST_DAYS && addDays(first, days) <= today && has(addDays(first, days), id)) days++
    const lastCounted = first ? addDays(first, days - 1) : null

    let status: TestStatus
    if (reactions.includes(id)) status = 'reaction'
    else if (!first) status = future ? 'planned' : 'untried'
    else if (days >= TEST_DAYS) status = 'passed'
    else if (lastCounted === today) status = 'running'
    else status = 'short'
    const next = first ? undefined : dates.find((d) => d > today && has(d, id))
    return { id, first, next, days, status, allergen: ALLERGENS.includes(id) }
  })

  // 처음 먹인 순서, 시도 전 알레르기 재료는 뒤에 붙인다. 시도 전 일반 재료는 숨긴다
  const order: Record<TestStatus, number> = { reaction: 0, running: 1, short: 2, passed: 3, planned: 4, untried: 5 }
  return rows
    .filter((r) => r.status !== 'untried' || r.allergen)
    .sort((a, b) => order[a.status] - order[b.status] || (a.first ?? '9').localeCompare(b.first ?? '9'))
}

export const TEST_DAYS_TOTAL = TEST_DAYS

// ---- PC 리포트: 기간(주간·월간) 집계. '먹은 것'은 완료(done)한 끼니 기준, 오늘 이후는 세지 않는다 ----

export type Period = 'week' | 'month'

/** 기간의 날짜들 (주간: 월~일, 월간: 1일~말일) */
export function periodDates(period: Period, start: string) {
  const n = period === 'week' ? 7 : daysInMonth(start)
  return Array.from({ length: n }, (_, i) => addDays(start, i))
}

const doneMeals = (plans: MealPlans, date: string) => plans[date]?.meals.filter((m) => m.status === 'done') ?? []

/** 재료별 처음 먹은 날 (완료한 끼니 기준, 전체 기간) */
export function firstEatenDates(plans: MealPlans) {
  const first = new Map<IngredientId, string>()
  for (const date of Object.keys(plans).sort())
    for (const m of doneMeals(plans, date))
      for (const id of [...mealItems(m), ...(m.allergen ? [m.allergen] : [])]) if (!first.has(id)) first.set(id, date)
  return first
}

export function periodSummary(plans: MealPlans, dates: string[], today: string) {
  const past = dates.filter((d) => d <= today)
  const intake = dates.map((d) => ({ date: d, ...dayIntake(plans, d) }))
  const recorded = intake.filter((d) => d.date <= today && d.ml != null)
  const avgMl = recorded.length ? Math.round(recorded.reduce((n, d) => n + d.ml!, 0) / recorded.length) : null
  // 철분은 '먹은 날' 중 소고기를 먹은 날 (기록이 듬성듬성해도 비율이 왜곡되지 않게)
  const eatenDays = past.filter((d) => doneMeals(plans, d).length > 0).length
  const ironDays = past.filter((d) => doneMeals(plans, d).some((m) => m.meat === 'beef')).length
  const due = past.flatMap((d) => plans[d]?.meals ?? [])
  const done = due.filter((m) => m.status === 'done').length
  const first = firstEatenDates(plans)
  const newOnes = [...first].filter(([, d]) => d >= dates[0] && d <= dates[dates.length - 1] && d <= today).map(([id]) => id)
  return { avgMl, recordedDays: recorded.length, ironDays, eatenDays, totalDays: dates.length, mealsDue: due.length, mealsDone: done, newOnes }
}

function dayIntake(plans: MealPlans, date: string) {
  const meals = plans[date]?.meals ?? []
  const rec = meals.filter((m) => m.eatenMl != null)
  return { ml: rec.length ? rec.reduce((n, m) => n + (m.eatenMl ?? 0), 0) : null, iron: meals.some((m) => m.meat === 'beef') }
}

/** 월간 막대: 그 달에 걸친 주(월요일 시작)마다 기록한 날의 하루 평균 */
export function monthWeekBars(plans: MealPlans, month: string, today: string) {
  const end = addDays(month, daysInMonth(month) - 1)
  const bars: { label: string; ml: number | null; iron: boolean; from: string; to: string }[] = []
  for (let ws = weekStart(month), i = 1; ws <= end; ws = addDays(ws, 7), i++) {
    const days = Array.from({ length: 7 }, (_, k) => addDays(ws, k)).filter((d) => d >= month && d <= end && d <= today)
    const rec = days.map((d) => dayIntake(plans, d)).filter((x) => x.ml != null)
    const ironDays = days.filter((d) => doneMeals(plans, d).some((m) => m.meat === 'beef')).length
    bars.push({
      label: `${i}주`,
      ml: rec.length ? Math.round(rec.reduce((n, x) => n + x.ml!, 0) / rec.length) : null,
      // 그 주 먹은 날의 절반 이상 소고기를 먹었으면 철분 포함으로 칠한다
      iron: days.length > 0 && ironDays * 2 >= days.length,
      from: days[0] ?? ws,
      to: days[days.length - 1] ?? ws,
    })
  }
  return bars
}

export const CATEGORY_GROUPS: { key: IngredientCategory; name: string; icon: IngredientId }[] = [
  { key: 'meat', name: '고기·생선', icon: 'beef' },
  { key: 'veggie', name: '채소', icon: 'broccoli' },
  { key: 'fruit', name: '과일', icon: 'apple' },
  { key: 'grain', name: '곡물', icon: 'rice' },
]

/** 분류별 섭취 횟수 (완료한 끼니에 들어간 재료 1개 = 1회) */
export function categoryCounts(plans: MealPlans, dates: string[], today: string) {
  const counts: Record<IngredientCategory, number> = { meat: 0, veggie: 0, fruit: 0, grain: 0, etc: 0 }
  for (const d of dates) if (d <= today) for (const m of doneMeals(plans, d)) for (const id of mealItems(m)) counts[INGREDIENTS[id].category]++
  return CATEGORY_GROUPS.map((g) => ({ ...g, n: counts[g.key] }))
}

/** 먹어 본 재료 (완료한 끼니 기준, 처음 먹은 순) */
export const triedIngredients = (plans: MealPlans) => [...firstEatenDates(plans)].map(([id]) => id)
