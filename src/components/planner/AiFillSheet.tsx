import { useMemo, useState } from 'react'
import { INGREDIENT_INTRO } from '../../data/ingredientIntro'
import { allergenByDate, planAllergenWeeks, weeksCovering } from '../../lib/allergenPlan'
import { useAppData } from '../../lib/data'
import { DOW_KO, dowOf, md } from '../../lib/date'
import { ingredientName, type IngredientId } from '../../lib/ingredients'
import { usePlanActions } from '../../lib/usePlanActions'
import { inputCls } from '../home/ProfileModal'
import { IngredientIcon } from '../IngredientIcon'
import { Sheet } from '../Sheet'

type Props = {
  /** 지금 화면에 보이는 날짜들 (주간: 7일, 월간: 한 달) */
  dates: string[]
  today: string
  onClose: () => void
  onDone: (message: string) => void
}

const fmt = (d: string) => `${md(d).month}/${md(d).day}(${DOW_KO[dowOf(d)]})`

/**
 * AI 추천으로 채우기 — 2단계로 나눠서 알레르기 재료는 따로 고르게 한다.
 * ① 빈 날은 월령에 맞는 메뉴로 채운다  ② 알레르기 테스트는 주마다 추천 재료를 보여 주고, 부모가 고르거나 넣지 않는다
 */
export function AiFillSheet({ dates, today, onClose, onDone }: Props) {
  const { plans, profile, reactions } = useAppData()
  const actions = usePlanActions()

  const emptyDays = dates.filter((d) => d >= today && !plans[d]?.meals.length).length
  const { rows, candidates } = useMemo(() => planAllergenWeeks(plans, profile, reactions, today, weeksCovering(dates)), [plans, profile, reactions, today, dates])
  const shown = rows.filter((r) => r.blocked !== 'past')

  // 추천 재료를 미리 골라 두되, 확인 버튼을 눌러야 적용된다
  const [picks, setPicks] = useState<Record<string, IngredientId | ''>>(() => Object.fromEntries(rows.map((r) => [r.weekStart, r.suggestion ?? ''])))
  const chosen = allergenByDate(rows, picks)
  const pickCount = new Set(Object.values(picks).filter(Boolean)).size

  const run = () => {
    onDone(actions.fill(dates, today, chosen))
    onClose()
  }

  const nothing = emptyDays === 0 && pickCount === 0
  const label = emptyDays > 0 && pickCount > 0 ? '채우고 알레르기 테스트 넣기' : emptyDays > 0 ? `${emptyDays}일 채우기` : pickCount > 0 ? '알레르기 테스트만 넣기' : '채울 것이 없어요'

  return (
    <Sheet
      open
      title="AI 추천으로 채우기"
      onClose={onClose}
      footer={
        <button type="button" disabled={nothing} onClick={run} className="h-12 w-full rounded-3xl border-none bg-ink text-[15px] font-bold text-white disabled:opacity-40">
          {label}
        </button>
      }
    >
      <section className="flex flex-col gap-1.5 rounded-2xl border border-line bg-card p-4">
        <h3 className="m-0 text-sm font-bold">① 식단 채우기</h3>
        <p className="m-0 text-[13px] leading-relaxed text-sub">
          {emptyDays > 0 ? `오늘 이후 비어 있는 ${emptyDays}일을 월령에 맞는 메뉴로 채워요. 이미 있는 식단은 건드리지 않아요.` : '오늘 이후 비어 있는 날이 없어요.'}
        </p>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-allergy-ring bg-allergy-soft p-4" aria-labelledby="allergen-step-title">
        <div className="flex flex-col gap-1.5">
          <h3 id="allergen-step-title" className="m-0 text-sm font-bold text-allergy">
            ② 알레르기 테스트 (직접 골라요)
          </h3>
          <p className="m-0 text-[13px] leading-relaxed text-text">
            알레르기 재료는 <b>월·화·수 3일 연속, 첫 끼(오전)</b>에 한 가지씩 넣는 걸 추천해요. 이상 반응이 생겨도 평일 낮에 병원에 가기 쉬워요. 이미 확인한 재료는 빼고 단계에 맞는 것만 보여 드려요.
          </p>
          <p className="m-0 text-xs leading-relaxed text-sub">
            시작 전에 소아청소년과와 상의해 주세요. 두드러기·구토·숨쉬기 힘든 모습이 보이면 바로 병원(응급실)에 가세요.
          </p>
        </div>

        {candidates.length === 0 ? (
          <p className="m-0 rounded-xl bg-card p-3 text-center text-[13px] text-sub">지금 단계에서 새로 추천할 알레르기 재료가 없어요. (이미 확인했거나 아직 시작하기 이른 재료예요)</p>
        ) : shown.length === 0 ? (
          <p className="m-0 rounded-xl bg-card p-3 text-center text-[13px] text-sub">이번 기간에는 테스트를 시작할 수 있는 날이 없어요. 다음 주를 보면서 다시 눌러 주세요.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {shown.map((r, i) => {
              const value = picks[r.weekStart] ?? ''
              const takenElsewhere = new Set(Object.entries(picks).filter(([k, v]) => k !== r.weekStart && v).map(([, v]) => v))
              const options = candidates.filter((c) => !takenElsewhere.has(c))
              const note = value ? INGREDIENT_INTRO[value].note : undefined
              const range = `${fmt(r.dates[0])} ~ ${fmt(r.dates[2])}`
              const shifted = !r.blocked && dowOf(r.dates[0]) !== 1
              return (
                <li key={r.weekStart} className="flex flex-col gap-2 rounded-xl bg-card p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-bold">
                      {i + 1}번째 주 · {range}
                    </span>
                    {value && <IngredientIcon id={value} size={22} />}
                  </div>
                  {r.blocked === 'busy' ? (
                    <span className="text-xs text-sub">이 주에는 이미 알레르기 테스트가 있어요.</span>
                  ) : (
                    <>
                      <label className="flex flex-col gap-1 text-xs font-semibold text-sub">
                        {range} 알레르기 재료
                        <select className={inputCls} value={value} onChange={(e) => setPicks((p) => ({ ...p, [r.weekStart]: e.target.value as IngredientId | '' }))}>
                          <option value="">넣지 않기</option>
                          {options.map((c) => (
                            <option key={c} value={c}>
                              {ingredientName(c)}
                              {c === r.suggestion ? ' (추천)' : ''}
                            </option>
                          ))}
                        </select>
                      </label>
                      {note && <span className="text-xs leading-relaxed text-sub">{ingredientName(value as IngredientId)}: {note}</span>}
                      {shifted && <span className="text-xs text-sub">월요일이 지나서 가장 이른 날부터 3일로 잡았어요.</span>}
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </Sheet>
  )
}
