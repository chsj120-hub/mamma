import { useState } from 'react'
import { IntakeChart } from '../components/report/IntakeChart'
import { MilestoneCard } from '../components/report/MilestoneCard'
import { StageCard } from '../components/report/StageCard'
import { TestRecordCard } from '../components/report/TestRecordCard'
import { RetryTip } from '../components/RetryTip'
import { useAppData } from '../lib/data'
import { currentGroup } from '../lib/milestones'
import { addDays, todayKey, weekStart } from '../lib/date'
import { ingredientTests, stageProgress, weekIntake, weekLabel } from '../lib/report'

const chevron = (d: string) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
)

export function ReportPage() {
  const { profile, plans, reactions, toggleReaction, milestones, toggleMilestone } = useAppData()
  const today = todayKey()
  const thisWeek = weekStart(today)
  const [week, setWeek] = useState(thisWeek)

  const navBtn = 'flex size-11 items-center justify-center rounded-full border border-line bg-card disabled:opacity-30'

  return (
    <>
      <header className="flex items-center justify-between px-5 pt-5 pb-3">
        <h1 className="m-0 font-display text-[26px] font-normal">성장 리포트</h1>
        <div className="flex items-center gap-1">
          <button type="button" aria-label="이전 주" onClick={() => setWeek(addDays(week, -7))} className={navBtn}>
            {chevron('m15 18-6-6 6-6')}
          </button>
          <span className="rounded-[14px] bg-soft px-3 py-2 text-[13px] font-semibold text-ink" aria-live="polite">
            {weekLabel(week)}
          </span>
          <button type="button" aria-label="다음 주" disabled={week >= thisWeek} onClick={() => setWeek(addDays(week, 7))} className={navBtn}>
            {chevron('m9 18 6-6-6-6')}
          </button>
        </div>
      </header>

      <main className="flex flex-col gap-3.5 px-5">
        <StageCard bars={stageProgress(profile, today)} />
        <IntakeChart days={weekIntake(plans, week)} dailyTarget={profile.targetMl * profile.mealsPerDay} today={today} />
        <TestRecordCard rows={ingredientTests(plans, today, reactions)} onToggleReaction={toggleReaction} />
        <RetryTip />
        <MilestoneCard group={currentGroup(profile.birthDate, today)} checked={milestones} onToggle={toggleMilestone} moreTo="/milestone" />
        <p className="m-0 px-1 pb-2 text-[11px] leading-relaxed text-muted">
          리포트는 기록을 바탕으로 한 참고 자료예요. 성장이나 알레르기가 걱정되면 소아청소년과와 상담해 주세요.
        </p>
      </main>
    </>
  )
}
