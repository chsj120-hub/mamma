import type { IngredientId } from './ingredients'

export type StageId = 'early' | 'middle' | 'late' | 'complete'

export type BabyProfile = {
  name: string
  /** YYYY-MM-DD */
  birthDate: string
  stage: StageId
  /** 1회 목표 섭취량(ml) */
  targetMl: number
  mealsPerDay: number
}

export type MealStatus = 'planned' | 'done'

export type Meal = {
  id: string
  /** HH:mm */
  time: string
  label: string
  base?: IngredientId
  meat?: IngredientId
  veggie1?: IngredientId
  veggie2?: IngredientId
  fruit?: IngredientId
  snack?: IngredientId
  /** 알레르기 테스트 중인 재료 */
  allergen?: IngredientId
  status: MealStatus
  /** 실제로 먹은 양(ml) */
  eatenMl?: number
}

export type MealPlanDay = {
  /** YYYY-MM-DD */
  date: string
  meals: Meal[]
}

/** 날짜 → 그날 식단 */
export type MealPlans = Record<string, MealPlanDay>

/** 직접 만든 큐브 / 시판 큐브 */
export type CubeSource = 'homemade' | 'store'

export type Cube = {
  id: string
  ingredient: IngredientId
  count: number
  /** 직접 만듦: 제조일, 시판: 구매일 (YYYY-MM-DD) */
  madeAt: string
  /** 없으면 직접 만든 큐브 (예전 데이터 호환) */
  source?: CubeSource
  /** 시판 큐브의 포장에 적힌 소비기한 (YYYY-MM-DD) */
  expiresOn?: string
}
