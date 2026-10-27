import { addDays, DOW_KO, dowOf, md } from '../../lib/date'
import { ingredientName } from '../../lib/ingredients'
import { allergenStreak, daySummary } from '../../lib/meal'
import type { MealPlans } from '../../lib/types'
import { dayTag, dowInk } from './dayStyle'
import { IngredientChip } from './IngredientChip'

type Props = {
  start: string
  today: string
  plans: MealPlans
  onOpenDay: (date: string) => void
}

export function WeekView({ start, today, plans, onOpenDay }: Props) {
  return (
    <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
      {Array.from({ length: 7 }, (_, i) => {
        const date = addDays(start, i)
        const dow = dowOf(date)
        const s = daySummary(plans[date])
        const tag = dayTag(date, today, s.status)
        const isToday = date === today
        const title = s.mains.length ? s.mains.map(ingredientName).join(' · ') : '식단 없음'
        const tone = isToday ? 'border-accent bg-soft' : s.status === 'done' ? 'border-done-soft-line bg-done-bg' : 'border-line bg-card'
        return (
          <li key={date}>
            <button
              type="button"
              onClick={() => onOpenDay(date)}
              aria-label={`${md(date).month}월 ${md(date).day}일 ${DOW_KO[dow]}요일, ${title}, ${tag.text}. 눌러서 수정`}
              className={`flex w-full items-start gap-3 rounded-[18px] border-[1.5px] px-3.5 py-3 text-left ${tone}`}
            >
              <div className="flex w-11 shrink-0 flex-col items-center gap-0.5 pt-0.5">
                <span className={`text-xs font-semibold ${dowInk(dow)}`}>{DOW_KO[dow]}</span>
                <span className="font-display text-[22px] leading-[1.1]">{md(date).day}</span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-bold ${s.status === 'empty' ? 'text-muted' : ''}`}>{title}</span>
                  <span className={`shrink-0 rounded-lg px-2 py-[3px] text-xs font-bold ${tag.cls}`}>{tag.text}</span>
                </div>
                {s.status === 'empty' ? (
                  <span className="text-[13px] text-muted">눌러서 식단을 추가해요</span>
                ) : (
                  <div className="flex flex-wrap gap-1" aria-hidden="true">
                    {[...s.bases, ...s.mains].map((id) => (
                      <IngredientChip key={id} id={id} />
                    ))}
                    {s.allergen && (
                      <IngredientChip id={s.allergen} allergy suffix={` ${allergenStreak(plans, date, s.allergen)}일`} />
                    )}
                  </div>
                )}
              </div>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
