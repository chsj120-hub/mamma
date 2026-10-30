import { useState, type FormEvent } from 'react'
import { useAppData } from '../../lib/data'
import { dotted, daysBetween, todayKey } from '../../lib/date'
import type { GrowthRecord } from '../../lib/types'
import { inputCls } from '../home/ProfileFields'
import { Sheet } from '../Sheet'

type Metric = 'heightCm' | 'weightKg' | 'headCm'

const METRICS: { id: Metric; label: string; unit: string; min: number; max: number; step: string }[] = [
  { id: 'weightKg', label: '몸무게', unit: 'kg', min: 1, max: 30, step: '0.01' },
  { id: 'heightCm', label: '키', unit: 'cm', min: 30, max: 130, step: '0.1' },
  { id: 'headCm', label: '머리둘레', unit: 'cm', min: 25, max: 60, step: '0.1' },
]

/** 선 그래프: 기록한 날짜 간격대로 점을 놓는다 (값이 둘 이상일 때) */
function Chart({ records, metric }: { records: GrowthRecord[]; metric: Metric }) {
  const pts = records.filter((r) => r[metric] != null)
  if (pts.length < 2) return <p className="m-0 rounded-xl bg-bg p-3 text-center text-xs text-sub">두 번 이상 기록하면 변화를 선으로 볼 수 있어요.</p>
  const W = 320
  const H = 130
  const pad = { l: 8, r: 8, t: 12, b: 20 }
  const vals = pts.map((r) => r[metric]!)
  const lo = Math.min(...vals)
  const hi = Math.max(...vals)
  const span = hi - lo || 1
  const total = Math.max(1, daysBetween(pts[0].date, pts[pts.length - 1].date))
  const x = (d: string) => pad.l + ((W - pad.l - pad.r) * daysBetween(pts[0].date, d)) / total
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - (v - lo) / span)
  const unit = METRICS.find((m) => m.id === metric)!.unit
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${METRICS.find((m) => m.id === metric)!.label} 변화 그래프`} className="w-full">
      <polyline fill="none" className="stroke-ink" strokeWidth="2" strokeLinejoin="round" points={pts.map((r) => `${x(r.date)},${y(r[metric]!)}`).join(' ')} />
      {pts.map((r) => (
        <circle key={r.id} cx={x(r.date)} cy={y(r[metric]!)} r="3.5" className="fill-ink" />
      ))}
      <text x={pad.l} y={H - 4} className="fill-sub" fontSize="10">
        {dotted(pts[0].date)}
      </text>
      <text x={W - pad.r} y={H - 4} textAnchor="end" className="fill-sub" fontSize="10">
        {dotted(pts[pts.length - 1].date)}
      </text>
      <text x={W - pad.r} y={pad.t - 2} textAnchor="end" className="fill-sub" fontSize="10">
        최근 {vals[vals.length - 1]}
        {unit}
      </text>
    </svg>
  )
}

/** 키·몸무게·머리둘레 기록. 기록과 변화만 보여 주고, 또래와 비교하는 백분위는 공식 표 확인 뒤에 넣는다 */
export function GrowthCard() {
  const { growth, saveGrowth, removeGrowth } = useAppData()
  const [metric, setMetric] = useState<Metric>('weightKg')
  const [adding, setAdding] = useState(false)
  const latest = [...growth].reverse()

  return (
    <section className="flex flex-col gap-3 rounded-[22px] border border-line bg-card p-[18px]" aria-labelledby="growth-title">
      <div className="flex items-center justify-between gap-2">
        <h2 id="growth-title" className="m-0 text-[17px] font-bold">
          키·몸무게 기록
        </h2>
        <button type="button" onClick={() => setAdding(true)} className="min-h-11 rounded-[22px] border-none bg-ink px-4 text-[13px] font-bold text-white">
          + 기록하기
        </button>
      </div>

      <div className="flex gap-1.5" role="tablist" aria-label="보기 항목">
        {METRICS.map((x) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            aria-selected={metric === x.id}
            onClick={() => setMetric(x.id)}
            className={`min-h-11 flex-1 rounded-[18px] border-[1.5px] text-[13px] font-semibold ${metric === x.id ? 'border-ink bg-ink text-white' : 'border-line bg-card text-text'}`}
          >
            {x.label}
          </button>
        ))}
      </div>

      {growth.length === 0 ? (
        <p className="m-0 rounded-xl bg-bg p-4 text-center text-sm text-sub">아직 기록이 없어요. 병원이나 보건소에서 잰 값을 적어 두면 변화를 볼 수 있어요.</p>
      ) : (
        <>
          <Chart records={growth} metric={metric} />
          <ul className="m-0 flex max-h-48 list-none flex-col overflow-y-auto p-0" aria-label="기록 목록">
            {latest.map((r) => (
              <li key={r.id} className="flex items-center gap-2 border-b border-track py-1.5 text-[13px]">
                <span className="w-24 shrink-0 text-sub">{dotted(r.date)}</span>
                <span className="flex-1">
                  {[r.weightKg != null && `${r.weightKg}kg`, r.heightCm != null && `${r.heightCm}cm`, r.headCm != null && `머리 ${r.headCm}cm`].filter(Boolean).join(' · ')}
                </span>
                <button type="button" onClick={() => removeGrowth(r.id)} aria-label={`${dotted(r.date)} 기록 삭제`} className="min-h-11 border-none bg-transparent px-2 text-xs font-semibold text-sub underline">
                  삭제
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="m-0 text-xs leading-relaxed text-sub">기록만 보여 드려요. 성장이 또래와 비교해 어떤지는 소아청소년과 검진에서 상담해 주세요.</p>

      {adding && (
        <GrowthSheet
          onClose={() => setAdding(false)}
          onSave={(r) => {
            saveGrowth(r)
            setAdding(false)
          }}
        />
      )}
    </section>
  )
}

function GrowthSheet({ onClose, onSave }: { onClose: () => void; onSave: (r: Omit<GrowthRecord, 'id'>) => void }) {
  const today = todayKey()
  const [date, setDate] = useState(today)
  const [text, setText] = useState<Record<Metric, string>>({ weightKg: '', heightCm: '', headCm: '' })
  const [tried, setTried] = useState(false)

  const parse = (id: Metric) => {
    const t = text[id].trim()
    if (!t) return { empty: true as const }
    const n = Number(t)
    const meta = METRICS.find((x) => x.id === id)!
    return Number.isFinite(n) && n >= meta.min && n <= meta.max ? { empty: false as const, value: n } : { empty: false as const, error: `${meta.label}은 ${meta.min}~${meta.max}${meta.unit} 사이로 적어 주세요` }
  }
  const parsed = METRICS.map((x) => ({ x, p: parse(x.id) }))
  const errors = parsed.flatMap(({ p }) => ('error' in p && p.error ? [p.error] : []))
  const any = parsed.some(({ p }) => !p.empty)
  const dateBad = !date || date > today

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setTried(true)
    if (errors.length || !any || dateBad) return
    const rec: Omit<GrowthRecord, 'id'> = { date }
    for (const { x, p } of parsed) if (!p.empty && 'value' in p && p.value !== undefined) rec[x.id] = p.value
    onSave(rec)
  }

  return (
    <Sheet
      open
      title="키·몸무게 기록"
      onClose={onClose}
      footer={
        <button type="submit" form="growth-form" className="h-12 w-full rounded-3xl border-none bg-ink text-[15px] font-bold text-white">
          저장
        </button>
      }
    >
      <form id="growth-form" onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
          잰 날
          <input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} className={`${inputCls} font-normal`} />
        </label>
        {METRICS.map((x) => (
          <label key={x.id} className="flex flex-col gap-1.5 text-[13px] font-semibold">
            {x.label} ({x.unit}, 잰 것만)
            <input
              type="number"
              inputMode="decimal"
              step={x.step}
              value={text[x.id]}
              onChange={(e) => setText((t) => ({ ...t, [x.id]: e.target.value }))}
              className={`${inputCls} font-normal`}
            />
          </label>
        ))}
        {tried && (errors.length > 0 || !any || dateBad) && (
          <p role="alert" className="m-0 text-xs font-medium text-urgent">
            {dateBad ? '잰 날을 오늘 이전으로 골라 주세요' : !any ? '하나 이상 적어 주세요' : errors[0]}
          </p>
        )}
        <p className="m-0 text-xs leading-relaxed text-sub">같은 날짜에 이미 기록이 있으면 적은 항목만 바꿔요.</p>
      </form>
    </Sheet>
  )
}
