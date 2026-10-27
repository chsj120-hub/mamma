// 식단 편집 동작 (모바일 플래너·PC 대시보드 공용). 모두 스냅샷을 남긴다
import { useAppData } from './data'
import { md } from './date'
import { fillEmptyDays } from './recommender'
import type { Meal, MealPlans } from './types'

export function usePlanActions() {
  const { profile, plans, commitPlans, reactions } = useAppData()

  /** dates 중 오늘 이후 빈 날을 채운다. 결과 안내 문구를 돌려준다 */
  const fill = (dates: string[], today: string) => {
    const { plans: next, filled } = fillEmptyDays(
      plans,
      dates.filter((d) => d >= today),
      profile,
      reactions,
    )
    if (filled.length === 0) return '채울 빈 날이 없어요'
    commitPlans(next, `AI 채우기 · ${filled.length}일`)
    return `빈 날 ${filled.length}일을 채웠어요`
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
