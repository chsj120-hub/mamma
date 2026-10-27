// 규칙 기반 자동 식단 채우기 (외부 API 없음, 같은 입력이면 항상 같은 결과)
// 기준표: src/data/stageGuide.ts(단계별 규칙), src/data/ingredientIntro.ts(재료 도입 단계·순서)
//
// 하드 규칙
// - 새 재료는 한 번에 하나, 같은 재료를 3일 연속. 테스트 중엔 다른 새 재료를 넣지 않는다
// - 알레르기 재료는 자동으로 새로 시작하지 않는다(부모가 고르도록 안내 카드로 권함). 부모가 넣은 테스트는 3일까지 이어 준다
// - 새 재료는 첫 끼(오전)에 넣어 낮 동안 반응을 볼 수 있게 한다
// - 섞는 재료는 3일 테스트를 통과한 것만, 지금 단계까지 열린 것만, 반응 있었던 재료는 제외
// - 한 끼 재료 수는 단계별 상한(베이스 쌀 제외)
// 소프트 규칙
// - 소고기(철분)는 거의 매일. 이틀 연속이었으면 다른 통과한 단백질로 쉬어 간다
// - 전날 먹은 채소는 피한다(다양성), 과일은 마지막 끼니에
import { INGREDIENT_INTRO } from '../data/ingredientIntro'
import { NEW_FOOD_TEST_DAYS, STAGE_RULES } from '../data/stageGuide'
import { addDays, daysBetween } from './date'
import { ALLERGENS, INGREDIENT_IDS, INGREDIENTS, type IngredientId } from './ingredients'
import { mealItems, mealTemplate, newId } from './meal'
import { STAGE_IDS } from './stage'
import type { BabyProfile, Meal, MealPlans, StageId } from './types'

const BASE: IngredientId = 'rice'

/** 그날 식단에 들어간 재료 (알레르기 테스트 칸 포함) */
function dayIngredients(plans: MealPlans, date: string) {
  const set = new Set<IngredientId>()
  for (const m of plans[date]?.meals ?? []) {
    mealItems(m).forEach((id) => set.add(id))
    if (m.allergen) set.add(m.allergen)
  }
  return set
}

/** date 전날까지의 기록으로 본 재료 상태 */
export function ingredientProgress(plans: MealPlans, date: string) {
  const dates = Object.keys(plans)
    .filter((d) => d < date)
    .sort()
  const runs = new Map<IngredientId, { best: number; current: number; lastDate: string }>()
  for (const d of dates) {
    for (const id of dayIngredients(plans, d)) {
      const r = runs.get(id)
      const cur = r && addDays(r.lastDate, 1) === d ? r.current + 1 : 1
      runs.set(id, { best: Math.max(r?.best ?? 0, cur), current: cur, lastDate: d })
    }
  }
  const yesterday = addDays(date, -1)
  const passed = new Set<IngredientId>()
  let testing: { id: IngredientId; day: number } | null = null
  for (const [id, r] of runs) {
    if (r.best >= NEW_FOOD_TEST_DAYS) passed.add(id)
    else if (r.lastDate === yesterday && (!testing || INGREDIENT_INTRO[id].order < INGREDIENT_INTRO[testing.id].order)) testing = { id, day: r.current }
  }
  return { passed, testing }
}

const stageRank = (s: StageId) => STAGE_IDS.indexOf(s)

/** 지금 단계까지 열린 재료 중 아직 통과 못 한 재료들 (단계 → 순서) */
export function upcomingIngredients(stage: StageId, passed: Set<IngredientId>, reactions: IngredientId[]) {
  return INGREDIENT_IDS.filter((id) => stageRank(INGREDIENT_INTRO[id].stage) <= stageRank(stage) && !passed.has(id) && !reactions.includes(id)).sort(
    (a, b) => stageRank(INGREDIENT_INTRO[a].stage) - stageRank(INGREDIENT_INTRO[b].stage) || INGREDIENT_INTRO[a].order - INGREDIENT_INTRO[b].order,
  )
}

/** 자동 채우기가 다음에 시작할 새 재료 (알레르기 재료 제외) */
export function nextNewIngredient(stage: StageId, passed: Set<IngredientId>, reactions: IngredientId[]) {
  return upcomingIngredients(stage, passed, reactions).find((id) => !ALLERGENS.includes(id))
}

