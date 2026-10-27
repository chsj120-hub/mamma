export type PlannerView = 'month' | 'week'

const chevron = (d: string) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2B2118" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
)

type Props = {
  view: PlannerView
  onView: (v: PlannerView) => void
  title: string
  /** Jua 글꼴로 크게 (월간 제목) */
  titleDisplay?: boolean
  subtitle: React.ReactNode
  prevLabel: string
  nextLabel: string
  onPrev: () => void
  onNext: () => void
}

export function PlannerHeader({ view, onView, title, titleDisplay, subtitle, prevLabel, nextLabel, onPrev, onNext }: Props) {
  const navBtn = 'flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-card'
  return (
    <header className="flex flex-col gap-3.5 px-5 pt-5 pb-3">
      <div className="flex items-center justify-between">
        <h1 className="m-0 font-display text-[26px] font-normal">식단 플래너</h1>
        <div role="group" aria-label="보기 전환" className="flex rounded-[22px] bg-track p-1">
          {(
            [
              ['month', '월간'],
              ['week', '주간'],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => onView(v)}
              className={`h-9 rounded-[18px] border-none px-3.5 text-[13px] ${
                view === v ? 'bg-card font-bold text-ink shadow-[0_1px_2px_rgba(43,33,24,0.12)]' : 'bg-transparent font-semibold text-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <button type="button" aria-label={prevLabel} onClick={onPrev} className={navBtn}>
          {chevron('m15 18-6-6 6-6')}
        </button>
        <div className="flex min-w-0 flex-col items-center gap-0.5 text-center" aria-live="polite">
          <span className={titleDisplay ? 'font-display text-[22px]' : 'text-base font-bold'}>{title}</span>
          <span className="flex items-center gap-1 text-xs text-sub">{subtitle}</span>
        </div>
        <button type="button" aria-label={nextLabel} onClick={onNext} className={navBtn}>
          {chevron('m9 18 6-6-6-6')}
        </button>
      </div>
    </header>
  )
}
