import { koreanTime } from '../../lib/date'
import { ingredientName } from '../../lib/ingredients'
import { mealItems, sortMeals } from '../../lib/meal'
import type { DayMenuSuggestion } from '../../lib/recommender'
import { IngredientIcon } from '../IngredientIcon'

type Props = {
  suggestions: DayMenuSuggestion[]
  onApply: (s: DayMenuSuggestion) => void
  /** 이미 먹은 끼니가 있어서 그건 그대로 두고 나머지만 바꾼다는 안내 */
  keepsDone: boolean
}

/** 그날 메뉴 AI 추천 N가지. 카드를 누르면 바로 적용된다 */
export function DayMenuSuggestions({ suggestions, onApply, keepsDone }: Props) {
  return (
    <section aria-labelledby="menu-suggest-title" className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-0.5">
        <h3 id="menu-suggest-title" className="m-0 flex items-center gap-1.5 text-[15px] font-bold">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-ink">
            <path d="M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2z" />
          </svg>
          AI 추천 메뉴
        </h3>
        <p className="m-0 text-xs leading-relaxed text-sub">
          누르면 바로 적용돼요{keepsDone ? ' (이미 먹은 끼니는 그대로 둬요)' : ''}. 마음에 안 들면 실행취소로 되돌릴 수 있어요.
        </p>
      </div>

      {suggestions.length === 0 ? (
        <p className="m-0 rounded-2xl bg-card p-4 text-center text-[13px] text-sub">지금은 추천할 조합이 없어요. 재료를 3일씩 먹여 보면 추천이 늘어요.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {suggestions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onApply(s)}
                aria-label={`${s.title} 적용: ${s.meals.map((m) => `${m.label} ${mealItems(m).filter((id) => id !== m.base).map(ingredientName).join(' ')}`).join(', ')}`}
                className="flex w-full flex-col gap-2 rounded-[18px] border-[1.5px] border-line bg-card p-3 text-left hover:border-ink focus-visible:border-ink"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold">{s.title}</span>
                  <span className="rounded-lg bg-soft px-2 py-[3px] text-xs font-bold text-ink">적용</span>
                </span>
                {sortMeals(s.meals).map((m) => (
                  <span key={m.id} className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold text-muted">
                      {m.label} · {koreanTime(m.time)}
                    </span>
                    <span className="flex flex-wrap gap-1">
                      {[...mealItems(m).filter((id) => id !== m.base), ...(m.allergen ? [m.allergen] : [])].map((id) => (
                        <span
                          key={id}
                          className={`flex items-center gap-1 rounded-lg py-0.5 pr-2 pl-1 text-xs ${id === m.allergen ? 'bg-allergy-bg font-semibold text-allergy' : 'border border-line bg-bg'}`}
                        >
                          <IngredientIcon id={id} size={16} />
                          {ingredientName(id)}
                        </span>
                      ))}
                    </span>
                  </span>
                ))}
                {s.reasons.length > 0 && <span className="text-[11px] leading-relaxed text-sub">{s.reasons.join(' · ')}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
