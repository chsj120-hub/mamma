import { STAGE_RULES } from '../data/stageGuide'
import { useAppData } from '../lib/data'
import { addDays, todayKey } from '../lib/date'
import { remapMealTimes } from '../lib/meal'
import { STAGES } from '../lib/stage'
import { useStoredState } from '../lib/storage'

const SNOOZE_DAYS = 7
/** 하루 식사 횟수 설정이 고를 수 있는 최대 */
const MAX_MEALS = 3

/**
 * '하루 N회로 늘려 볼 시기예요' 카드. 지금 단계의 하루 횟수 기준(src/data/stageGuide.ts)보다 적게 계획하고 있을 때만 보인다.
 * 처음에는 적게 시작해도 괜찮고, 아기가 적응하면 프로필에서 직접 바꿀 수도 있다. 누르면 횟수와 먹는 시간(이어받음)을 바꾼다
 */
export function MealsPerDayNotice() {
  const { profile, setProfile } = useAppData()
  const today = todayKey()
  const [snoozedUntil, setSnoozedUntil] = useStoredState<string>('mealsNoticeSnooze', '')

  const target = Math.min(MAX_MEALS, STAGE_RULES[profile.stage].mealsPerDay[0])
  if (profile.mealsPerDay >= target || (snoozedUntil && today < snoozedUntil)) return null

  return (
    <section aria-labelledby="meals-notice-title" className="flex flex-col gap-2 rounded-[18px] border border-line bg-soft px-4 py-3.5">
      <h2 id="meals-notice-title" className="m-0 text-[15px] font-bold">
        하루 {target}회로 늘려 볼 시기예요
      </h2>
      <p className="m-0 text-[13px] leading-relaxed text-text">
        {STAGES[profile.stage].short} 이유식은 하루 {target}회부터가 맘마의 기준이에요. 지금은 하루 {profile.mealsPerDay}회로 계획하고 있어요. 아기가 적응한 것 같으면 늘려 보세요. 천천히 늘려도 괜찮고, 프로필 수정에서 언제든 바꿀 수 있어요.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setProfile({ ...profile, mealsPerDay: target, mealTimes: remapMealTimes(profile, target) })}
          className="min-h-11 rounded-[22px] border-none bg-ink px-4 text-[13px] font-bold text-white"
        >
          하루 {target}회로 바꾸기
        </button>
        <button type="button" onClick={() => setSnoozedUntil(addDays(today, SNOOZE_DAYS))} className="min-h-11 rounded-[22px] border border-line bg-card px-4 text-[13px] font-semibold text-sub">
          일주일 뒤에 다시
        </button>
      </div>
      <p className="m-0 text-xs leading-relaxed text-sub">아기 상태가 걱정되면 소아청소년과와 상담해 주세요.</p>
    </section>
  )
}
