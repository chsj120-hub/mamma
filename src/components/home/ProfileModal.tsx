import { useEffect, useState, type FormEvent } from 'react'
import { monthsOld, todayKey } from '../../lib/date'
import { STAGE_IDS, STAGES, suggestStage } from '../../lib/stage'
import type { BabyProfile } from '../../lib/types'
import { Sheet } from '../Sheet'
import { ThemeSwitcher } from '../ThemeSwitcher'

type Props = {
  open: boolean
  profile: BabyProfile
  onSave: (p: BabyProfile) => void
  onClose: () => void
}

export const inputCls = 'h-11 w-full rounded-[14px] border-[1.5px] border-line bg-card px-3 text-[15px] text-text outline-none focus:border-ink'

export function ProfileModal({ open, profile, onSave, onClose }: Props) {
  const [draft, setDraft] = useState(profile)

  useEffect(() => {
    if (open) setDraft(profile)
  }, [open, profile])

  const today = todayKey()
  const months = draft.birthDate ? monthsOld(draft.birthDate, today) : 0
  const suggested = suggestStage(months)
  const nameMissing = draft.name.trim() === ''
  const birthInvalid = !draft.birthDate || draft.birthDate > today

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (nameMissing || birthInvalid) return
    onSave({ ...draft, name: draft.name.trim() })
  }

  return (
    <Sheet
      open={open}
      title="아기 프로필"
      onClose={onClose}
      footer={
        <button type="submit" form="profile-form" disabled={nameMissing || birthInvalid} className="h-12 w-full rounded-3xl border-none bg-ink text-[15px] font-bold text-white disabled:opacity-40">
          저장
        </button>
      }
    >
      <form id="profile-form" onSubmit={submit} className="flex flex-col gap-5">
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-sub">
          이름
          <input className={inputCls} value={draft.name} maxLength={20} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          {nameMissing && <span className="text-xs font-medium text-urgent">이름을 입력해 주세요.</span>}
        </label>

        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-sub">
          생년월일
          <input type="date" className={inputCls} value={draft.birthDate} max={today} onChange={(e) => setDraft({ ...draft, birthDate: e.target.value })} />
          {birthInvalid && <span className="text-xs font-medium text-urgent">오늘 이전 날짜를 골라 주세요.</span>}
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
                  onClick={() => setDraft({ ...draft, stage: id })}
                  className={`flex min-h-11 flex-col items-start rounded-[14px] border-[1.5px] px-3 py-2 text-left ${
                    selected ? 'border-ink bg-soft' : 'border-line bg-card'
                  }`}
                >
                  <span className="text-sm font-bold">{s.name}</span>
                  <span className="text-xs text-sub">
                    {s.months} · {s.texture}
                    {id === suggested && ' · 추천'}
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
              value={draft.targetMl}
              onChange={(e) => setDraft({ ...draft, targetMl: Number(e.target.value) || 0 })}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-sub">
            하루 식사 횟수
            <select className={inputCls} value={draft.mealsPerDay} onChange={(e) => setDraft({ ...draft, mealsPerDay: Number(e.target.value) })}>
              {[1, 2, 3].map((n) => (
                <option key={n} value={n}>
                  {n}회
                </option>
              ))}
            </select>
          </label>
        </div>

        <section className="flex flex-col gap-2">
          <h3 className="m-0 text-[13px] font-semibold text-sub">앱 테마</h3>
          <ThemeSwitcher />
        </section>
      </form>
    </Sheet>
  )
}
