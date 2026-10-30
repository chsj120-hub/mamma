import { useAppData } from '../lib/data'
import { addDays, monthsOld, todayKey } from '../lib/date'
import { STAGE_IDS, STAGES, suggestStage } from '../lib/stage'
import { useStoredState } from '../lib/storage'

const SNOOZE_DAYS = 3

/** '이제 ○기예요, 단계를 바꿀까요?' 카드 (모바일 홈·PC 대시보드). 월령에 맞는 단계가 지금 설정보다 앞서면 보인다 */
export function StageNotice() {
  const { profile, setProfile } = useAppData()
  const today = todayKey()
  const [snoozedUntil, setSnoozedUntil] = useStoredState<string>('stageNoticeSnooze', '')

  if (!profile.birthDate || (snoozedUntil && today < snoozedUntil)) return null
  const months = monthsOld(profile.birthDate, today)
  const suggested = suggestStage(months)
  if (STAGE_IDS.indexOf(suggested) <= STAGE_IDS.indexOf(profile.stage)) return null

  return (
    <section aria-labelledby="stage-notice-title" className="flex flex-col gap-2 rounded-[18px] border border-line bg-soft px-4 py-3.5">
      <h2 id="stage-notice-title" className="m-0 text-[15px] font-bold">
        이제 {STAGES[suggested].short} 이유식 시기예요
      </h2>
      <p className="m-0 text-[13px] leading-relaxed text-text">
        생후 {months}개월이 되어 {STAGES[suggested].name}({STAGES[suggested].months})에 해당해요. 단계를 바꾸면 새 식단 추천이 그 단계 기준을 따라요. 이미 짜 둔 식단은 그대로예요.
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setProfile({ ...profile, stage: suggested })} className="min-h-11 rounded-[22px] border-none bg-ink px-4 text-[13px] font-bold text-white">
          {STAGES[suggested].short}로 바꾸기
        </button>
        <button type="button" onClick={() => setSnoozedUntil(addDays(today, SNOOZE_DAYS))} className="min-h-11 rounded-[22px] border border-line bg-card px-4 text-[13px] font-semibold text-sub">
          나중에
        </button>
      </div>
      <p className="m-0 text-xs leading-relaxed text-sub">아기마다 발달 속도가 달라요. 단계를 올릴 시기가 고민되면 소아청소년과와 상의해 주세요.</p>
    </section>
  )
}
