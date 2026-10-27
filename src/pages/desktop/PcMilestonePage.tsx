import { useState } from 'react'
import { RetryTip } from '../../components/RetryTip'
import { PrintDialog } from '../../components/print/PrintDialog'
import { STAGE_GUIDE } from '../../data/stageGuide'
import { useAppData } from '../../lib/data'
import { md } from '../../lib/date'
import {
  checkedOn,
  currentGroup,
  GROUP_NAMES,
  isChecked,
  MILESTONE_GROUPS,
  milestoneKey,
  MILESTONES,
  recentChecks,
  type MilestoneGroup,
} from '../../lib/milestones'

const mdot = (key: string) => `${md(key).month}.${String(md(key).day).padStart(2, '0')}`

/** PC 마일스톤 (/milestone): 단계 카드 3개, 체크리스트, 단계 가이드, 최근 기록 */
export function PcMilestonePage() {
  const { profile, milestones, toggleMilestone } = useAppData()
  const now = currentGroup(profile.birthDate)
  const [group, setGroup] = useState<MilestoneGroup>(now)
  const [printing, setPrinting] = useState(false)
  const nowIdx = MILESTONE_GROUPS.indexOf(now)

  const progress = (g: MilestoneGroup) => MILESTONES[g].filter((_, i) => isChecked(milestones, milestoneKey(g, i))).length
  const guide = STAGE_GUIDE[group]
  const recent = recentChecks(milestones)
  const done = progress(group)
  const total = MILESTONES[group].length

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-sub">월령별 이유식 적응 체크리스트</span>
          <h1 className="m-0 font-display text-4xl font-normal">마일스톤</h1>
        </div>
        <button type="button" onClick={() => setPrinting(true)} className="flex h-11 items-center gap-2 rounded-[14px] border border-line bg-card px-4 text-sm font-semibold print:hidden">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 9V2h12v7" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          체크리스트 출력
        </button>
      </div>

      <div role="tablist" aria-label="이유식 단계" className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
        {MILESTONE_GROUPS.map((g, gi) => {
          const n = progress(g)
          const all = MILESTONES[g].length
          const complete = n === all
          const on = group === g
          const tag = complete
            ? { text: '완료', cls: 'bg-done text-white' }
            : gi === nowIdx
              ? { text: '진행 중', cls: 'bg-ink text-white' }
              : gi < nowIdx
                ? { text: '지난 단계', cls: 'bg-track text-sub' }
                : { text: '예정', cls: 'bg-track text-sub' }
          return (
            <button
              key={g}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls="milestone-panel"
              onClick={() => setGroup(g)}
              className={`flex flex-col gap-2.5 rounded-[20px] border-2 px-[18px] py-4 text-left ${on ? 'border-ink bg-card' : 'border-line bg-bg hover:border-plan-dot'}`}
            >
              <span className="flex w-full items-center justify-between">
                <span className="text-[17px] font-bold">{GROUP_NAMES[g]}</span>
                <span className={`rounded-lg px-2 py-[3px] text-xs font-bold ${tag.cls}`}>{tag.text}</span>
              </span>
              <span className="text-[13px] text-sub">
                {STAGE_GUIDE[g].range} · {STAGE_GUIDE[g].texture}
              </span>
              <span className="block h-2 w-full overflow-hidden rounded bg-track" aria-hidden="true">
                <span className={`block h-full ${complete ? 'bg-done' : 'bg-accent'}`} style={{ width: `${(n / all) * 100}%` }} />
              </span>
              <span className="text-xs font-semibold text-sub">
                {n} / {all} 완료
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-start gap-5">
        <section id="milestone-panel" role="tabpanel" aria-label={`${GROUP_NAMES[group]} 체크리스트`} className="flex min-w-0 flex-[3_1_560px] flex-col gap-1.5 rounded-[22px] border border-line bg-card p-[22px]">
          <div className="flex items-baseline justify-between pb-2">
            <h2 className="m-0 text-lg font-bold">{GROUP_NAMES[group]} 체크리스트</h2>
            <span className="text-sm font-bold text-ink" aria-live="polite">
              {done} / {total}
            </span>
          </div>
          {MILESTONES[group].map((m, i) => {
            const key = milestoneKey(group, i)
            const on = isChecked(milestones, key)
            const date = checkedOn(milestones, key)
            return (
              <label key={key} className={`flex min-h-16 cursor-pointer items-center gap-3.5 rounded-[14px] px-3 py-2.5 ${on ? 'bg-done-bg' : 'bg-bg'}`}>
                <input type="checkbox" checked={on} onChange={() => toggleMilestone(key)} className="m-0 size-6 shrink-0 accent-done" />
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className={`text-[15px] font-semibold ${on ? 'text-sub line-through' : ''}`}>{m.text}</span>
                  <span className="text-xs text-sub">{m.hint}</span>
                </span>
                {on && <span className="shrink-0 text-xs font-semibold text-done">{date ? `${mdot(date)} 체크` : '체크함'}</span>}
              </label>
            )
          })}
        </section>

        <div className="flex min-w-0 flex-[2_1_320px] flex-col gap-5">
          <section className="flex flex-col gap-3 rounded-[22px] bg-soft p-5">
            <h2 className="m-0 text-[17px] font-bold">{GROUP_NAMES[group]} 가이드</h2>
            <dl className="m-0 flex flex-col">
              {(
                [
                  ['월령', guide.range],
                  ['식감', guide.texture],
                  ['하루 횟수', guide.mealsPerDay],
                  ['1회 권장량', guide.amount],
                ] as const
              ).map(([label, value], i, arr) => (
                <div key={label} className={`flex justify-between py-2 text-sm ${i < arr.length - 1 ? 'border-b border-text/10' : ''}`}>
                  <dt>{label}</dt>
                  <dd className={`m-0 font-bold ${value ? '' : 'font-medium text-muted'}`}>{value || '입력 전'}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="flex flex-col gap-2.5 rounded-[22px] border border-line bg-card p-5">
            <h2 className="m-0 text-[17px] font-bold">최근 기록</h2>
            {recent.length === 0 ? (
              <p className="m-0 text-sm text-sub">체크하면 날짜와 함께 여기에 쌓여요.</p>
            ) : (
              <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
                {recent.map((r) => (
                  <li key={`${r.group}-${r.text}`} className="flex items-start gap-3 text-sm">
                    <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-done" aria-hidden="true" />
                    <span className="flex-1">
                      {r.text}
                      {r.group !== group && <span className="ml-1.5 text-xs text-muted">{GROUP_NAMES[r.group]}</span>}
                    </span>
                    <span className="text-xs text-sub">{mdot(r.date)}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
          <RetryTip />
        </div>
      </div>
      {printing && <PrintDialog initialKind={'milestone'} onClose={() => setPrinting(false)} />}
    </div>
  )
}
