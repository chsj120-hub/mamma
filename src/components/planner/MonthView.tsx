import { addDays, daysInMonth, DOW_KO, dowOf, md } from '../../lib/date'
import { ingredientName } from '../../lib/ingredients'
import { daySummary } from '../../lib/meal'
import type { MealPlans } from '../../lib/types'
import { IngredientIcon } from '../IngredientIcon'
import { dowInk } from './dayStyle'

type Props = {
  /** 그 달 1일 */
  month: string
  today: string
  selected: string
  plans: MealPlans
  onSelect: (date: string) => void
}

export function MonthView({ month, today, selected, plans, onSelect }: Props) {
  const lead = dowOf(month)
  const count = daysInMonth(month)

  return (
    <div className="rounded-[22px] border border-line bg-card px-1.5 py-2.5">
      <div className="grid grid-cols-7 gap-[3px] pb-1.5" aria-hidden="true">
        {DOW_KO.map((d, i) => (
          <span key={d} className={`text-center text-xs font-semibold ${dowInk(i)}`}>
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-[3px]">
        {Array.from({ length: lead }, (_, i) => (
          <span key={`b${i}`} className="h-[88px]" aria-hidden="true" />
        ))}
        {Array.from({ length: count }, (_, i) => {
          const date = addDays(month, i)
          const dow = dowOf(date)
          const s = daySummary(plans[date])
          const isSel = date === selected
          const isToday = date === today
          const tone = isSel
            ? 'border-ink bg-soft'
            : isToday
              ? 'border-accent bg-soft/50'
              : s.allergen
                ? 'border-allergy-ring bg-allergy-soft'
                : 'border-transparent bg-transparent'
          const statusText = s.status === 'empty' ? '식단 없음' : s.status === 'done' ? '완료' : '예정'
          const aria = [
            `${md(date).month}월 ${md(date).day}일`,
            isToday ? '오늘' : '',
            s.mains.map(ingredientName).join(', '),
            s.allergen ? `${ingredientName(s.allergen)} 테스트` : '',
            statusText,
          ]
            .filter(Boolean)
            .join(', ')
          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelect(date)}
              aria-label={aria}
              aria-pressed={isSel}
              className={`flex h-[88px] flex-col items-center justify-start gap-1 rounded-xl border-2 px-0 pt-[5px] ${tone}`}
            >
              <span className="flex h-4 items-center gap-[3px]">
                <span className={`text-[13px] ${isSel || isToday ? 'font-bold' : 'font-medium'} ${dow === 0 ? 'text-urgent' : dow === 6 ? 'text-sat' : 'text-text'}`}>
                  {md(date).day}
                </span>
                {s.status !== 'empty' && (
                  <span className={`size-[5px] rounded-full ${s.status === 'done' ? 'bg-done' : 'bg-plan-dot'}`} aria-hidden="true" />
                )}
              </span>
              <span className="flex flex-col items-center gap-0.5" aria-hidden="true">
                {s.mains.slice(0, 3).map((id) => (
                  <IngredientIcon key={id} id={id} size={18} />
                ))}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function MonthLegend() {
  return (
    <div className="flex flex-wrap gap-3.5 px-2 text-xs text-sub">
      <span className="flex items-center gap-[5px]">
        <span className="size-2 rounded-full bg-done" />
        완료
      </span>
      <span className="flex items-center gap-[5px]">
        <span className="size-2 rounded-full bg-plan-dot" />
        예정
      </span>
      <span className="flex items-center gap-[5px]">
        <span className="size-3 rounded border-2 border-allergy-bar" />
        알레르기 테스트일
      </span>
    </div>
  )
}
