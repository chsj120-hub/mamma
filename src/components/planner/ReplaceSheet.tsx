import { useMemo, useState } from 'react'
import { ALLERGENS, INGREDIENT_IDS, INGREDIENTS, ingredientName, type IngredientId } from '../../lib/ingredients'
import { mealItems, SLOTS } from '../../lib/meal'
import type { Meal, MealPlans } from '../../lib/types'
import { IngredientIcon } from '../IngredientIcon'
import { Sheet } from '../Sheet'

type Props = {
  plans: MealPlans
  today: string
  onApply: (next: MealPlans, label: string, count: number) => void
  onClose: () => void
}

/** 오늘 이후 아직 안 먹은 끼니에서 재료 하나를 다른 재료로 일괄 바꾼다 */
export function ReplaceSheet({ plans, today, onApply, onClose }: Props) {
  const [from, setFrom] = useState<IngredientId | null>(null)
  const [to, setTo] = useState<IngredientId | 'none' | null>(null)

  const targets = useMemo(
    () =>
      Object.values(plans)
        .filter((d) => d.date >= today)
        .flatMap((d) => d.meals.filter((m) => m.status === 'planned').map((m) => ({ date: d.date, meal: m }))),
    [plans, today],
  )

  const used = useMemo(() => {
    const set = new Set<IngredientId>()
    for (const { meal } of targets) {
      mealItems(meal).forEach((id) => set.add(id))
      if (meal.allergen) set.add(meal.allergen)
    }
    return INGREDIENT_IDS.filter((id) => set.has(id))
  }, [targets])

  const isAllergen = from ? ALLERGENS.includes(from) : false
  const toOptions = from
    ? isAllergen
      ? ALLERGENS.filter((id) => id !== from)
      : INGREDIENT_IDS.filter((id) => id !== from && !ALLERGENS.includes(id) && INGREDIENTS[id].category === INGREDIENTS[from].category)
    : []

  const affected = from ? targets.filter(({ meal }) => SLOTS.some((s) => meal[s.key] === from)).length : 0

  const apply = () => {
    if (!from || !to) return
    const value = to === 'none' ? undefined : to
    const next: MealPlans = { ...plans }
    for (const day of Object.values(plans)) {
      if (day.date < today) continue
      next[day.date] = {
        ...day,
        meals: day.meals.map((m) => {
          if (m.status !== 'planned') return m
          const out: Meal = { ...m }
          for (const s of SLOTS) if (out[s.key] === from) out[s.key] = value
          return out
        }),
      }
    }
    const label = `재료 대체 · ${ingredientName(from)} → ${value ? ingredientName(value) : '테스트 빼기'}`
    onApply(next, label, affected)
  }

  const optionBtn = (selected: boolean) =>
    `flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border-[1.5px] px-1 py-1.5 text-[11px] ${
      selected ? 'border-ink bg-soft font-bold' : 'border-line bg-card'
    }`

  return (
    <Sheet
      open
      title="재료 대체"
      onClose={onClose}
      footer={
        <button
          type="button"
          disabled={!from || !to || affected === 0}
          onClick={apply}
          className="h-12 w-full rounded-3xl border-none bg-ink text-[15px] font-bold text-white disabled:opacity-40"
        >
          {from && to ? `${affected}끼 바꾸기` : '바꿀 재료를 골라 주세요'}
        </button>
      }
    >
      <p className="m-0 text-[13px] leading-relaxed text-sub">오늘부터 아직 먹지 않은 식단에서 재료를 한 번에 바꿔요. 알레르기 반응이 있었던 재료를 뺄 때 쓰면 좋아요.</p>

      <section className="flex flex-col gap-2">
        <h3 className="m-0 text-[13px] font-semibold text-sub">1. 바꿀 재료</h3>
        {used.length === 0 ? (
          <p className="m-0 rounded-xl bg-card p-4 text-center text-sm text-sub">앞으로 예정된 식단이 없어요.</p>
        ) : (
          <div className="grid grid-cols-4 gap-1.5">
            {used.map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={from === id}
                onClick={() => {
                  setFrom(id)
                  setTo(null)
                }}
                className={optionBtn(from === id)}
              >
                <IngredientIcon id={id} size={24} />
                {ingredientName(id)}
              </button>
            ))}
          </div>
        )}
      </section>

      {from && (
        <section className="flex flex-col gap-2">
          <h3 className="m-0 text-[13px] font-semibold text-sub">2. {ingredientName(from)} 대신 넣을 재료</h3>
          <div className="grid grid-cols-4 gap-1.5">
            {toOptions.map((id) => (
              <button key={id} type="button" aria-pressed={to === id} onClick={() => setTo(id)} className={optionBtn(to === id)}>
                <IngredientIcon id={id} size={24} />
                {ingredientName(id)}
              </button>
            ))}
            {isAllergen && (
              <button type="button" aria-pressed={to === 'none'} onClick={() => setTo('none')} className={optionBtn(to === 'none')}>
                테스트 빼기
              </button>
            )}
          </div>
        </section>
      )}
    </Sheet>
  )
}
