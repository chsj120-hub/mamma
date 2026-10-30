import { useEffect, useState, type ReactNode } from 'react'
import { CubeAttentionPanel } from '../../components/desktop/CubeAttentionPanel'
import { CsvImportDialog } from '../../components/desktop/CsvImportDialog'
import { PrintDialog } from '../../components/print/PrintDialog'
import { PcCalendar, PcCalendarLegend } from '../../components/desktop/PcCalendar'
import { TodayMealsPanel } from '../../components/desktop/TodayMealsPanel'
import { AllergenNotice } from '../../components/AllergenNotice'
import { ShareWeekButton } from '../../components/ShareWeekButton'
import { StageNotice } from '../../components/StageNotice'
import { ExpiryAlert } from '../../components/home/ExpiryAlert'
import { NutritionCard } from '../../components/home/NutritionCard'
import { AiFillSheet } from '../../components/planner/AiFillSheet'
import { DayEditorSheet } from '../../components/planner/DayEditorSheet'
import { HistorySheet } from '../../components/planner/HistorySheet'
import type { PlannerView } from '../../components/planner/PlannerHeader'
import { ReplaceSheet } from '../../components/planner/ReplaceSheet'
import { expiringCubes } from '../../lib/cube'
import { useAppData } from '../../lib/data'
import { addDays, addMonths, dayCount, daysInMonth, DOW_KO, dowOf, md, monthStart, todayKey, weekStart } from '../../lib/date'
import { allergenTestProgress, ironDaysThisWeek, mealSlots, veggieKindsThisWeek } from '../../lib/meal'
import { useStoredState } from '../../lib/storage'
import { usePlanActions } from '../../lib/usePlanActions'

type OpenSheet = { kind: 'edit'; date: string } | { kind: 'aifill' } | { kind: 'replace' } | { kind: 'history' } | null

const icon = (children: ReactNode) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
)

