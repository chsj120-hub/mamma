// 식단 편집 동작 (모바일 플래너·PC 대시보드 공용). 모두 스냅샷을 남긴다
import { useAppData } from './data'
import { overlayAllergen } from './allergenPlan'
import { md } from './date'
import { ingredientName, type IngredientId } from './ingredients'
import { fillEmptyDays } from './recommender'
import type { Meal, MealPlans } from './types'

export function usePlanActions() {
  const { profile, plans, commitPlans, reactions } = useAppData()

  /**
   * dates 중 오늘 이후 빈 날을 채운다. 고른 알레르기 테스트(날짜 → 재료)가 있으면 그 날들에 함께 넣는다.
   * 결과 안내 문구를 돌려준다
   */
  const fill = (dates: string[], today: string, allergens: Record<string, IngredientId> = {}) => {
    const futureAllergens = Object.fromEntries(Object.entries(allergens).filter(([d]) => d >= today))
    const { plans: filledPlans, filled } = fillEmptyDays(
      plans,
      dates.filter((d) => d >= today),
      profile,
      reactions,
      futureAllergens,
    )
    // 이미 식단이 있던 날에는 첫 끼에 알레르기 테스트를 얹는다
    const next = overlayAllergen(filledPlans, futureAllergens)
    const tests = [...new Set(Object.values(futureAllergens))].map(ingredientName)
    const addedOverlay = Object.keys(futureAllergens).some((d) => !filled.includes(d) && next[d] !== plans[d])
    if (filled.length === 0 && !addedOverlay) return '채울 빈 날이 없어요'
    commitPlans(next, `AI 채우기 · ${filled.length}일${tests.length ? ` · 알레르기 테스트 ${tests.join('·')}` : ''}`)
    return `빈 날 ${filled.length}일을 채웠어요${tests.length ? ` · 알레르기 테스트 ${tests.join('·')} 넣음` : ''}`
  }

  /** 하루 식단 저장. 빈 배열이면 그날을 비운다 */
  const saveDay = (date: string, meals: Meal[]) => {
    const { month, day } = md(date)
    const next: MealPlans = { ...plans }
    if (meals.length) next[date] = { date, meals }
    else delete next[date]
    commitPlans(next, `${month}월 ${day}일 식단 ${meals.length ? '수정' : '비우기'}`)
  }

  return { fill, saveDay }
}
