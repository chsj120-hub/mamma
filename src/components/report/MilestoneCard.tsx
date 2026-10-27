import { Link } from 'react-router-dom'
import { GROUP_NAMES, isChecked, milestoneKey, MILESTONES, type MilestoneChecks, type MilestoneGroup } from '../../lib/milestones'

type Props = {
  group: MilestoneGroup
  checked: MilestoneChecks
  onToggle: (key: string) => void
  /** 있으면 제목 옆에 '전체 단계' 링크 */
  moreTo?: string
}

export function MilestoneCard({ group, checked, onToggle, moreTo }: Props) {
  const items = MILESTONES[group]
  const count = items.filter((_, i) => isChecked(checked, milestoneKey(group, i))).length

  return (
    <section className="flex flex-col gap-2 rounded-[20px] border border-line bg-card p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="m-0 text-base font-bold">{GROUP_NAMES[group]} 마일스톤</h2>
        <span className="flex items-baseline gap-3">
          <span className="text-[13px] font-bold text-ink" aria-live="polite">
            {count} / {items.length}
          </span>
          {moreTo && (
            <Link to={moreTo} className="text-[13px] font-semibold text-ink">
              전체 단계
            </Link>
          )}
        </span>
      </div>
      {items.map(({ text }, i) => {
        const key = milestoneKey(group, i)
        const on = isChecked(checked, key)
        return (
          <label key={key} className={`flex min-h-11 cursor-pointer items-center gap-3 text-sm ${on ? 'text-sub' : 'text-text'}`}>
            <input type="checkbox" checked={on} onChange={() => onToggle(key)} className="m-0 size-[22px] shrink-0 accent-done" />
            <span className={on ? 'line-through' : ''}>{text}</span>
          </label>
        )
      })}
    </section>
  )
}
