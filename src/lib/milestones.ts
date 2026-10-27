import { monthsOld, todayKey } from './date'
import { suggestStage } from './stage'
import type { StageId } from './types'

/** 마일스톤은 3묶음: 초기 / 중기 / 후기·완료기 (리포트 단계 막대와 같은 구분) */
export type MilestoneGroup = 'early' | 'middle' | 'late'

export const MILESTONE_GROUPS: MilestoneGroup[] = ['early', 'middle', 'late']

export const GROUP_NAMES: Record<MilestoneGroup, string> = { early: '초기', middle: '중기', late: '후기·완료기' }

/** 이유식 단계 → 마일스톤 묶음 (완료기는 후기와 같은 묶음) */
export const groupOf = (stage: StageId): MilestoneGroup => (stage === 'complete' ? 'late' : stage)

/** 단계별 이유식 적응 체크리스트 (참고용 일반 가이드). [항목, 도움말] */
export const MILESTONES: Record<MilestoneGroup, { text: string; hint: string }[]> = {
  early: [
    { text: '숟가락에 익숙해진다', hint: '숟가락이 입에 닿아도 밀어내지 않아요' },
    { text: '미음을 삼킬 수 있다', hint: '혀로 밀어내지 않고 넘겨요' },
    { text: '쌀 알레르기 테스트 완료', hint: '3일 연속 이상 반응 없음' },
    { text: '하루 1회 이유식', hint: '같은 시간대에 꾸준히' },
    { text: '도움받아 앉은 자세 유지', hint: '이유식 의자에서 고개를 가눠요' },
  ],
  middle: [
    { text: '두부처럼 부드러운 덩어리를 혀로 으깬다', hint: '입자를 조금씩 키워 보세요' },
    { text: '숟가락을 보면 스스로 입을 벌린다', hint: '먹을 준비가 되었다는 신호' },
    { text: '컵으로 물 마시기를 연습한다', hint: '빨대컵이나 작은 컵으로 시작' },
    { text: '하루 2회 이유식이 자리 잡았다', hint: '아침·저녁 시간을 일정하게' },
    { text: '손으로 음식을 집으려 한다', hint: '부드러운 핑거푸드를 쥐여 주세요' },
  ],
  late: [
    { text: '진밥을 잇몸으로 씹는다', hint: '밥알 형태가 남은 식감' },
    { text: '하루 3회 식사', hint: '가족 식사 시간에 맞춰요' },
    { text: '핑거푸드를 스스로 먹는다', hint: '집기 쉬운 크기로 잘라 주세요' },
    { text: '컵을 두 손으로 잡고 마신다', hint: '흘려도 괜찮아요' },
    { text: '가족과 함께 식탁에 앉는다', hint: '같은 메뉴를 순하게 조리' },
  ],
}

/** 아기 월령으로 정한 지금 묶음 */
export const currentGroup = (birthDate: string, today = todayKey()) => groupOf(suggestStage(monthsOld(birthDate, today)))

export const milestoneKey = (group: MilestoneGroup, i: number) => `${group}:${i}`

/**
 * 저장 값: 키 → 체크한 시각(ISO 문자열). 예전 버전은 true로 저장했으니 그것도 체크로 본다(날짜 모름).
 */
export type MilestoneChecks = Record<string, string | boolean>

export const isChecked = (checks: MilestoneChecks, key: string) => !!checks[key]

const checkedAt = (checks: MilestoneChecks, key: string) => (typeof checks[key] === 'string' && checks[key] ? (checks[key] as string) : null)

/** 체크한 날짜(로컬 YYYY-MM-DD). 모르면 null */
export function checkedOn(checks: MilestoneChecks, key: string) {
  const at = checkedAt(checks, key)
  return at ? todayKey(new Date(at)) : null
}

/** 최근 체크 기록 (날짜 있는 것만, 최신순) */
export function recentChecks(checks: MilestoneChecks, limit = 6) {
  const out: { group: MilestoneGroup; text: string; at: string; date: string }[] = []
  for (const g of MILESTONE_GROUPS)
    MILESTONES[g].forEach((m, i) => {
      const at = checkedAt(checks, milestoneKey(g, i))
      if (at) out.push({ group: g, text: m.text, at, date: todayKey(new Date(at)) })
    })
  return out.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit)
}
