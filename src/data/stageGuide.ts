// 단계별 이유식 기준표. 출처마다 값이 조금씩 달라 공통으로 많이 쓰이는 값을 골랐다.
// - 횟수·식감: 질병관리청 국가건강정보포털 '이유기보충식' (6~8개월 2~3회, 9~11개월 3~4회)
// - 1회 권장량(amount): 학회·공공기관 원문으로 확인 전이라 비워 둠 → 화면에 '입력 전'.
//   확인되면 값과 함께 출처를 이 주석에 적어 주세요. (이전 값은 육아 사이트 공통값이었음)
// 숫자를 바꾸면 화면 안내(STAGE_GUIDE)와 자동 채우기(STAGE_RULES)에 함께 반영돼요.
import type { MilestoneGroup } from '../lib/milestones'
import type { StageId } from '../lib/types'

/** 자동 채우기·단계 판정에 쓰는 단계별 규칙 */
export type StageRule = {
  /** 이 단계가 시작되는 만 개월 수 */
  fromMonth: number
  /** 월령 표시 */
  range: string
  /** 식감 */
  texture: string
  /** 하루 이유식 횟수 [최소, 최대] */
  mealsPerDay: [number, number]
  /** 1회 권장량 표시. 출처 확인 전이면 '' (화면에 '입력 전') */
  amount: string
  /** 한 끼에 넣는 재료 수 상한 (베이스 쌀 제외) */
  itemsPerMeal: number
}

export const STAGE_RULES: Record<StageId, StageRule> = {
  early: { fromMonth: 0, range: '6개월', texture: '묽은 미음 (10배죽, 곱게 갈아 거름)', mealsPerDay: [1, 2], amount: '', itemsPerMeal: 2 },
  middle: { fromMonth: 7, range: '7~8개월', texture: '으깬 죽 (두부처럼 혀로 으깰 정도)', mealsPerDay: [2, 3], amount: '', itemsPerMeal: 3 },
  late: { fromMonth: 9, range: '9~11개월', texture: '무른 밥 (덩어리 약 0.5cm)', mealsPerDay: [3, 4], amount: '', itemsPerMeal: 4 },
  complete: { fromMonth: 12, range: '12개월~', texture: '진밥 · 순한 가족식', mealsPerDay: [3, 3], amount: '', itemsPerMeal: 4 },
}

/** 마일스톤 화면 '가이드' 카드용 표시 문구 (3묶음) */
export type StageGuide = {
  /** 월령 */
  range: string
  /** 식감 */
  texture: string
  /** 하루 횟수 */
  mealsPerDay: string
  /** 1회 권장량 */
  amount: string
}

const times = ([a, b]: [number, number]) => (a === b ? `${a}회` : `${a}~${b}회`)

export const STAGE_GUIDE: Record<MilestoneGroup, StageGuide> = {
  early: { range: STAGE_RULES.early.range, texture: '미음', mealsPerDay: times(STAGE_RULES.early.mealsPerDay), amount: STAGE_RULES.early.amount },
  middle: { range: STAGE_RULES.middle.range, texture: '죽', mealsPerDay: times(STAGE_RULES.middle.mealsPerDay), amount: STAGE_RULES.middle.amount },
  late: { range: '9~12개월', texture: '무른 밥 · 진밥', mealsPerDay: '3회 (+간식)', amount: STAGE_RULES.late.amount },
}

/** 같은 재료를 연속으로 먹여 보는 날 수 */
export const NEW_FOOD_TEST_DAYS = 3

/** 돌(12개월) 전에는 주지 않는 것 — 재료 목록에는 없지만 안내 문구에 쓴다 */
export const AVOID_BEFORE_12M = ['꿀', '소금', '설탕', '통견과류', '생우유(음료로)', '붉은살 생선']
