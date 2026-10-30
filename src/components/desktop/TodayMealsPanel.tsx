import { koreanTime } from '../../lib/date'
import { ingredientName } from '../../lib/ingredients'
import { mealItems, mealTitle, sortMeals } from '../../lib/meal'
import type { Meal, Taste } from '../../lib/types'
import { TastePicker } from '../TastePicker'

type Props = {
  meals: Meal[]
  onToggle: (mealId: string) => void
  onTaste: (mealId: string, taste: Taste | undefined) => void
}

/** PC 오른쪽 '오늘의 식단' (한 줄 요약 + 완료 토글) */
export function TodayMealsPanel({ meals, onToggle, onTaste }: Props) {
  const sorted = sortMeals(meals)
  const doneCount = sorted.filter((m) => m.status === 'done').length

  return (
    <section className="flex flex-col gap-2.5 rounded-[22px] border border-line bg-card p-[18px]">
      <div className="flex items-baseline justify-between">
        <h2 className="m-0 text-[17px] font-bold">오늘의 식단</h2>
        {sorted.length > 0 && (
          <span className="text-[13px] text-sub" aria-live="polite">
            {doneCount} / {sorted.length} 완료
          </span>
        )}
      </div>
      {sorted.length === 0 && <p className="m-0 rounded-2xl bg-bg p-4 text-center text-sm text-sub">오늘 계획된 식단이 없어요. 캘린더에서 오늘을 눌러 추가해 주세요.</p>}
      {sorted.map((m) => {
        const done = m.status === 'done'
        return (
          <div key={m.id} className={`flex flex-col gap-2 rounded-2xl border-[1.5px] px-3.5 py-3 transition-colors ${done ? 'border-done-line bg-done-bg' : 'border-line bg-card'}`}>
            <div className="flex items-center gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-xs text-muted">
                {koreanTime(m.time)} · {m.label}
                {done && m.eatenMl != null && ` · ${m.eatenMl}ml 먹음`}
              </span>
              <span className="text-sm font-bold">{mealTitle(m)}</span>
              <span className="truncate text-xs text-sub">
                {mealItems(m).map(ingredientName).join(', ')}
                {m.allergen && <span className="font-semibold text-allergy"> · {ingredientName(m.allergen)} 테스트</span>}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onToggle(m.id)}
              aria-pressed={done}
              aria-label={`${m.label} ${done ? '완료됨, 누르면 예정으로' : '예정, 누르면 완료로'}`}
              className={`flex h-11 min-w-[76px] shrink-0 items-center justify-center gap-1 rounded-[22px] border-[1.5px] px-3 text-[13px] font-bold ${done ? 'border-done-line bg-done text-white' : 'border-line bg-card'}`}
            >
              {done && (
                <svg key="check" className="animate-pop" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
              {done ? '완료' : '예정'}
            </button>
            </div>
            {done && <TastePicker compact value={m.taste} onChange={(t) => onTaste(m.id, t)} />}
          </div>
        )
      })}
    </section>
  )
}
