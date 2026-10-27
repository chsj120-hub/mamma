import { Link } from 'react-router-dom'
import { daysLeft, dLabel, EXPIRY_WARN_DAYS, isLowStock } from '../../lib/cube'
import { ingredientName } from '../../lib/ingredients'
import type { Cube } from '../../lib/types'
import { IngredientIcon } from '../IngredientIcon'

/** PC 오른쪽 '홈큐브 확인 필요': 기한 임박(우선) + 재고 부족 큐브 */
export function CubeAttentionPanel({ cubes, today }: { cubes: Cube[]; today: string }) {
  const rows = cubes
    .map((c) => ({ c, left: daysLeft(c, today) }))
    .filter(({ c, left }) => (c.count > 0 && left <= EXPIRY_WARN_DAYS) || isLowStock(c))
    .sort((a, b) => {
      const ua = a.c.count > 0 && a.left <= EXPIRY_WARN_DAYS ? 0 : 1
      const ub = b.c.count > 0 && b.left <= EXPIRY_WARN_DAYS ? 0 : 1
      return ua - ub || a.left - b.left
    })

  return (
    <section className="flex flex-col gap-2.5 rounded-[22px] border border-line bg-card p-[18px]">
      <div className="flex items-baseline justify-between">
        <h2 className="m-0 text-[17px] font-bold">홈큐브 확인 필요</h2>
        <Link to="/cube" className="text-[13px] font-semibold text-ink">
          보관함
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="m-0 text-sm text-sub">급하게 챙길 큐브가 없어요.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col p-0">
          {rows.map(({ c, left }) => {
            const urgent = c.count > 0 && left <= EXPIRY_WARN_DAYS
            return (
              <li key={c.id} className="flex items-center gap-2.5 border-b border-track py-1.5 last:border-b-0">
                <IngredientIcon id={c.ingredient} size={18} chip />
                <span className="flex-1 text-sm font-semibold">
                  {ingredientName(c.ingredient)} <span className="font-normal text-sub">{c.count}개</span>
                </span>
                <span className={`rounded-lg px-2 py-[3px] text-xs font-bold ${urgent ? 'bg-urgent text-white' : 'bg-low-bg text-low'}`}>
                  {urgent ? dLabel(left) : '재고 부족'}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