/** 재료를 끼니 칸에 넣는다. 알레르기 재료는 알레르기 테스트 칸, 나머지는 분류에 맞는 빈 칸 */
function place(meal: Meal, id: IngredientId) {
  if (ALLERGENS.includes(id)) return void (meal.allergen = id)
  const cat = INGREDIENTS[id].category
  if (cat === 'grain') return void (id === BASE ? (meal.base = id) : !meal.snack && (meal.snack = id))
  if (cat === 'meat') return void (meal.meat ? !meal.snack && (meal.snack = id) : (meal.meat = id))
  if (cat === 'fruit') return void (meal.fruit ? !meal.snack && (meal.snack = id) : (meal.fruit = id))
  if (!meal.veggie1) meal.veggie1 = id
  else if (!meal.veggie2) meal.veggie2 = id
  else if (!meal.snack) meal.snack = id
}

/** 베이스 쌀을 뺀 재료 수 (알레르기 테스트 칸 포함) */
const countItems = (m: Meal) => mealItems(m).filter((id) => id !== m.base).length + (m.allergen ? 1 : 0)

/** dates 중 식단이 비어 있는 날만 채운다. 채운 날짜 목록도 돌려준다 */
export function fillEmptyDays(plans: MealPlans, dates: string[], profile: BabyProfile, reactions: IngredientId[] = []) {
  const out: MealPlans = { ...plans }
  const filled: string[] = []
  const rule = STAGE_RULES[profile.stage]
  const usable = (id: IngredientId) => stageRank(INGREDIENT_INTRO[id].stage) <= stageRank(profile.stage) && !reactions.includes(id)

  for (const date of [...dates].sort()) {
    if (out[date]?.meals.length) continue
    const n = daysBetween('2026-01-01', date)
    const { passed, testing } = ingredientProgress(out, date)

    // 오늘의 새 재료: 테스트 중인 게 있으면 이어서, 없으면 순서상 다음 재료
    const fresh = testing && !reactions.includes(testing.id) ? testing.id : nextNewIngredient(profile.stage, passed, reactions)
    const known = (id: IngredientId) => passed.has(id) && usable(id) && id !== fresh

    const yesterday = dayIngredients(out, addDays(date, -1))
    const beefStreak = [1, 2].filter((k) => out[addDays(date, -k)]?.meals.some((m) => m.meat === 'beef')).length
    // 3일 테스트를 통과한 단백질만 (알레르기 재료라도 통과했으면 사용)
    const proteins = INGREDIENT_IDS.filter((id) => INGREDIENTS[id].category === 'meat' && known(id))
    const altProteins = proteins.filter((id) => id !== 'beef')
    const meat = known('beef') && (beefStreak < 2 || altProteins.length === 0) ? 'beef' : altProteins[n % Math.max(1, altProteins.length)]

    const vegPool = INGREDIENT_IDS.filter((id) => INGREDIENTS[id].category === 'veggie' && known(id))
    const fresher = vegPool.filter((id) => !yesterday.has(id))
    const vegs = fresher.length ? fresher : vegPool
    const fruits = INGREDIENT_IDS.filter((id) => INGREDIENTS[id].category === 'fruit' && known(id))

    const template = mealTemplate(profile.mealsPerDay)
    const meals: Meal[] = template.map((t, i) => {
      const meal: Meal = { id: newId(), ...t, status: 'planned' }
      if (known(BASE) || fresh === BASE) meal.base = BASE
      // 새 재료는 첫 끼에만 (쌀 자체를 테스트 중이면 모든 끼니 베이스로 이미 들어감)
      if (i === 0 && fresh && fresh !== BASE) place(meal, fresh)
      const last = i === template.length - 1
      const room = () => rule.itemsPerMeal - countItems(meal)
      if (meat && room() > 0 && !meal.meat) meal.meat = meat
      // 채소는 두 칸까지. 마지막 끼니는 채소와 과일이 둘 다 들어갈 자리가 있을 때만 과일 자리를 남긴다
      const wantFruit = last && fruits.length > 0 && !meal.fruit && (vegs.length === 0 || room() >= 2)
      for (let k = 0; k < vegs.length && !meal.veggie2 && room() > (wantFruit ? 1 : 0); k++) {
        const v = vegs[(n * 3 + i * 2 + k) % vegs.length]
        if (v !== meal.veggie1) place(meal, v)
      }
      if (wantFruit && room() > 0) meal.fruit = fruits[n % fruits.length]
      return meal
    })
    out[date] = { date, meals }
    filled.push(date)
  }
  return { plans: out, filled }
}
