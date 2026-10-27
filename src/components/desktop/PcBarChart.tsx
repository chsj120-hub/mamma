export type Bar = { key: string; label: string; ml: number | null; iron: boolean; srLabel: string; current?: boolean }

const PLOT_H = 210

/** PC 섭취량 막대 그래프 (div 막대). 철분 포함은 테마 색, 점선은 하루 목표 */
export function PcBarChart({ bars, target, title }: { bars: Bar[]; target: number; title: string }) {
  const max = Math.max(target * 1.25, ...bars.map((b) => b.ml ?? 0))
  const h = (ml: number) => Math.round((ml / max) * PLOT_H)
  const empty = bars.every((b) => b.ml == null)
  const cols = { gridTemplateColumns: `repeat(${bars.length}, minmax(0, 1fr))` }

  return (
    <section className="flex min-w-0 flex-[3_1_560px] flex-col gap-3.5 rounded-[22px] border border-line bg-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="m-0 text-[17px] font-bold">{title}</h2>
        <div className="flex flex-wrap gap-3.5 text-xs text-sub">
          <span className="flex items-center gap-[5px]">
            <span className="size-2.5 rounded-[3px] bg-accent" />
            철분(소고기) 포함
          </span>
          <span className="flex items-center gap-[5px]">
            <span className="size-2.5 rounded-[3px] bg-bar-off" />
            미포함
          </span>
          <span className="flex items-center gap-[5px]">
            <span className="w-3.5 border-t-2 border-dashed border-sub" />
            목표 {target}ml
          </span>
        </div>
      </div>

      <figure className="m-0 flex flex-col gap-1.5">
        <div className="relative grid h-[240px] items-end gap-2.5 border-b border-line pt-2.5" style={cols} aria-hidden="true">
          <div className="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-[#A8937C]" style={{ bottom: h(target) }} />
          {empty && <p className="absolute inset-0 m-0 flex items-center justify-center text-sm text-sub">이 기간에는 먹은 양 기록이 없어요. 오늘의 식단에서 먹은 양을 남겨 주세요.</p>}
          {bars.map((b) => (
            <div key={b.key} className="relative flex h-full flex-col items-center justify-end gap-1">
              {b.ml != null && <span className="text-xs font-semibold text-sub">{b.ml}ml</span>}
              <div
                className={`w-full max-w-14 rounded-t-lg ${b.ml == null ? '' : b.iron ? 'bg-accent' : 'bg-bar-off'}`}
                style={{ height: b.ml == null ? 0 : Math.max(3, h(b.ml)) }}
              />
            </div>
          ))}
        </div>
        <div className="grid gap-2.5" style={cols} aria-hidden="true">
          {bars.map((b) => (
            <span key={b.key} className={`text-center text-[13px] ${b.current ? 'font-bold text-ink' : 'text-sub'}`}>
              {b.label}
            </span>
          ))}
        </div>
        <figcaption className="sr-only">{bars.map((b) => b.srLabel).join('. ')}</figcaption>
      </figure>
    </section>
  )
}