/** PC 대시보드 (/): 상단 동작 버튼, 기한 임박 배너, 월간·주간 캘린더 + 오른쪽 오늘 요약 */
export function DashboardPage() {
  const { profile, plans, cubes, commitPlans, snapshots, restoreSnapshot, toggleMealDone, setTaste } = useAppData()
  const actions = usePlanActions()
  const today = todayKey()
  const [view, setView] = useStoredState<PlannerView>('pcCalendarView', 'month')
  const [cursor, setCursor] = useState(today)
  const [printing, setPrinting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [sheet, setSheet] = useState<OpenSheet>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => setMessage(null), 2600)
    return () => clearTimeout(t)
  }, [message])

  const start = view === 'month' ? monthStart(cursor) : weekStart(cursor)
  const visible = Array.from({ length: view === 'month' ? daysInMonth(start) : 7 }, (_, i) => addDays(start, i))
  const move = (dir: 1 | -1) => {
    if (view === 'week') return setCursor(addDays(cursor, dir * 7))
    const next = addMonths(start, dir)
    setCursor(monthStart(today) === next ? today : next)
  }
  const periodTitle =
    view === 'month'
      ? `${start.slice(0, 4)}년 ${md(start).month}월`
      : `${md(start).month}월 ${md(start).day}일 – ${md(addDays(start, 6)).month}월 ${md(addDays(start, 6)).day}일`

  const { month, day } = md(today)
  const expiring = expiringCubes(cubes, today)
  const btn = 'flex h-11 items-center gap-2 rounded-[14px] px-4 text-sm'

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-sub">
            {today.slice(0, 4)}년 {month}월 {day}일 {DOW_KO[dowOf(today)]}요일
          </span>
          <h1 className="m-0 font-display text-4xl font-normal">
            {profile.name} 오늘은 <span className="text-ink">D+{dayCount(profile.birthDate, today)}일차</span>
          </h1>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <button type="button" onClick={() => setSheet({ kind: 'aifill' })} className={`${btn} border-none bg-ink font-bold text-white`}>
            {icon(<path d="M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2z" />)}
            AI 추천으로 채우기
          </button>
          <button type="button" onClick={() => setSheet({ kind: 'replace' })} className={`${btn} border border-line bg-card font-semibold`}>
            {icon(
              <>
                <path d="M17 1l4 4-4 4" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <path d="M7 23l-4-4 4-4" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </>,
            )}
            알레르기 재료 대체
          </button>
          <button type="button" onClick={() => setSheet({ kind: 'history' })} className={`${btn} border border-line bg-card font-semibold`}>
            {icon(
              <>
                <path d="M9 14 4 9l5-5" />
                <path d="M4 9h11a5 5 0 0 1 0 10h-3" />
              </>,
            )}
            실행취소
          </button>
          <button type="button" onClick={() => setImporting(true)} className={`${btn} border border-line bg-card font-semibold`}>
            {icon(
              <>
                <path d="M12 3v12" />
                <path d="m7 10 5 5 5-5" />
                <path d="M5 21h14" />
              </>,
            )}
            CSV 입력
          </button>
          <ShareWeekButton weekStart={weekStart(cursor)} className={`${btn} border border-line bg-card font-semibold`} />
          <button type="button" onClick={() => setPrinting(true)} className={`${btn} border border-line bg-card font-semibold`}>
            {icon(
              <>
                <path d="M6 9V2h12v7" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </>,
            )}
            출력
          </button>
        </div>
      </div>

      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-8 z-20 flex justify-center">
        {message && <span className="rounded-full bg-text/90 px-5 py-2.5 text-sm font-semibold text-white shadow-lg">{message}</span>}
      </div>

      <div className="print:hidden">
        <ExpiryAlert cubes={expiring} hint="이번 주 식단에 우선 배치하세요" linkLabel="보관함 열기" />
      </div>

      <div className="flex flex-wrap items-start gap-5">
        <section className="flex min-w-0 flex-[2_1_560px] flex-col gap-3.5 rounded-[22px] border border-line bg-card p-5" aria-label="식단 캘린더">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button type="button" aria-label={view === 'month' ? '이전 달' : '이전 주'} onClick={() => move(-1)} className="flex size-10 items-center justify-center rounded-full border border-line bg-card print:hidden">
                {icon(<path d="m15 18-6-6 6-6" />)}
              </button>
              <h2 className="m-0 min-w-[140px] text-center font-display text-2xl font-normal" aria-live="polite">
                {periodTitle}
              </h2>
              <button type="button" aria-label={view === 'month' ? '다음 달' : '다음 주'} onClick={() => move(1)} className="flex size-10 items-center justify-center rounded-full border border-line bg-card print:hidden">
                {icon(<path d="m9 18 6-6-6-6" />)}
              </button>
              {!visible.includes(today) && (
                <button type="button" onClick={() => setCursor(today)} className="h-10 rounded-[20px] border border-line bg-card px-3 text-[13px] font-semibold text-ink print:hidden">
                  오늘
                </button>
              )}
            </div>
            <div role="group" aria-label="보기 전환" className="flex rounded-[22px] bg-track p-1 print:hidden">
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
                  onClick={() => setView(v)}
                  className={`h-9 rounded-[18px] border-none px-4 text-[13px] ${view === v ? 'bg-card font-bold text-ink' : 'bg-transparent font-semibold text-muted'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <PcCalendar view={view} start={start} today={today} plans={plans} onOpenDay={(date) => setSheet({ kind: 'edit', date })} />
          <PcCalendarLegend />
        </section>

        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
          <StageNotice />
          <TodayMealsPanel meals={plans[today]?.meals ?? []} onToggle={(id) => toggleMealDone(today, id)} onTaste={(id, t) => setTaste(today, id, t)} />
          <AllergenNotice how="캘린더에서 날짜를 눌러 '알레르기 테스트' 칸에 넣을 수 있어요." />
          <CubeAttentionPanel cubes={cubes} today={today} />
          <NutritionCard
            ironDays={ironDaysThisWeek(plans, today)}
            veggieKinds={veggieKindsThisWeek(plans, today)}
            allergenTest={allergenTestProgress(plans, today)}
            showLink={false}
          />
        </div>
      </div>

      {sheet?.kind === 'edit' && (
        <DayEditorSheet
          key={sheet.date}
          date={sheet.date}
          meals={plans[sheet.date]?.meals ?? []}
          slots={mealSlots(profile)}
          targetMl={profile.targetMl}
          onSave={(meals) => {
            actions.saveDay(sheet.date, meals)
            setSheet(null)
            setMessage('저장했어요')
          }}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet?.kind === 'aifill' && <AiFillSheet dates={visible} today={today} onClose={() => setSheet(null)} onDone={setMessage} />}
      {sheet?.kind === 'replace' && (
        <ReplaceSheet
          plans={plans}
          today={today}
          onClose={() => setSheet(null)}
          onApply={(next, label, count) => {
            commitPlans(next, label)
            setSheet(null)
            setMessage(`${count}끼의 재료를 바꿨어요`)
          }}
        />
      )}
      {sheet?.kind === 'history' && (
        <HistorySheet
          snapshots={snapshots}
          onClose={() => setSheet(null)}
          onRestore={(id) => {
            restoreSnapshot(id)
            setSheet(null)
            setMessage('되돌렸어요')
          }}
        />
      )}
      {importing && <CsvImportDialog onClose={() => setImporting(false)} onDone={setMessage} />}
      {printing && <PrintDialog initialKind={view === 'week' ? 'week' : 'month'} onClose={() => setPrinting(false)} />}
    </div>
  )
}
