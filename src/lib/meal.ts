import { ALLERGENS, INGREDIENT_IDS, INGREDIENTS, ingredientName, type IngredientCategory, type IngredientId } from './ingredients'
import { addDays, weekStart } from './date'
import type { Meal, MealPlanDay, MealPlans } from './types'

export type SlotKey = 'base' | 'meat' | 'veggie1' | 'veggie2' | 'fruit' | 'snack' | 'allergen'

/** 식사 한 끼의 칸. allergen은 알레르기 테스트 재료 */
export const SLOTS: { key: SlotKey; label: string; categories: IngredientCategory[] | 'allergen' }[] = [
  { key: 'base', label: '베이스', categories: ['grain'] },
  { key: 'meat', label: '고기·생선', categories: ['meat'] },
  { key: 'veggie1', label: '채소 1', categories: ['veggie'] },
  { key: 'veggie2', label: '채소 2', categories: ['veggie'] },
  { key: 'fruit', label: '과일', categories: ['fruit'] },
  { key: 'snack', label: '간식', categories: ['fruit', 'grain', 'veggie'] },
  { key: 'allergen', label: '알레르기 테스트', categories: 'allergen' },
]

export function slotOptions(categories: IngredientCategory[] | 'allergen'): IngredientId[] {
  if (categories === 'allergen') return ALLERGENS
  // 알레르기 재료도 테스트를 마치면 일반 칸에 쓸 수 있어야 해서 함께 보여 준다
  return INGREDIENT_IDS.filter((id) => (categories as readonly string[]).includes(INGREDIENTS[id].category))
}

/** 하루 식사 횟수별 기본 시간표 */
export function mealTemplate(mealsPerDay: number): { time: string; label: string }[] {
  if (mealsPerDay <= 1) return [{ time: '12:00', label: '점심' }]
  if (mealsPerDay === 2) return [{ time: '10:00', label: '아침' }, { time: '17:30', label: '저녁' }]
  return [{ time: '08:30', label: '아침' }, { time: '12:30', label: '점심' }, { time: '17:30', label: '저녁' }]
}

export const newId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`)

/** 식사에 들어간 재료 (베이스 → 고기 → 채소 → 과일 → 간식 순, 알레르기 테스트 재료 제외) */
export function mealItems(m: Meal): IngredientId[] {
  return [m.base, m.meat, m.veggie1, m.veggie2, m.fruit, m.snack].filter((x): x is IngredientId => !!x)
}

/** 카드 제목: 베이스(쌀)를 뺀 주재료 */
export function mealTitle(m: Meal) {
  const names = mealItems(m)
    .filter((id) => id !== m.base)
    .map(ingredientName)
  return names.length ? names.join(' · ') : '메뉴 미정'
}

export const sortMeals = (meals: Meal[]) => [...meals].sort((a, b) => a.time.localeCompare(b.time))

export type DayStatus = 'empty' | 'planned' | 'done'

/** 하루 요약: 베이스·주재료(중복 제거), 알레르기 재료, 완료 상태 */
export function daySummary(day: MealPlanDay | undefined) {
  const meals = day?.meals ?? []
  const bases = new Set<IngredientId>()
  const mains = new Set<IngredientId>()
  for (const m of meals) for (const id of mealItems(m)) (id === m.base ? bases : mains).add(id)
  mains.forEach((id) => bases.delete(id))
  const doneCount = meals.filter((m) => m.status === 'done').length
  const status: DayStatus = meals.length === 0 ? 'empty' : doneCount === meals.length ? 'done' : 'planned'
  return {
    bases: [...bases],
    mains: [...mains],
    allergen: meals.find((m) => m.allergen)?.allergen,
    doneCount,
    mealCount: meals.length,
    status,
  }
}

/** date까지 allergen을 연속으로 테스트한 일수 */
export function allergenStreak(plans: MealPlans, date: string, allergen: IngredientId) {
  let day = 0
  while (plans[addDays(date, -day)]?.meals.some((m) => m.allergen === allergen)) day++
  return day
}

/** 이번 주(월~일) 중 소고기가 들어간 날 수 */
export function ironDaysThisWeek(plans: MealPlans, today: string) {
  const start = weekStart(today)
  let n = 0
  for (let i = 0; i < 7; i++) {
    if (plans[addDays(start, i)]?.meals.some((m) => m.meat === 'beef')) n++
  }
  return n
}

/** 오늘 테스트 중인 알레르겐과 연속 일차 (오늘 포함). 없으면 null */
export function allergenTestProgress(plans: MealPlans, today: string) {
  const allergen = plans[today]?.meals.find((m) => m.allergen)?.allergen
  if (!allergen) return null
  return { allergen, day: allergenStreak(plans, today, allergen) }
}

/** 이번 주(월~일) 식단에 들어간 채소 종류 수 */
export function veggieKindsThisWeek(plans: MealPlans, today: string) {
  const start = weekStart(today)
  const kinds = new Set<IngredientId>()
  for (let i = 0; i < 7; i++)
    for (const m of plans[addDays(start, i)]?.meals ?? []) for (const id of mealItems(m)) if (INGREDIENTS[id].category === 'veggie') kinds.add(id)
  return kinds.size
}
