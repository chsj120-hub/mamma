import { STAGE_RULES } from '../data/stageGuide'
import type { StageId } from './types'

export const STAGES: Record<StageId, { name: string; short: string; months: string; texture: string }> = {
  early: { name: '초기 이유식', short: '초기', months: STAGE_RULES.early.range, texture: '미음' },
  middle: { name: '중기 이유식', short: '중기', months: STAGE_RULES.middle.range, texture: '죽' },
  late: { name: '후기 이유식', short: '후기', months: STAGE_RULES.late.range, texture: '무른 밥' },
  complete: { name: '완료기', short: '완료기', months: STAGE_RULES.complete.range, texture: '진밥' },
}

export const STAGE_IDS = Object.keys(STAGES) as StageId[]

/** 만 개월 수로 권장 단계 추천 (기준표: ~6 초기, 7~8 중기, 9~11 후기, 12~ 완료기) */
export function suggestStage(months: number): StageId {
  if (months >= STAGE_RULES.complete.fromMonth) return 'complete'
  if (months >= STAGE_RULES.late.fromMonth) return 'late'
  if (months >= STAGE_RULES.middle.fromMonth) return 'middle'
  return 'early'
}
