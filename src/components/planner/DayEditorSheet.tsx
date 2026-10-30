import { useMemo, useState } from 'react'
import { expiringCubes } from '../../lib/cube'
import { useAppData } from '../../lib/data'
import { useIsDesktop } from '../../lib/device'
import { md, todayKey } from '../../lib/date'
import { ingredientName, type IngredientId } from '../../lib/ingredients'
import { newId, SLOTS, slotOptions, sortMeals, type SlotKey } from '../../lib/meal'
import type { Meal } from '../../lib/types'
import { inputCls } from '../home/ProfileModal'
import { IngredientIcon } from '../IngredientIcon'
import { suggestDayMenus, type DayMenuSuggestion } from '../../lib/recommender'
import { Sheet } from '../Sheet'
import { DayMenuSuggestions } from './DayMenuSuggestions'

type Props = {
  date: string
  meals: Meal[]
  /** 설정한 끼니·시간 (비어 있는 날을 새로 만들 때 기본값) */
  slots: { time: string; label: string }[]
  /** 1회 목표량 (먹은 양 입력칸 안내용) */
  targetMl: number
  onSave: (meals: Meal[]) => void
  onClose: () => void
}

const LABELS = ['아침', '점심', '저녁', '간식']

/** 하루 식단 편집 시트. 끼니별로 칸(베이스·고기·채소…)을 눌러 재료를 고른다 */
export function DayEditorSheet({ date, meals, slots, targetMl, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<Meal[]>(() =>
    meals.length
      ? sortMeals(meals)
      : slots.map((t) => ({ id: newId(), ...t, base: 'rice' as IngredientId, status: 'planned' as const })),
  )
  const [open, setOpen] = useState<{ mealId: string; slot: SlotKey } | null>(null)
  const { month, day } = md(date)
  const desktop = useIsDesktop()
  const { plans, profile, reactions, cubes } = useAppData()

  // 그날 메뉴 AI 추천 3가지 (전날까지의 기록·소비기한 임박 큐브를 반영)
  const suggestions = useMemo(
    () =>
      suggestDayMenus(
        plans,
        date,
        profile,
        reactions,
        expiringCubes(cubes, todayKey()).map((c) => c.ingredient),
      ),
    [plans, date, profile, reactions, cubes],
  )
  const doneMeals = meals.filter((m) => m.status === 'done')

  /** 추천을 바로 적용한다. 이미 먹은 끼니는 그대로 두고 나머지를 추천으로 바꾼다 */
  const applySuggestion = (s: DayMenuSuggestion) => {
    const doneLabels = new Set(doneMeals.map((m) => m.label))
    onSave(sortMeals([...doneMeals, ...s.meals.filter((m) => !doneLabels.has(m.label))]))
  }
  const panel = <DayMenuSuggestions suggestions={suggestions} onApply={applySuggestion} keepsDone={doneMeals.length > 0} />

  const patch = (id: string, p: Partial<Meal>) => setDraft((d) => d.map((m) => (m.id === id ? { ...m, ...p } : m)))

  const addMeal = () => {
    const used = new Set(draft.map((m) => m.label))
    const label = LABELS.find((l) => !used.has(l)) ?? '간식'
    setDraft((d) => [...d, { id: newId(), time: '15:00', label, base: 'rice', status: 'planned' }])
  }

  return (
    <Sheet
      open
      wide={desktop}
      title={`${month}월 ${day}일 식단`}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          {meals.length > 0 && (
            <button type="button" onClick={() => onSave([])} className="h-12 rounded-3xl border-[1.5px] border-line bg-card px-4 text-sm font-bold text-urgent">
              비우기
            </button>
          )}
          <button type="button" onClick={() => onSave(sortMeals(draft))} className="h-12 flex-1 rounded-3xl border-none bg-ink text-[15px] font-bold text-white">
            저장
          </button>
        </div>
      }
    >
      {!desktop && panel}
      <div className={desktop ? 'grid grid-cols-[minmax(0,1fr)_300px] items-start gap-5' : 'contents'}>
      <div className="flex flex-col gap-5">
      {draft.map((meal) => (
        <section key={meal.id} className="flex flex-col gap-3 rounded-[20px] border-[1.5px] border-line bg-card p-4" aria-label={`${meal.label} 식사`}>
          <div className="flex items-center gap-2">
            <select aria-label="끼니" className={`${inputCls} w-24`} value={meal.label} onChange={(e) => patch(meal.id, { label: e.target.value })}>
              {LABELS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
            <input aria-label="시간" type="time" className={`${inputCls} w-32`} value={meal.time} onChange={(e) => patch(meal.id, { time: e.target.value || meal.time })} />
            <button
              type="button"
              aria-label={`${meal.label} 삭제`}
              onClick={() => setDraft((d) => d.filter((m) => m.id !== meal.id))}
              className="ml-auto flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-card text-muted"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {SLOTS.map((slot) => {
              const value = meal[slot.key]
              const active = open?.mealId === meal.id && open.slot === slot.key
              const allergy = slot.key === 'allergen'
              return (
                <button
                  key={slot.key}
                  type="button"
                  aria-expanded={active}
                  onClick={() => setOpen(active ? null : { mealId: meal.id, slot: slot.key })}
                  className={`flex min-h-11 items-center gap-2 rounded-xl border-[1.5px] px-2.5 text-left ${
                    active ? 'border-ink bg-soft' : allergy && value ? 'border-transparent bg-allergy-bg' : 'border-line bg-bg'
                  } ${allergy ? 'col-span-2' : ''}`}
                >
                  {value ? <IngredientIcon id={value} size={22} /> : <span className="size-[22px] rounded-md border border-dashed border-plan-dot" aria-hidden="true" />}
                  <span className="flex min-w-0 flex-col leading-tight">
                    <span className="text-[11px] font-semibold text-muted">{slot.label}</span>
                    <span className={`truncate text-[13px] font-semibold ${allergy && value ? 'text-allergy' : value ? '' : 'text-muted'}`}>
                      {value ? ingredientName(value) : '선택 안 함'}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          {open?.mealId === meal.id && (
            <SlotPicker
              slot={open.slot}
              value={meal[open.slot]}
              onPick={(id) => {
                patch(meal.id, { [open.slot]: id })
                setOpen(null)
              }}
            />
          )}

          <button
            type="button"
            aria-pressed={meal.status === 'done'}
            onClick={() => patch(meal.id, { status: meal.status === 'done' ? 'planned' : 'done' })}
            className={`h-11 rounded-[22px] border-[1.5px] text-sm font-bold ${
              meal.status === 'done' ? 'border-done-line bg-done text-white' : 'border-line bg-card'
            }`}
          >
            {meal.status === 'done' ? '✓ 먹었어요 (완료)' : '아직 안 먹었어요 (예정)'}
          </button>
          {meal.status === 'done' && (
            <label className="flex items-center justify-between gap-3 text-[13px] font-semibold text-sub">
              먹은 양
              <span className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={500}
                  step={5}
                  placeholder={String(targetMl)}
                  className={`${inputCls} w-24 text-right`}
                  value={meal.eatenMl ?? ''}
                  onChange={(e) => patch(meal.id, { eatenMl: e.target.value === '' ? undefined : Math.max(0, Number(e.target.value)) })}
                />
                ml
              </span>
            </label>
          )}
        </section>
      ))}

      <button type="button" onClick={addMeal} className="h-11 rounded-[22px] border-[1.5px] border-dashed border-line bg-transparent text-sm font-semibold text-sub">
        + 식사 추가
      </button>
      </div>
      {desktop && <div className="sticky top-0">{panel}</div>}
      </div>
    </Sheet>
  )
}

function SlotPicker({ slot, value, onPick }: { slot: SlotKey; value?: IngredientId; onPick: (id: IngredientId | undefined) => void }) {
  const def = SLOTS.find((s) => s.key === slot)!
  return (
    <div role="listbox" aria-label={`${def.label} 고르기`} className="grid grid-cols-4 gap-1.5 rounded-2xl bg-bg p-2">
      {slotOptions(def.categories).map((id) => (
        <button
          key={id}
          type="button"
          role="option"
          aria-selected={value === id}
          onClick={() => onPick(id)}
          className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border-[1.5px] px-1 py-1.5 text-[11px] ${
            value === id ? 'border-ink bg-soft font-bold' : 'border-transparent bg-card'
          }`}
        >
          <IngredientIcon id={id} size={24} />
          {ingredientName(id)}
        </button>
      ))}
      <button
        type="button"
        role="option"
        aria-selected={!value}
        onClick={() => onPick(undefined)}
        className={`flex min-h-14 items-center justify-center rounded-xl border-[1.5px] text-[12px] text-muted ${!value ? 'border-ink bg-soft' : 'border-transparent bg-card'}`}
      >
        없음
      </button>
    </div>
  )
}
