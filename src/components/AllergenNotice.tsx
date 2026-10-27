import { allergenSuggestion } from '../lib/allergenNotice'
import { useAppData } from '../lib/data'
import { addDays, todayKey } from '../lib/date'
import { ingredientName } from '../lib/ingredients'
import { useStoredState } from '../lib/storage'
import { IngredientIcon } from './IngredientIcon'

const SNOOZE_DAYS = 7

/** '알레르기 재료를 시작할 시기예요' 카드 (모바일 홈·PC 대시보드). 자동으로 식단에 넣지 않고 부모가 고르게 한다 */
export function AllergenNotice({ how }: { how: string }) {
  const { plans, profile, reactions } = useAppData()
  const today = todayKey()
  const [snoozedUntil, setSnoozedUntil] = useStoredState<string>('allergenNoticeSnooze', '')

  if (snoozedUntil && today < snoozedUntil) return null
  const next = allergenSuggestion(plans, profile, today, reactions)
  if (!next) return null

  return (
    <section aria-labelledby="allergen-notice-title" className="flex flex-col gap-2.5 rounded-[18px] border border-allergy-ring bg-allergy-soft px-4 py-3.5">
      <h2 id="allergen-notice-title" className="m-0 text-[15px] font-bold text-allergy">
        알레르기 재료를 시작할 시기예요
      </h2>
      <p className="m-0 text-[13px] leading-relaxed text-text">
        알레르기 재료는 일부러 늦추지 않는 것이 요즘 권고예요. 한 번에 한 가지씩, 오전에 먹이고 3일 동안 반응을 살펴보세요. 자동 채우기는 알레르기 재료를 넣지 않으니 직접 골라 주세요.
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-semibold text-sub">다음 순서</span>
        {next.map((id) => (
          <span key={id} className="flex items-center gap-1 rounded-[10px] bg-card py-1 pr-2.5 pl-1 text-[13px] font-semibold text-allergy">
            <IngredientIcon id={id} size={20} />
            {ingredientName(id)}
          </span>
        ))}
      </div>
      <p className="m-0 text-xs leading-relaxed text-sub">{how}</p>
      <p className="m-0 text-xs leading-relaxed text-sub">아토피가 심하거나 이미 음식 알레르기가 있었다면, 시작 전에 소아청소년과와 먼저 상의해 주세요.</p>
      <button
        type="button"
        onClick={() => setSnoozedUntil(addDays(today, SNOOZE_DAYS))}
        className="h-9 self-start rounded-[18px] border border-line bg-card px-3 text-[13px] font-semibold text-sub"
      >
        일주일 뒤에 다시 알려 주세요
      </button>
    </section>
  )
}
