import { useState, type ReactNode } from 'react'
import { PcBarChart, type Bar } from '../../components/desktop/PcBarChart'
import { PrintDialog } from '../../components/print/PrintDialog'
import { IngredientIcon } from '../../components/IngredientIcon'
import { GrowthCard } from '../../components/report/GrowthCard'
import { testBadge } from '../../components/report/TestRecordCard'
import { RetryTip } from '../../components/RetryTip'
import { useAppData } from '../../lib/data'
import { addDays, addMonths, DOW_KO, dowOf, md, monthStart, todayKey, weekStart } from '../../lib/date'
import { ingredientName } from '../../lib/ingredients'
import {
  categoryCounts,
  ingredientTests,
  monthWeekBars,
  periodDates,
  periodSummary,
  TEST_DAYS_TOTAL,
  triedIngredients,
  weekIntake,
  weekLabel,
  type Period,
} from '../../lib/report'
import { useStoredState } from '../../lib/storage'

const mdot = (key: string) => `${md(key).month}.${String(md(key).day).padStart(2, '0')}`

const chevron = (d: string) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
)

function Kpi({ label, value, unit, sub }: { label: string; value: ReactNode; unit?: string; sub: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-[18px] border border-line bg-card px-[18px] py-4">
      <span className="text-[13px] text-sub">{label}</span>
      <span className="font-display text-[32px] leading-tight">
        {value}
        {unit && <span className="text-[15px]">{unit}</span>}
      </span>
      <span className="truncate text-xs text-sub">{sub}</span>
    </div>
  )
}

