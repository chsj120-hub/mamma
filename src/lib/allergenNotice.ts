// '알레르기 재료를 시작할 시기예요' 안내. 자동 채우기가 알레르기 재료를 넣지 않는 대신 부모에게 권한다.
import { addDays } from './date'
import { ALLERGENS, type IngredientId } from './ingredients'
import { ingredientProgress, upcomingIngredients } from './recommender'
import type { BabyProfile, MealPlans } from './types'

/** 안내를 보여 주기 전에 먼저 익숙해져야 하는 일반 재료 수 */
const MIN_PASSED_FOODS = 3
/** 앞으로 이 기간 안에 알레르기 테스트가 잡혀 있으면 안내하지 않는다 */
const LOOKAHEAD_DAYS = 7
const SUGGEST_COUNT = 3

/**
 * 안내할 알레르기 재료 (재료 도입 순서대로). 안내할 게 없으면 null.
 * - 일반 재료 몇 가지를 3일 테스트로 통과한 뒤부터
 * - 지금 테스트 중이거나 일주일 안에 알레르기 테스트가 잡혀 있으면 보류
 */
export function allergenSuggestion(plans: MealPlans, profile: BabyProfile, today: string, reactions: IngredientId[]): IngredientId[] | null {
  const { passed, testing } = ingredientProgress(plans, addDays(today, 1))
  if (testing && ALLERGENS.includes(testing.id)) return null
  if ([...passed].filter((id) => !ALLERGENS.includes(id)).length < MIN_PASSED_FOODS) return null

  for (let i = 0; i <= LOOKAHEAD_DAYS; i++) if (plans[addDays(today, i)]?.meals.some((m) => m.allergen)) return null

  const next = upcomingIngredients(profile.stage, passed, reactions).filter((id) => ALLERGENS.includes(id))
  return next.length ? next.slice(0, SUGGEST_COUNT) : null
}
