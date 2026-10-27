import { DOW_KO, dowOf, md } from '../../lib/date'
import type { weekIntake } from '../../lib/report'

type Props = {
  days: ReturnType<typeof weekIntake>
  /** 하루 목표 섭취량(ml) */
  dailyTarget: number
  today: string
}

const PLOT_H = 96

/** 주간 섭취량 막대 그래프. 막대 색은 그날 소고기(철분) 포함 여부, 점선은 하루 목표 */
export function IntakeChart({ days, dailyTarget, today }: Props) {
  const max = Math.max(dailyTarget * 1.15, ...days.map((d) => d.ml ?? 0))
  const h = (ml: number) => Math.round((ml / max) * PLOT_H)
  const recorded = days.filter((d) => d.ml != null)
  // 실제로 먹은(기록이 있는) 날 기준
  const ironDays = recorded.filter((d) => d.iron).length
  const avg = recorded.length ? Math.round(recorded.reduce((n, d) => n + d.ml!, 0) / recorded.length) : null

  return (
    <section className="flex flex-col gap-3 rounded-[20px] border border-line bg-card p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="m-0 text-base font-bold">주간 섭취량</h2>
        <span className="text-[13px] text-sub">목표 {dailyTarget}ml / 일</span>
      </div>

      <figure className="m-0 flex flex-col gap-1">
        <div className="relative grid h-[120px] grid-cols-7 items-end gap-2 border-b border-line" aria-hidden="true">
          <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-ink/50" style={{ bottom: h(dailyTarget) }} />
          {days.map((d) => (
            <div key={d.date} className="flex h-full flex-col items-center justify-end gap-1">
              <span className="text-[10px] text-sub">{d.ml ?? '–'}</span>
              <div
                className={`w-full rounded-t-md ${d.ml == null ? '' : d.iron ? 'bg-accent' : 'bg-bar-off'}`}
                style={{ height: d.ml == null ? 0 : Math.max(2, h(d.ml)) }}
              />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2" aria-hidden="true">
          {days.map((d) => (
            <span key={d.date} className={`text-center text-xs ${d.date === today ? 'font-bold text-ink' : 'text-muted'}`}>
              {DOW_KO[dowOf(d.date)]}
            </span>
          ))}
        </div>
        <figcaption className="sr-only">
          {days
            .map((d) => `${md(d.date).month}월 ${md(d.date).day}일 ${d.ml == null ? '기록 없음' : `${d.ml}ml`}${d.iron ? ', 소고기 포함' : ''}`)
            .join('. ')}
        </figcaption>
      </figure>

      <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-xs text-sub">
        <span className="flex items-center gap-[5px]">
          <span className="size-2.5 rounded-[3px] bg-accent" />
          철분(소고기) 포함 · {ironDays}일
        </span>
        <span className="flex items-center gap-[5px]">
          <span className="size-2.5 rounded-[3px] bg-bar-off" />
          미포함
        </span>
        <span className="flex items-center gap-[5px]">
          <span className="w-3 border-t border-dashed border-ink/50" />
          목표
        </span>
      </div>
      {avg != null && (
        <p className="m-0 text-[13px] text-sub">
          기록한 {recorded.length}일 평균 <b className="text-text">{avg}ml</b> · 목표의 {Math.round((avg / dailyTarget) * 100)}%
        </p>
      )}
    </section>
  )
}