/** PC 성장 리포트 (/report) */
export function PcReportPage() {
  const { profile, plans, reactions, toggleReaction } = useAppData()
  const today = todayKey()
  const [period, setPeriod] = useStoredState<Period>('pcReportPeriod', 'week')
  const [cursor, setCursor] = useState(today)
  const [printing, setPrinting] = useState(false)

  const start = period === 'week' ? weekStart(cursor) : monthStart(cursor)
  const dates = periodDates(period, start)
  const end = dates[dates.length - 1]
  const isCurrent = dates.includes(today)
  const target = profile.targetMl * profile.mealsPerDay

  const move = (dir: 1 | -1) => setCursor(period === 'week' ? addDays(start, dir * 7) : addMonths(start, dir))

  const sum = periodSummary(plans, dates, today)
  const periodLabel = period === 'week' ? `${weekLabel(start)} · ${mdot(start)} – ${mdot(end)}` : `${start.slice(0, 4)}년 ${md(start).month}월`

  const bars: Bar[] =
    period === 'week'
      ? weekIntake(plans, start).map((d) => ({
          key: d.date,
          label: `${DOW_KO[dowOf(d.date)]} ${md(d.date).day}`,
          ml: d.date <= today ? d.ml : null,
          iron: d.iron,
          current: d.date === today,
          srLabel: `${md(d.date).month}월 ${md(d.date).day}일 ${d.ml == null || d.date > today ? '기록 없음' : `${d.ml}ml`}`,
        }))
      : monthWeekBars(plans, start, today).map((w) => ({
          key: w.label,
          label: w.label,
          ml: w.ml,
          iron: w.iron,
          current: today >= w.from && today <= w.to,
          srLabel: `${w.label} 하루 평균 ${w.ml == null ? '기록 없음' : `${w.ml}ml`}`,
        }))

  const groups = categoryCounts(plans, dates, today)
  const gmax = Math.max(1, ...groups.map((g) => g.n))
  const anyEaten = groups.some((g) => g.n > 0)
  const lowest = [...groups].sort((a, b) => a.n - b.n)[0]

  const tests = ingredientTests(plans, today, reactions)
  const tried = triedIngredients(plans)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-sub" aria-live="polite">
            {periodLabel}
          </span>
          <h1 className="m-0 font-display text-4xl font-normal">성장 리포트</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <button type="button" aria-label={period === 'week' ? '이전 주' : '이전 달'} onClick={() => move(-1)} className="flex size-11 items-center justify-center rounded-full border border-line bg-card">
            {chevron('m15 18-6-6 6-6')}
          </button>
          <button
            type="button"
            aria-label={period === 'week' ? '다음 주' : '다음 달'}
            disabled={isCurrent || start > today}
            onClick={() => move(1)}
            className="flex size-11 items-center justify-center rounded-full border border-line bg-card disabled:opacity-30"
          >
            {chevron('m9 18 6-6-6-6')}
          </button>
          {!isCurrent && (
            <button type="button" onClick={() => setCursor(today)} className="h-11 rounded-[22px] border border-line bg-card px-4 text-[13px] font-semibold text-ink">
              {period === 'week' ? '이번 주' : '이번 달'}
            </button>
          )}
          <div role="group" aria-label="기간" className="flex rounded-[22px] bg-track p-1">
            {(
              [
                ['week', '주간'],
                ['month', '월간'],
              ] as const
            ).map(([p, label]) => (
              <button
                key={p}
                type="button"
                aria-pressed={period === p}
                onClick={() => setPeriod(p)}
                className={`h-9 rounded-[18px] border-none px-4 text-[13px] font-bold ${period === p ? 'bg-card text-ink' : 'bg-transparent text-muted'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setPrinting(true)} className="flex h-11 items-center gap-2 rounded-[14px] border-none bg-ink px-4 text-sm font-bold text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 9V2h12v7" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            리포트 출력
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
        <Kpi
          label="하루 평균 섭취량"
          value={sum.avgMl ?? '–'}
          unit={sum.avgMl != null ? 'ml' : undefined}
          sub={sum.avgMl != null ? `목표 ${target}ml의 ${Math.round((sum.avgMl / target) * 100)}% · ${sum.recordedDays}일 기록` : '먹은 양 기록이 없어요'}
        />
        <Kpi
          label="철분 공급일"
          value={sum.ironDays}
          unit={` / ${sum.eatenDays}일`}
          sub={sum.eatenDays ? `이유식을 먹은 ${sum.eatenDays}일 중 소고기 포함` : '완료한 끼니가 없어요'}
        />
        <Kpi
          label="새로 시도한 재료"
          value={sum.newOnes.length}
          unit="종"
          sub={sum.newOnes.length ? sum.newOnes.slice(0, 3).map(ingredientName).join(' · ') + (sum.newOnes.length > 3 ? ` 외 ${sum.newOnes.length - 3}` : '') : '이 기간에 처음 먹은 재료가 없어요'}
        />
        <Kpi
          label="식단 완료율"
          value={sum.mealsDue ? Math.round((sum.mealsDone / sum.mealsDue) * 100) : '–'}
          unit={sum.mealsDue ? '%' : undefined}
          sub={sum.mealsDue ? `${sum.mealsDue}끼 중 ${sum.mealsDone}끼 완료` : '오늘까지 계획된 끼니가 없어요'}
        />
      </div>

      <div className="flex flex-wrap items-stretch gap-5">
        <PcBarChart bars={bars} target={target} title={period === 'week' ? '하루 섭취량' : '주별 하루 평균 섭취량'} />

        <section className="flex min-w-0 flex-[2_1_340px] flex-col gap-4 rounded-[22px] border border-line bg-card p-5">
          <h2 className="m-0 text-[17px] font-bold">재료 분류별 섭취 횟수</h2>
          {groups.map((g) => (
            <div key={g.key} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-sm">
                <IngredientIcon id={g.icon} size={24} />
                <span className="flex-1 font-semibold">{g.name}</span>
                <span className="font-bold">{g.n}회</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-[5px] bg-track" role="progressbar" aria-label={`${g.name} 섭취 횟수`} aria-valuemin={0} aria-valuemax={gmax} aria-valuenow={g.n}>
                <div className="h-full rounded-[5px] bg-accent" style={{ width: `${(g.n / gmax) * 100}%` }} />
              </div>
            </div>
          ))}
          <p className="m-0 mt-auto rounded-[14px] bg-soft px-3.5 py-3 text-[13px] leading-relaxed">
            {anyEaten
              ? `${lowest.name} 섭취가 다른 분류보다 적어요. 다음 ${period === 'week' ? '주' : '달'} 식단에 ${lowest.name} 큐브를 배치해 보세요.`
              : '이 기간에 완료한 끼니가 없어요. 식단을 먹고 완료로 표시하면 여기에 모여요.'}
          </p>
        </section>
      </div>

      <div className="flex flex-wrap items-stretch gap-5">
        <section className="flex min-w-0 flex-[3_1_560px] flex-col gap-2.5 rounded-[22px] border border-line bg-card p-5">
          <h2 className="m-0 text-[17px] font-bold">알레르기 3일 테스트 기록</h2>
          {tests.length === 0 ? (
            <p className="m-0 text-sm text-sub">아직 테스트한 재료가 없어요.</p>
          ) : (
            <div className="overflow-x-auto">
              <div role="table" aria-label="알레르기 3일 테스트 기록" className="min-w-[560px]">
                <div role="row" className="grid grid-cols-[1.6fr_1fr_1.2fr_1.3fr_44px] gap-3 border-b border-line px-1 py-2 text-xs font-semibold text-sub">
                  {['재료', '시작일', '1 · 2 · 3일차', '결과', ''].map((h, i) => (
                    <span key={i} role="columnheader">
                      {h || <span className="sr-only">반응 표시</span>}
                    </span>
                  ))}
                </div>
                {tests.map((t) => {
                  const b = testBadge(t.status, t.days)
                  const reacted = t.status === 'reaction'
                  const bar = t.status === 'running' ? 'bg-allergy-bar' : reacted ? 'bg-urgent' : 'bg-done'
                  return (
                    <div key={t.id} role="row" className="grid grid-cols-[1.6fr_1fr_1.2fr_1.3fr_44px] items-center gap-3 border-b border-track px-1 py-2">
                      <span role="cell" className="flex items-center gap-2.5 text-sm font-bold">
                        <IngredientIcon id={t.id} size={28} />
                        {ingredientName(t.id)}
                        {t.allergen && <span className="text-[11px] font-medium text-allergy">주의</span>}
                      </span>
                      <span role="cell" className="text-[13px] text-sub">
                        {t.first ? mdot(t.first) : t.next ? `${mdot(t.next)} 예정` : '–'}
                      </span>
                      <span role="cell" className="flex gap-1.5" aria-label={`3일 중 ${t.days}일 진행`}>
                        {Array.from({ length: TEST_DAYS_TOTAL }, (_, i) => (
                          <span key={i} className={`h-2.5 w-7 rounded-[5px] ${i < t.days ? bar : 'bg-track'}`} />
                        ))}
                      </span>
                      <span role="cell">
                        <span className={`inline-block rounded-[10px] px-2.5 py-1 text-xs font-bold ${b.cls}`}>{b.text}</span>
                      </span>
                      <span role="cell">
                        {t.status !== 'untried' && t.status !== 'planned' && (
                          <button
                            type="button"
                            aria-pressed={reacted}
                            aria-label={`${ingredientName(t.id)} ${reacted ? '반응 표시 지우기' : '반응 있었음으로 표시'}`}
                            title={reacted ? '반응 표시 지우기' : '반응이 있었어요'}
                            onClick={() => toggleReaction(t.id)}
                            className={`flex size-9 items-center justify-center rounded-full border-[1.5px] print:hidden ${reacted ? 'border-urgent bg-urgent-bg text-urgent' : 'border-line bg-card text-muted'}`}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                              <path d="M12 9v4" />
                              <path d="M12 17h.01" />
                            </svg>
                          </button>
                        )}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          <p className="m-0 text-xs text-sub">시작일부터 3일 연속 먹인 기록으로 판단해요. 두드러기·구토 같은 반응이 있었다면 ⚠ 버튼으로 표시해 주세요.</p>
        </section>

        <section className="flex min-w-0 flex-[2_1_340px] flex-col gap-3 rounded-[22px] border border-line bg-card p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="m-0 text-[17px] font-bold">먹어본 재료</h2>
            <span className="text-[13px] text-sub">{tried.length}종</span>
          </div>
          {tried.length === 0 ? (
            <p className="m-0 text-sm text-sub">완료한 끼니가 생기면 먹어본 재료가 여기에 모여요.</p>
          ) : (
            <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-2 p-0">
              {tried.map((id) => (
                <li key={id} className="flex flex-col items-center gap-1 rounded-[14px] border border-line bg-bg px-1 py-2.5">
                  <IngredientIcon id={id} size={32} />
                  <span className="text-xs font-semibold">{ingredientName(id)}</span>
                </li>
              ))}
            </ul>
          )}
          <RetryTip className="mt-auto" />
        </section>
      </div>

      <GrowthCard />

      <p className="m-0 text-xs text-muted">리포트는 기록을 바탕으로 한 참고 자료예요. 성장이나 알레르기가 걱정되면 소아청소년과와 상담해 주세요.</p>
      {printing && <PrintDialog initialKind={'report'} onClose={() => setPrinting(false)} />}
    </div>
  )
}
