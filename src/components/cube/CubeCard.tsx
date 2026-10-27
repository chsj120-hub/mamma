import { daysLeft, dLabel, expiresAt, EXPIRY_WARN_DAYS, isLowStock, isStore } from '../../lib/cube'
import { md } from '../../lib/date'
import { ingredientName } from '../../lib/ingredients'
import type { Cube } from '../../lib/types'
import { IngredientIcon } from '../IngredientIcon'
import { CATEGORY_LABEL } from './categories'

export function CubeCard({ cube, today, onOpen }: { cube: Cube; today: string; onOpen: () => void }) {
  const left = daysLeft(cube, today)
  const urgent = left <= EXPIRY_WARN_DAYS
  const low = isLowStock(cube)
  const store = isStore(cube)
  const mmdd = (key: string) => `${String(md(key).month).padStart(2, '0')}.${String(md(key).day).padStart(2, '0')}`
  const name = ingredientName(cube.ingredient)
  const border = urgent ? 'border-urgent-strong-line' : low ? 'border-low-line' : 'border-line'

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${name} 큐브 ${cube.count}개, ${left < 0 ? '기한 만료' : `유통기한 ${dLabel(left)}`}${low ? ', 재고 부족' : ''}. 눌러서 수정`}
      className={`flex flex-col gap-2.5 rounded-[18px] border-[1.5px] bg-card p-3.5 text-left ${border}`}
    >
      <div className="flex items-center justify-between">
        <IngredientIcon id={cube.ingredient} size={24} chip />
        <span className={`rounded-lg px-2 py-[3px] text-xs font-bold ${urgent ? 'bg-urgent text-white' : 'bg-track text-sub'}`}>{dLabel(left)}</span>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[15px] font-bold">{name}</span>
        <span className="text-xs text-muted">
          {CATEGORY_LABEL[cube.ingredient]} · {store ? `시판 · ${mmdd(expiresAt(cube))}까지` : `${mmdd(cube.madeAt)} 제조`}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-display text-[22px]">
          {cube.count}
          <span className="text-[13px]">개</span>
        </span>
        {low && (
          <span className="flex items-center gap-1 text-xs font-bold text-low motion-safe:animate-pulse">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
              <path d="M12 9v4" />
            </svg>
            {cube.count === 0 ? '없음' : '부족'}
          </span>
        )}
      </div>
    </button>
  )
}
