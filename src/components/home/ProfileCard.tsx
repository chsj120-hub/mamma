import { dayCount, dotted } from '../../lib/date'
import { STAGES } from '../../lib/stage'
import type { BabyProfile } from '../../lib/types'

export function ProfileCard({ profile, onEdit }: { profile: BabyProfile; onEdit: () => void }) {
  const stage = STAGES[profile.stage]
  const days = dayCount(profile.birthDate)

  return (
    <section aria-label="아기 프로필" className="flex flex-col gap-3.5 rounded-3xl bg-soft p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-[52px] shrink-0 items-center justify-center rounded-full bg-card font-display text-[22px] text-ink" aria-hidden="true">
            {profile.name.slice(0, 1) || '?'}
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-[17px] font-bold">{profile.name}</span>
            <span className="text-[13px] text-sub">
              {dotted(profile.birthDate)} 출생 · <span className="whitespace-nowrap">{stage.name}</span>
            </span>
          </div>
        </div>
        <button type="button" onClick={onEdit} className="h-11 shrink-0 rounded-[22px] border-none bg-card px-3.5 text-[13px] font-semibold text-ink">
          프로필 수정
        </button>
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] text-sub">오늘은 생후</span>
          <span className="font-display text-[44px] leading-none text-ink">
            {days >= 0 ? `D+${days}` : `D${days}`}
            <span className="text-[22px]">일차</span>
          </span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs text-sub">
            1회 목표 {profile.targetMl}ml · 하루 {profile.mealsPerDay}회
          </span>
          <span className="rounded-[10px] bg-card px-2.5 py-1 text-xs font-semibold">
            {stage.months} · {stage.texture}
          </span>
        </div>
      </div>
    </section>
  )
}
