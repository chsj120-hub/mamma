import { koreanTime } from '../../lib/date'
import { ingredientName } from '../../lib/ingredients'
import { mealItems, mealTitle } from '../../lib/meal'
import type { Meal, Taste } from '../../lib/types'
import { IngredientIcon } from '../IngredientIcon'
import { TastePicker } from '../TastePicker'

type Props = {
  meal: Meal
  /** 알레르기 테스트 몇 일차인지 (없으면 표시 안 함) */
  allergenDay?: number
  onToggle: () => void
  /** 1회 목표량. 먹은 양 기록 칸의 시작값 */
  targetMl: number
  onEatenChange: (ml: number | undefined) => void
  onTasteChange: (taste: Taste | undefined) => void
  /** 완료한 사람 이름을 보여 줄지 (가족 공유 중일 때) */
  showDoneBy?: boolean
}

const ML_STEP = 10

export function MealCard({ meal, allergenDay, onToggle, targetMl, onEatenChange, onTasteChange, showDoneBy }: Props) {
  const done = meal.status === 'done'
  return (
    <article
      className={`flex flex-col gap-3 rounded-[20px] border-[1.5px] p-4 transition-colors duration-300 ${
        done ? 'border-done-line bg-done-bg' : 'border-line bg-card'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-xs font-semibold text-muted">
            {koreanTime(meal.time)} · {meal.label}
            {done && showDoneBy && meal.doneBy && ` · ${meal.doneBy}님이 먹였어요`}
          </span>
          <span className="text-base font-bold">{mealTitle(meal)}</span>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={done}
          aria-label={`${meal.label} ${done ? '완료됨, 누르면 예정으로' : '예정, 누르면 완료로'}`}
          className={`flex h-11 min-w-[88px] shrink-0 items-center justify-center gap-1.5 rounded-[22px] border-[1.5px] px-3.5 text-sm font-bold transition-colors ${
            done ? 'border-done-line bg-done text-white' : 'border-line bg-card text-text'
          }`}
        >
          {done && (
            <svg key="check" className="animate-pop" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          )}
          {done ? '완료' : '예정'}
        </button>
      </div>

      <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0" aria-label="재료">
        {mealItems(meal).map((id) => (
          <li key={id} className="flex items-center gap-[5px] rounded-[10px] border border-line bg-card py-1 pr-2.5 pl-[5px] text-[13px]">
            <IngredientIcon id={id} size={22} />
            {ingredientName(id)}
          </li>
        ))}
      </ul>

      {done && (
        <div className="flex items-center justify-between gap-2 rounded-[14px] bg-card px-3 py-1.5">
          <span className="text-[13px] font-semibold text-sub">먹은 양</span>
          {meal.eatenMl == null ? (
            <button type="button" onClick={() => onEatenChange(targetMl)} className="h-9 rounded-[18px] border-[1.5px] border-line bg-card px-3 text-[13px] font-semibold text-ink">
              + 기록하기
            </button>
          ) : (
            <span className="flex items-center gap-1">
              <button
                type="button"
                aria-label={`${ML_STEP}ml 줄이기`}
                onClick={() => onEatenChange(Math.max(0, meal.eatenMl! - ML_STEP))}
                className="flex size-9 items-center justify-center rounded-full border-[1.5px] border-line bg-card text-lg font-bold"
              >
                −
              </button>
              <span className="min-w-16 text-center font-display text-lg" aria-live="polite">
                {meal.eatenMl}
                <span className="text-xs">ml</span>
              </span>
              <button
                type="button"
                aria-label={`${ML_STEP}ml 늘리기`}
                onClick={() => onEatenChange(Math.min(500, meal.eatenMl! + ML_STEP))}
                className="flex size-9 items-center justify-center rounded-full border-[1.5px] border-line bg-card text-lg font-bold"
              >
                +
              </button>
            </span>
          )}
        </div>
      )}

      {done && <TastePicker value={meal.taste} onChange={onTasteChange} />}

      {meal.allergen && (
        <div className="flex items-center gap-2 rounded-[10px] bg-allergy-bg px-2.5 py-1.5 text-[13px] font-semibold text-allergy">
          <IngredientIcon id={meal.allergen} size={22} />
          알레르기 테스트 · {ingredientName(meal.allergen)}
          {allergenDay ? ` ${allergenDay}일차` : ''}
        </div>
      )}
    </article>
  )
}
