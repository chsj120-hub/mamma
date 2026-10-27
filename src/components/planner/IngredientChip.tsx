import { ingredientName, type IngredientId } from '../../lib/ingredients'
import { IngredientIcon } from '../IngredientIcon'

/** 아이콘 + 이름 작은 칩. allergy면 보라색 */
export function IngredientChip({ id, allergy, suffix }: { id: IngredientId; allergy?: boolean; suffix?: string }) {
  return (
    <span
      className={`flex items-center gap-1 rounded-[10px] py-[3px] pr-[9px] pl-1 text-[13px] ${
        allergy ? 'bg-allergy-bg font-semibold text-allergy' : 'border border-line bg-card'
      }`}
    >
      <IngredientIcon id={id} size={20} />
      {ingredientName(id)}
      {suffix}
    </span>
  )
}
