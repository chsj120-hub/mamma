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
// - 끼니 반응(taste)을 기록했다면, 잘 먹음보다 거부가 2번 이상 많은 채소·과일은 순서를 뒤로 미룬다
//   (빼지는 않는다: 새 음식은 8~10번 다시 시도해 보라는 안내와 맞추기 위해 덜 자주 넣을 뿐이다)
import { INGREDIENT_INTRO } from '../data/ingredientIntro'
import { NEW_FOOD_TEST_DAYS, STAGE_RULES } from '../data/stageGuide'
import { addDays, daysBetween } from './date'
import { ALLERGENS, INGREDIENT_IDS, INGREDIENTS, ingredientName, type IngredientId } from './ingredients'
import { mealItems, mealSlots, newId } from './meal'
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

/** 재료별 반응 점수: 잘 먹음 +1, 거부 -1 (조금 먹음은 0). date 전날까지의 기록만 센다 */
export function tasteScores(plans: MealPlans, date: string) {
  const score = new Map<IngredientId, number>()
  for (const [d, day] of Object.entries(plans)) {
    if (d >= date) continue
    for (const m of day.meals) {
      if (!m.taste || m.taste === 'some') continue
      const delta = m.taste === 'good' ? 1 : -1
      for (const id of mealItems(m)) score.set(id, (score.get(id) ?? 0) + delta)
    }
  }
  return score
}

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

/** 같은 날에 대한 추천 변형. shift는 재료를 돌려 고르는 위치를 옮기고, prefer는 먼저 쓸 재료(임박 큐브 등) */
type Variant = { shift: number; altProtein: boolean; prefer: IngredientId[] }
const PLAIN: Variant = { shift: 0, altProtein: false, prefer: [] }

/**
 * 하루 식단을 만든다. 규칙은 파일 맨 위 설명과 같고, variant로 같은 규칙 안에서 다른 조합을 고른다.
 * plans에는 date 이후 날짜가 있어도 되고(전날까지의 기록만 본다), date 자신은 비어 있다고 보고 계산한다.
 */
function buildDay(plans: MealPlans, date: string, profile: BabyProfile, reactions: IngredientId[], variant: Variant = PLAIN, forceFresh?: IngredientId) {
  const rule = STAGE_RULES[profile.stage]
  const usable = (id: IngredientId) => stageRank(INGREDIENT_INTRO[id].stage) <= stageRank(profile.stage) && !reactions.includes(id)
  const n = daysBetween('2026-01-01', date) + variant.shift * 7
  const { passed, testing } = ingredientProgress(plans, date)

  // 오늘의 새 재료: 테스트 중인 게 있으면 이어서, 없으면 순서상 다음 재료
  // (forceFresh: 부모가 그날 직접 넣어 둔 알레르기 테스트. 이어서 쓰고 다른 새 재료는 더하지 않는다)
  const fresh = forceFresh ?? (testing && !reactions.includes(testing.id) ? testing.id : nextNewIngredient(profile.stage, passed, reactions))
  const known = (id: IngredientId) => passed.has(id) && usable(id) && id !== fresh
  const firstPrefer = (ids: IngredientId[]) => [...ids].sort((a, b) => Number(variant.prefer.includes(b)) - Number(variant.prefer.includes(a)))

  const yesterday = dayIngredients(plans, addDays(date, -1))
  const beefStreak = [1, 2].filter((k) => plans[addDays(date, -k)]?.meals.some((m) => m.meat === 'beef')).length
  // 3일 테스트를 통과한 단백질만 (알레르기 재료라도 통과했으면 사용)
  const proteins = INGREDIENT_IDS.filter((id) => INGREDIENTS[id].category === 'meat' && known(id))
  const altProteins = firstPrefer(proteins.filter((id) => id !== 'beef'))
  const preferredMeat = variant.prefer.find((id) => proteins.includes(id))
  const meat: IngredientId | undefined =
    preferredMeat ??
    (variant.altProtein && altProteins.length
      ? altProteins[n % altProteins.length]
      : known('beef') && (beefStreak < 2 || altProteins.length === 0)
        ? 'beef'
        : altProteins[n % Math.max(1, altProteins.length)])

  const vegPool = INGREDIENT_IDS.filter((id) => INGREDIENTS[id].category === 'veggie' && known(id))
  const fresher = vegPool.filter((id) => !yesterday.has(id))
  const taste = tasteScores(plans, date)
  const refusedLast = (ids: IngredientId[]) => [...ids].sort((a, b) => Number((taste.get(a) ?? 0) <= -2) - Number((taste.get(b) ?? 0) <= -2))
  const vegs = refusedLast(firstPrefer(fresher.length ? fresher : vegPool))
  const fruits = refusedLast(firstPrefer(INGREDIENT_IDS.filter((id) => INGREDIENTS[id].category === 'fruit' && known(id))))
  const startAt = variant.prefer.length ? 0 : n * 3 // 먼저 쓸 재료가 있으면 그 재료부터, 아니면 날짜·변형에 따라 돌려 고른다

  const template = mealSlots(profile)
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
      const v = vegs[(startAt + i * 2 + k) % vegs.length]
      if (v !== meal.veggie1) place(meal, v)
    }
    if (wantFruit && room() > 0) meal.fruit = fruits[(variant.prefer.length ? 0 : n) % fruits.length]
    return meal
  })

  // 추천 이유 (화면에 짧게 보여 준다)
  const used = new Set(meals.flatMap(mealItems))
  const reasons: string[] = []
  if (fresh && fresh !== BASE) reasons.push(`새 재료 ${ingredientName(fresh)} ${(testing?.id === fresh ? testing.day : 0) + 1}일차`)
  if (meat === 'beef') reasons.push('철분 공급(소고기)')
  else if (meat) reasons.push(`${ingredientName(meat)}로 단백질 바꾸기`)
  const overlap = [...used].filter((id) => id !== BASE && yesterday.has(id) && INGREDIENTS[id].category === 'veggie')
  if (overlap.length === 0 && used.size > 1) reasons.push('어제와 겹치는 채소가 없어요')
  const useful = variant.prefer.filter((id) => used.has(id))
  if (useful.length) reasons.unshift(`임박 큐브 ${useful.map(ingredientName).join('·')} 먼저 쓰기`)
  return { meals, reasons, fresh }
}

