import { useEffect, useState } from 'react'
import { IngredientIcon } from '../components/IngredientIcon'
import { DayDetailCard } from '../components/planner/DayDetailCard'
import { AiFillSheet } from '../components/planner/AiFillSheet'
import { DayEditorSheet } from '../components/planner/DayEditorSheet'
import { HistorySheet } from '../components/planner/HistorySheet'
import { MonthLegend, MonthView } from '../components/planner/MonthView'
import { ShareWeekButton } from '../components/ShareWeekButton'
import { PlannerHeader, type PlannerView } from '../components/planner/PlannerHeader'
import { PlannerToolbar } from '../components/planner/PlannerToolbar'
import { ReplaceSheet } from '../components/planner/ReplaceSheet'
import { WeekView } from '../components/planner/WeekView'
import { useAppData } from '../lib/data'
import { addDays, addMonths, dayCount, daysInMonth, md, monthStart, todayKey, weekStart } from '../lib/date'
import { mealSlots } from '../lib/meal'
import { STAGES } from '../lib/stage'
import { useStoredState } from '../lib/storage'
import type { Meal } from '../lib/types'
import { usePlanActions } from '../lib/usePlanActions'

type OpenSheet = { kind: 'edit'; date: string } | { kind: 'aifill' } | { kind: 'replace' } | { kind: 'history' } | null

export function PlannerPage() {
  const { profile, plans, commitPlans, snapshots, restoreSnapshot, toggleMealDone } = useAppData()
  const today = todayKey()
  const [view, setView] = useStoredState<PlannerView>('plannerView', 'week')
  const [cursor, setCursor] = useState(today)
  const [sheet, setSheet] = useState<OpenSheet>(null)
  const [message, setMessage] = useState<string | null>(null)
  const actions = usePlanActions()

  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => setMessage(null), 2600)
    return () => clearTimeout(t)
  }, [message])

  const week = weekStart(cursor)
  const month = monthStart(cursor)
  const visibleDates =
    view === 'week' ? Array.from({ length: 7 }, (_, i) => addDays(week, i)) : Array.from({ length: daysInMonth(month) }, (_, i) => addDays(month, i))

  const move = (dir: 1 | -1) => {
    if (view === 'week') return setCursor(addDays(cursor, dir * 7))
    const next = addMonths(month, dir)
    setCursor(monthStart(today) === next ? today : next)
  }

  const fill = () => setSheet({ kind: 'aifill' })

  const saveDay = (date: string, meals: Meal[]) => {
    actions.saveDay(date, meals)
    setSheet(null)
    setMessage('저장했어요')
  }

  const stageShort = STAGES[profile.stage].short
  const header =
    view === 'week'
      ? {
          title: `${md(week).month}월 ${md(week).day}일 – ${md(addDays(week, 6)).month}월 ${md(addDays(week, 6)).day}일`,
          subtitle: `D+${dayCount(profile.birthDate, week)} ~ D+${dayCount(profile.birthDate, addDays(week, 6))} · ${stageShort}`,
          prev: '이전 주',
          next: '다음 주',
        }
      : {
          title: `${month.slice(0, 4)}년 ${md(month).month}월`,
          subtitle: (
            <>
              <IngredientIcon id="rice" size={16} />
              베이스 쌀 공통 · 재료만 표시
            </>
          ),
          prev: '이전 달',
          next: '다음 달',
        }

  return (
    <>
      <PlannerHeader
        view={view}
        onView={setView}
        title={header.title}
        titleDisplay={view === 'month'}
        subtitle={header.subtitle}
        prevLabel={header.prev}
        nextLabel={header.next}
        onPrev={() => move(-1)}
        onNext={() => move(1)}
      />

      <main className={`flex flex-col gap-3 pb-20 ${view === 'week' ? 'px-5' : 'px-3'}`}>
        {view === 'week' ? (
          <>
            <WeekView start={week} today={today} plans={plans} onOpenDay={(date) => setSheet({ kind: 'edit', date })} />
            <ShareWeekButton weekStart={week} className="min-h-11 self-end rounded-[22px] border border-line bg-card px-4 text-[13px] font-semibold text-text" />
          </>
        ) : (
          <>
            <MonthView month={month} today={today} selected={cursor} plans={plans} onSelect={setCursor} />
            <MonthLegend />
            <DayDetailCard
              date={cursor}
              today={today}
              dPlus={dayCount(profile.birthDate, cursor)}
              plans={plans}
              onToggle={(id) => toggleMealDone(cursor, id)}
              onEdit={() => setSheet({ kind: 'edit', date: cursor })}
            />
          </>
        )}
      </main>

      <PlannerToolbar
        onFill={fill}
        onReplace={() => setSheet({ kind: 'replace' })}
        onUndo={() => setSheet({ kind: 'history' })}
        undoCount={snapshots.length}
        message={message}
      />

      {sheet?.kind === 'edit' && (
        <DayEditorSheet
          key={sheet.date}
          date={sheet.date}
          meals={plans[sheet.date]?.meals ?? []}
          slots={mealSlots(profile)}
          targetMl={profile.targetMl}
          onSave={(meals) => saveDay(sheet.date, meals)}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet?.kind === 'aifill' && <AiFillSheet dates={visibleDates} today={today} onClose={() => setSheet(null)} onDone={setMessage} />}
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
    </>
  )
}
