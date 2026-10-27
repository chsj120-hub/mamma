import type { stageProgress } from '../../lib/report'

export function StageCard({ bars }: { bars: ReturnType<typeof stageProgress> }) {
  return (
    <section className="flex flex-col gap-3.5 rounded-[20px] border border-line bg-card p-4">
      <h2 className="m-0 text-base font-bold">이유식 단계</h2>
      <ol className="m-0 grid list-none grid-cols-3 gap-1.5 p-0">
        {bars.map((b) => {
          const done = b.fill === 1 && !b.current
          return (
            <li key={b.name} className="flex flex-col gap-1.5" aria-current={b.current ? 'step' : undefined}>
              <div
                className="h-2 overflow-hidden rounded bg-track"
                role="progressbar"
                aria-label={`${b.name} 진행도`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(b.fill * 100)}
              >
                <div className={`h-full ${done ? 'bg-done' : 'bg-accent'}`} style={{ width: `${b.fill * 100}%` }} />
              </div>
              <span className={`text-[13px] font-bold ${b.current ? 'text-ink' : done ? '' : 'text-muted'}`}>
                {b.name}
                {b.current && ' · 지금'}
              </span>
              <span className="text-[11px] text-sub">{b.desc}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