/** dates 중 식단이 비어 있는 날만 채운다. 채운 날짜 목록도 돌려준다 */
export function fillEmptyDays(plans: MealPlans, dates: string[], profile: BabyProfile, reactions: IngredientId[] = [], allergenByDate: Record<string, IngredientId> = {}) {
  const out: MealPlans = { ...plans }
  const filled: string[] = []
  // 고른 알레르기 테스트 날짜도 3일이 이어지도록 함께 채운다 (보이는 범위 밖이어도)
  const all = [...new Set([...dates, ...Object.keys(allergenByDate)])]
  for (const date of all.sort()) {
    if (out[date]?.meals.length) continue
    out[date] = { date, meals: buildDay(out, date, profile, reactions, PLAIN, allergenByDate[date]).meals }
    filled.push(date)
  }
  return { plans: out, filled }
}

export type DayMenuSuggestion = {
  id: string
  /** 카드 제목 (예: '균형 추천') */
  title: string
  meals: Meal[]
  /** 이 조합을 고른 이유 */
  reasons: string[]
}

const ingredientKey = (meals: Meal[]) => meals.map((m) => [...mealItems(m), m.allergen ?? ''].join('+')).join('|')

/**
 * 하루 메뉴 추천 N가지 (서로 다른 조합). 이미 그날에 식단이 있어도 전날까지의 기록만 보고 만든다.
 * - 균형 추천: 자동 채우기와 같은 기본 조합
 * - 다른 조합: 같은 규칙 안에서 채소·단백질을 바꿔 본 조합
 * - 임박 큐브 활용: 소비기한이 가까운 큐브 재료를 먼저 쓴 조합 (임박 큐브가 없으면 또 다른 조합)
 */
export function suggestDayMenus(plans: MealPlans, date: string, profile: BabyProfile, reactions: IngredientId[], expiringCubes: IngredientId[] = [], count = 3): DayMenuSuggestion[] {
  const base: MealPlans = { ...plans }
  const existingAllergen = plans[date]?.meals.find((m) => m.allergen && !reactions.includes(m.allergen))?.allergen
  delete base[date]
  const out: DayMenuSuggestion[] = []
  const seen = new Set<string>()
  const tries: { title: string; variant: Variant }[] = [
    { title: '균형 추천', variant: PLAIN },
    { title: '다른 조합', variant: { shift: 1, altProtein: true, prefer: [] } },
    ...(expiringCubes.length ? [{ title: '임박 큐브 활용', variant: { shift: 0, altProtein: false, prefer: expiringCubes } }] : []),
    { title: '또 다른 조합', variant: { shift: 2, altProtein: false, prefer: [] } },
    { title: '또 다른 조합', variant: { shift: 3, altProtein: true, prefer: [] } },
    { title: '또 다른 조합', variant: { shift: 4, altProtein: false, prefer: [] } },
    { title: '또 다른 조합', variant: { shift: 5, altProtein: true, prefer: [] } },
  ]
  for (const t of tries) {
    if (out.length >= count) break
    const built = buildDay(base, date, profile, reactions, t.variant, existingAllergen)
    const key = ingredientKey(built.meals)
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ id: `${out.length}`, title: t.title, meals: built.meals, reasons: built.reasons })
  }
  return out
}
