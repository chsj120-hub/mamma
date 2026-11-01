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
  /** 끼니별 먹는 시간 (HH:mm). 하루 식사 횟수와 같은 개수. 없으면 기본 시간 */
  mealTimes?: string[]
}

export type MealStatus = 'planned' | 'done'

/** 끼니 반응 한 줄: 잘 먹음 / 조금 먹음 / 거부 */
export type Taste = 'good' | 'some' | 'refuse'

/** 키·몸무게·머리둘레 기록 (측정한 날 하나). 값은 잰 것만 있어도 된다 */
export type GrowthRecord = {
  id: string
  /** YYYY-MM-DD */
  date: string
  heightCm?: number
  weightKg?: number
  headCm?: number
}

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
  /** 먹은 반응 한 줄 */
  taste?: Taste
  /** 완료를 누른 사람의 표시 이름 (가족 공유로 여럿이 쓸 때 '누가 먹였는지' 보여 주려고) */
  doneBy?: string
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
