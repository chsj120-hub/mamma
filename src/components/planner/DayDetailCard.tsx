import { koreanTime, md } from '../../lib/date'
import { ingredientName } from '../../lib/ingredients'
import { allergenStreak, daySummary, mealItems, sortMeals } from '../../lib/meal'
import type { MealPlans } from '../../lib/types'
import { IngredientIcon } from '../IngredientIcon'
import { dayTag } from './dayStyle'
import { IngredientChip } from './IngredientChip'

type Props = {
  date: string
  today: string
  dPlus: number
  plans: MealPlans
  onToggle: (mealId: string) => void
  onEdit: () => void
}

/** 월간 캘린더에서 고른 날의 식단 */
export function DayDetailCard({ date, today, dPlus, plans, onToggle, onEdit }: Props) {
  const day = plans[date]
  const s = daySummary(day)
  const tag = dayTag(date, today, s.status)
  const { month, day: d } = md(date)

  return (
    <article className="flex flex-col gap-3 rounded-[20px] border-[1.5px] border-line bg-card p-4" aria-live="polite">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold text-muted">{dPlus >= 0 ? `D+${dPlus}` : '출생 전'}</span>
          <h2 className="m-0 text-[17px] font-bold">
            {month}월 {d}일 식단
          </h2>
        </div>
        <span className={`rounded-[10px] px-2.5 py-1 text-xs font-bold ${tag.cls}`}>{tag.text}</span>
      </div>

      {s.status === 'empty' ? (
        <p className="m-0 rounded-xl bg-bg p-4 text-center text-sm text-sub">아직 계획된 식단이 없어요.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {sortMeals(day!.meals).map((m) => {
            const done = m.status === 'done'
            return (
              <li key={m.id} className={`flex flex-col gap-2 rounded-xl border p-2.5 ${done ? 'border-done-soft-line bg-done-bg' : 'border-line bg-bg'}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold text-muted">
                    {koreanTime(m.time)} · {m.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => onToggle(m.id)}
                    aria-pressed={done}
                    aria-label={`${m.label} ${done ? '완료됨, 누르면 예정으로' : '예정, 누르면 완료로'}`}
                    className={`h-9 min-w-16 rounded-[18px] border-[1.5px] px-3 text-[13px] font-bold ${done ? 'border-done-line bg-done text-white' : 'border-line bg-card'}`}
                  >
                    {done ? '✓ 완료' : '예정'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {mealItems(m).map((id) => (
                    <IngredientChip key={id} id={id} />
                  ))}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {s.allergen && (
        <div className="flex items-center gap-2 rounded-[10px] bg-allergy-bg px-2.5 py-2 text-[13px] font-semibold text-allergy">
          <IngredientIcon id={s.allergen} size={22} />
          알레르기 테스트 · {ingredientName(s.allergen)} {allergenStreak(plans, date, s.allergen)}일차
        </div>
      )}

      <button type="button" onClick={onEdit} className="h-11 rounded-[14px] border-none bg-ink text-sm font-bold text-white">
        {s.status === 'empty' ? '이 날 식단 추가' : '이 날 식단 수정'}
      </button>
    </article>
  )
}
