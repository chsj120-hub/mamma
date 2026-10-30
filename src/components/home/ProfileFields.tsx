import { monthsOld } from '../../lib/date'
import { mealSlots, remapMealTimes, timesAscending } from '../../lib/meal'
import { STAGE_IDS, STAGES, suggestStage } from '../../lib/stage'
import type { BabyProfile } from '../../lib/types'

export const inputCls = 'h-11 w-full rounded-[14px] border-[1.5px] border-line bg-card px-3 text-[15px] text-text outline-none focus:border-ink'

/** 입력값 검사 (프로필 수정 창·가입 직후 아기 정보 화면 공용) */
export function profileProblems(d: BabyProfile, today: string) {
  return {
    nameMissing: d.name.trim() === '',
    birthInvalid: !d.birthDate || d.birthDate > today,
    targetInvalid: !(d.targetMl > 0),
    timesInvalid: !timesAscending(mealSlots(d).map((s) => s.time)),
  }
}

export const hasProblems = (p: ReturnType<typeof profileProblems>) => p.nameMissing || p.birthInvalid || p.targetInvalid || p.timesInvalid

type Props = {
  draft: BabyProfile
  onChange: (next: BabyProfile) => void
  today: string
  /** 생년월일을 바꿀 때 월령에 맞는 단계를 자동으로 고를지 (가입 직후용) */
  autoStage?: boolean
  /** 값이 비어 있을 때 빨간 안내를 보일지 (저장을 시도한 뒤부터) */
  showErrors?: boolean
}

export function ProfileFields({ draft, onChange, today, autoStage = false, showErrors = true }: Props) {
  const months = draft.birthDate ? monthsOld(draft.birthDate, today) : 0
  const suggested = suggestStage(months)
  const p = profileProblems(draft, today)
  const err = (on: boolean, text: string) =>
    on && showErrors && (
      <span role="alert" className="text-xs font-medium text-urgent">
        {text}
      </span>
    )

  return (
    <>
      <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-sub">
        이름
        <input className={inputCls} value={draft.name} maxLength={20} autoComplete="off" onChange={(e) => onChange({ ...draft, name: e.target.value })} />
        {err(p.nameMissing, '이름을 입력해 주세요.')}
      </label>

      <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-sub">
        생년월일
        <input
          type="date"
          className={inputCls}
          value={draft.birthDate}
          max={today}
          onChange={(e) => {
            const birthDate = e.target.value
            const stage = autoStage && birthDate ? suggestStage(monthsOld(birthDate, today)) : draft.stage
            onChange({ ...draft, birthDate, stage })
          }}
        />
        {err(p.birthInvalid, '오늘 이전 날짜를 골라 주세요.')}
      </label>

      <fieldset className="m-0 flex flex-col gap-1.5 border-none p-0">
        <legend className="mb-1.5 p-0 text-[13px] font-semibold text-sub">이유식 단계</legend>
        <div className="grid grid-cols-2 gap-2">
          {STAGE_IDS.map((id) => {
            const s = STAGES[id]
            const selected = draft.stage === id
            return (
              <button
                key={id}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange({ ...draft, stage: id })}
                className={`flex min-h-11 flex-col items-start rounded-[14px] border-[1.5px] px-3 py-2 text-left ${selected ? 'border-ink bg-soft' : 'border-line bg-card'}`}
              >
                <span className="text-sm font-bold">{s.name}</span>
                <span className="text-xs text-sub">
                  {s.months} · {s.texture}
                  {draft.birthDate && id === suggested && ' · 추천'}
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-sub">
          1회 목표량(ml)
          <input
            type="number"
            inputMode="numeric"
            min={10}
            max={300}
            step={10}
            className={inputCls}
            value={draft.targetMl || ''}
            placeholder="직접 입력"
            onChange={(e) => onChange({ ...draft, targetMl: Number(e.target.value) || 0 })}
          />
          {err(p.targetInvalid, '목표량을 입력해 주세요.')}
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-sub">
          하루 식사 횟수
          <select className={inputCls} value={draft.mealsPerDay} onChange={(e) => {
              const n = Number(e.target.value)
              onChange({ ...draft, mealsPerDay: n, mealTimes: remapMealTimes(draft, n) })
            }}>
            {[1, 2, 3].map((n) => (
              <option key={n} value={n}>
                {n}회
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="m-0 flex flex-col gap-2 border-none p-0">
        <legend className="mb-1 p-0 text-[13px] font-semibold text-sub">먹는 시간 (식단을 만들면 이 시간으로 들어가요)</legend>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-2">
          {mealSlots(draft).map((s, i) => (
            <label key={s.label} className="flex flex-col gap-1 text-xs font-semibold text-sub">
              {s.label}
              <input
                type="time"
                className={inputCls}
                value={s.time}
                onChange={(e) => {
                  const times = mealSlots(draft).map((x) => x.time)
                  if (e.target.value) times[i] = e.target.value
                  onChange({ ...draft, mealTimes: times })
                }}
              />
            </label>
          ))}
        </div>
        {err(p.timesInvalid, '시간이 앞 끼니보다 늦어야 해요.')}
      </fieldset>
    </>
  )
}
