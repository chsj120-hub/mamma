// 추천 규칙의 안전 불변조건 테스트. 새 재료 하나씩·3일 연속·반응 재료 제외·알레르기 자동 시작 금지는
// 아기 건강과 이어지는 규칙이라, 추천 코드를 고칠 때마다 이 테스트가 통과해야 한다 (npm test).
import { describe, expect, it } from 'vitest'
import { NEW_FOOD_TEST_DAYS, STAGE_RULES } from '../data/stageGuide'
import { addDays, weekStart } from './date'
import { ALLERGENS, type IngredientId } from './ingredients'
import { mealItems } from './meal'
import { allergenCandidates, planAllergenWeeks } from './allergenPlan'
import { fillEmptyDays, suggestDayMenus } from './recommender'
import type { BabyProfile, MealPlans, StageId } from './types'

const START = '2026-11-02' // 월요일
const DAYS = 40
const dates = Array.from({ length: DAYS }, (_, i) => addDays(START, i))

const profile = (stage: StageId): BabyProfile => ({ name: '테스트', birthDate: '2026-03-17', stage, targetMl: 100, mealsPerDay: 2 })

const idsOf = (plans: MealPlans, date: string) => {
  const set = new Set<IngredientId>()
  for (const m of plans[date]?.meals ?? []) {
    mealItems(m).forEach((id) => set.add(id))
    if (m.allergen) set.add(m.allergen)
  }
  return set
}

/** 재료가 처음 나온 날짜 */
function firstSeen(plans: MealPlans) {
  const first = new Map<IngredientId, string>()
  for (const d of dates) for (const id of idsOf(plans, d)) if (!first.has(id)) first.set(id, d)
  return first
}

describe.each<StageId>(['early', 'middle', 'late'])('자동 채우기 (%s 단계)', (stage) => {
  const { plans } = fillEmptyDays({}, dates, profile(stage))
  const first = firstSeen(plans)

  it('하루에 새로 시작하는 재료는 하나뿐이다', () => {
    expect(first.size, '재료가 실제로 채워졌는지').toBeGreaterThan(3)
    for (const d of dates) {
      const started = [...idsOf(plans, d)].filter((id) => first.get(id) === d)
      expect(started.length, `${d}: ${started.join(',')}`).toBeLessThanOrEqual(1)
    }
  })

  it('새 재료는 3일 연속 이어지고, 테스트 중에는 다른 새 재료가 없다', () => {
    for (const [id, f] of first) {
      if (addDays(f, NEW_FOOD_TEST_DAYS - 1) > dates[DAYS - 1]) continue
      for (let k = 0; k < NEW_FOOD_TEST_DAYS; k++) expect(idsOf(plans, addDays(f, k)).has(id), `${id} ${f}+${k}`).toBe(true)
    }
    for (const d of dates) {
      const testing = [...idsOf(plans, d)].filter((id) => d < addDays(first.get(id)!, NEW_FOOD_TEST_DAYS))
      expect(testing.length, `${d}: ${testing.join(',')}`).toBeLessThanOrEqual(1)
    }
  })

  it('알레르기 재료를 자동으로 새로 시작하지 않는다', () => {
    for (const d of dates) expect(plans[d].meals.every((m) => !m.allergen)).toBe(true)
    for (const id of ALLERGENS) expect(first.has(id), id).toBe(false)
  })

  it('한 끼 재료 수가 단계 상한을 넘지 않는다', () => {
    const cap = STAGE_RULES[stage].itemsPerMeal
    for (const d of dates) for (const m of plans[d].meals) expect(mealItems(m).filter((id) => id !== m.base).length).toBeLessThanOrEqual(cap)
  })

  it('같은 입력이면 같은 재료 조합이 나온다', () => {
    const again = fillEmptyDays({}, dates, profile(stage)).plans
    for (const d of dates) expect([...idsOf(again, d)].sort()).toEqual([...idsOf(plans, d)].sort())
  })
})

describe('반응이 있었던 재료', () => {
  it('자동 채우기와 하루 추천 모두에서 빠진다', () => {
    const reactions: IngredientId[] = ['beef', 'carrot']
    const { plans } = fillEmptyDays({}, dates, profile('middle'), reactions)
    for (const d of dates) for (const bad of reactions) expect(idsOf(plans, d).has(bad), `${d} ${bad}`).toBe(false)
    for (const s of suggestDayMenus(plans, addDays(START, 20), profile('middle'), reactions)) {
      for (const m of s.meals) for (const bad of reactions) expect(mealItems(m).includes(bad)).toBe(false)
    }
  })
})

describe('알레르기 테스트 주간 추천', () => {
  const p = profile('middle')
  const weeks = [weekStart(START), weekStart(addDays(START, 7)), weekStart(addDays(START, 14))]

  it('반응이 있었던 재료는 후보에서 빠진다', () => {
    const all = allergenCandidates({}, p, [])
    expect(all.length).toBeGreaterThan(0)
    expect(allergenCandidates({}, p, [all[0]])).not.toContain(all[0])
  })

  it('한 주에 한 가지, 월·화·수 3일 연속, 같은 재료가 겹치지 않는다', () => {
    const { rows } = planAllergenWeeks({}, p, [], START, weeks)
    const picked = rows.map((r) => r.suggestion).filter(Boolean)
    expect(new Set(picked).size).toBe(picked.length)
    for (const r of rows) {
      expect(r.dates).toHaveLength(3)
      expect(r.dates[0]).toBe(r.weekStart) // 월요일 시작 (월·화·수)
    }
  })

  it('이미 지난 요일에서는 시작하지 않고, 그 주에 이미 테스트가 있으면 막는다', () => {
    const wed = addDays(START, 2)
    const { rows } = planAllergenWeeks({}, p, [], wed, [START])
    expect(rows[0].dates[0] >= wed).toBe(true)
    const withTest: MealPlans = { [START]: { date: START, meals: [{ id: 'x', time: '10:00', label: '오전', status: 'planned', allergen: 'egg' as IngredientId }] } }
    expect(planAllergenWeeks(withTest, p, [], START, [START]).rows[0].blocked).toBe('busy')
  })
})
