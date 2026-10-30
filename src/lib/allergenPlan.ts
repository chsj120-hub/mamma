// 알레르기 테스트를 주별로 추천해 넣는 계산.
// - 기본은 월·화·수 3일 연속 (이상 반응이 있어도 평일에 병원 진료를 받기 쉽도록). 월요일이 지났으면 화~목, 수요일부터면 수~금
// - 이미 3일 테스트를 마쳤거나(passed) 이미 일정이 잡혔거나 반응이 있었던 재료는 뺀다
// - 한 주에 한 가지만, 그날 첫 끼(오전)에 넣어 낮 동안 반응을 볼 수 있게 한다
// - 자동으로 확정하지 않는다: 화면에서 부모가 고르고 확인한 것만 넣는다 (AiFillSheet)
import { addDays, weekStart } from './date'
import { ALLERGENS, type IngredientId } from './ingredients'
import { mealSlots, sortMeals } from './meal'
import { ingredientProgress, upcomingIngredients } from './recommender'
import type { BabyProfile, MealPlans } from './types'

/** 3일 연속 테스트 */
const TEST_DAYS = 3
/** 월·화·수 중에서만 시작한다 (3일 뒤가 금요일까지) */
const START_OFFSETS = [0, 1, 2]

/** 지금 단계에서 추천할 수 있는 알레르기 재료 (도입 순서대로) */
export function allergenCandidates(plans: MealPlans, profile: BabyProfile, reactions: IngredientId[]): IngredientId[] {
  // 아주 먼 날짜 기준으로 계산하면 지금까지(계획 포함) 3일 테스트를 마친 재료가 모두 passed에 들어온다
  const { passed } = ingredientProgress(plans, '2100-01-01')
  const scheduled = new Set<IngredientId>()
  for (const day of Object.values(plans)) for (const m of day.meals) if (m.allergen) scheduled.add(m.allergen)
  return upcomingIngredients(profile.stage, passed, reactions).filter((id) => ALLERGENS.includes(id) && !scheduled.has(id))
}

export type AllergenWeekRow = {
  /** 그 주 월요일 */
  weekStart: string
  /** 테스트할 3일 (연속). 시작할 수 있는 날이 없으면 빈 배열 */
  dates: string[]
  /** 이 주에 못 넣는 이유 */
  blocked?: 'past' | 'busy'
  /** 추천 기본값 (고를 수 있을 때) */
  suggestion?: IngredientId
}

const hasAllergen = (plans: MealPlans, date: string) => plans[date]?.meals.some((m) => m.allergen) ?? false

/** 날짜 목록이 걸쳐 있는 주(월요일)들 */
export const weeksCovering = (dates: string[]) => [...new Set(dates.map(weekStart))].sort()

/** weekStarts(월요일 목록)마다 테스트를 넣을 수 있는지와 기본 추천 재료를 정한다 */
export function planAllergenWeeks(plans: MealPlans, profile: BabyProfile, reactions: IngredientId[], today: string, weekStarts: string[]) {
  const candidates = allergenCandidates(plans, profile, reactions)
  const queue = [...candidates]
  const rows: AllergenWeekRow[] = [...new Set(weekStarts)].sort().map((ws) => {
    const start = START_OFFSETS.map((o) => addDays(ws, o)).find((d) => d >= today)
    if (!start) return { weekStart: ws, dates: [], blocked: 'past' as const }
    const dates = Array.from({ length: TEST_DAYS }, (_, i) => addDays(start, i))
    // 그 주(앞 이틀 포함)에 이미 알레르기 테스트가 있으면 겹치지 않게 비워 둔다
    const busy = Array.from({ length: 9 }, (_, i) => addDays(ws, i - 2)).some((d) => hasAllergen(plans, d))
    if (busy) return { weekStart: ws, dates, blocked: 'busy' as const }
    return { weekStart: ws, dates, suggestion: queue.shift() }
  })
  return { rows, candidates }
}

/** 고른 (날짜 → 알레르기 재료) 표를 만든다. picks: 주 월요일 → 재료 */
export function allergenByDate(rows: AllergenWeekRow[], picks: Record<string, IngredientId | ''>) {
  const out: Record<string, IngredientId> = {}
  for (const r of rows) {
    const id = picks[r.weekStart]
    if (id && !r.blocked) for (const d of r.dates) out[d] = id
  }
  return out
}

/** 이미 식단이 있는 날에는 첫 끼에 알레르기 테스트를 얹는다. (빈 날은 AI 채우기가 직접 만든다 — fillEmptyDays) */
export function overlayAllergen(plans: MealPlans, byDate: Record<string, IngredientId>): MealPlans {
  const out: MealPlans = { ...plans }
  for (const [date, allergen] of Object.entries(byDate)) {
    const day = out[date]
    if (!day) continue
    const meals = sortMeals(day.meals)
    if (meals.length === 0 || meals.some((m) => m.allergen)) continue
    meals[0] = { ...meals[0], allergen }
    out[date] = { ...day, meals }
  }
  return out
}

/** 설정한 첫 끼니 시간 (안내 문구용: 예 '오전 10:00') */
export const firstMealTime = (profile: BabyProfile) => mealSlots(profile)[0]?.time

