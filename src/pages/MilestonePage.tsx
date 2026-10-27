import { useState } from 'react'
import { AppHeader } from '../components/AppHeader'
import { MilestoneCard } from '../components/report/MilestoneCard'
import { RetryTip } from '../components/RetryTip'
import { useAppData } from '../lib/data'
import { currentGroup, GROUP_NAMES, MILESTONE_GROUPS, type MilestoneGroup } from '../lib/milestones'

/** 모바일 마일스톤: 단계별 체크리스트 (지금 단계는 월령으로 자동 선택) */
export function MilestonePage() {
  const { profile, milestones, toggleMilestone } = useAppData()
  const now = currentGroup(profile.birthDate)
  const [group, setGroup] = useState<MilestoneGroup>(now)

  return (
    <>
      <AppHeader title="마일스톤" />
      <main className="flex flex-col gap-3.5 px-5">
        <div role="group" aria-label="이유식 단계" className="flex flex-wrap gap-1.5">
          {MILESTONE_GROUPS.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={group === id}
              onClick={() => setGroup(id)}
              className={`h-10 rounded-[20px] px-4 text-[13px] ${group === id ? 'border-none bg-text font-bold text-white' : 'border border-line bg-card font-medium'}`}
            >
              {GROUP_NAMES[id]}
              {id === now && ' · 지금'}
            </button>
          ))}
        </div>
        <MilestoneCard group={group} checked={milestones} onToggle={toggleMilestone} />
        <RetryTip />
      </main>
    </>
  )
}
