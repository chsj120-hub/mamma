import { cubeStatus, daysLeft, dLabel, expiresAt, isStore, type CubeStatus } from '../../lib/cube'
import { md } from '../../lib/date'
import { ingredientName } from '../../lib/ingredients'
import type { Cube } from '../../lib/types'
import { CATEGORY_LABEL } from '../cube/categories'
import { IngredientIcon } from '../IngredientIcon'

const MAX_COUNT = 99
const COLS = 'grid grid-cols-[2fr_0.8fr_1.6fr_1fr_1.2fr_1fr] items-center gap-3 px-3'

const STATUS: Record<CubeStatus, { text: string; cls: string }> = {
  urgent: { text: '기한 임박', cls: 'border-urgent-line bg-urgent-bg text-urgent-ink' },
  low: { text: '재고 부족', cls: 'border-low-line bg-low-bg text-low' },
  ok: { text: '정상', cls: 'border-done-pale-line bg-done-bg text-done' },
}

const mmdd = (key: string) => {
  const { month, day } = md(key)
  return `${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`
}

type Props = {
  cubes: Cube[]
  today: string
  onCount: (id: string, count: number) => void
  onEdit: (id: string) => void
}

/** PC 재고 표: 재료, 분류, 수량(−/+), 제조·구매일, 소진 기한(D-n, 시판은 포장 소비기한), 상태 */
export function CubeTable({ cubes, today, onCount, onEdit }: Props) {
  return (
    <div className="overflow-x-auto">
      <div role="table" aria-label="홈큐브 재고" className="flex min-w-[680px] flex-col">
        <div role="row" className={`${COLS} border-b border-line py-2.5 text-xs font-semibold text-sub`}>
          {['재료', '분류', '수량', '제조·구매일', '소진 기한', '상태'].map((h) => (
            <span key={h} role="columnheader">
              {h}
            </span>
          ))}
        </div>
        {cubes.map((c) => {
          const status = cubeStatus(c, today)
          const left = daysLeft(c, today)
          const name = ingredientName(c.ingredient)
          const stepBtn = 'flex size-9 items-center justify-center rounded-[10px] border border-line bg-card text-lg disabled:opacity-30'
          return (
            <div key={c.id} role="row" className={`${COLS} border-b border-track py-2 ${status === 'urgent' ? 'bg-urgent-bg/60' : ''}`}>
              <span role="cell">
                <button type="button" onClick={() => onEdit(c.id)} className="flex items-center gap-2.5 border-none bg-transparent p-0 text-[15px] font-bold hover:underline" aria-label={`${name} 큐브 수정`}>
                  <IngredientIcon id={c.ingredient} size={30} />
                  {name}
                  {isStore(c) && <span className="rounded-md bg-track px-1.5 py-0.5 text-[11px] font-semibold text-sub">시판</span>}
                </button>
              </span>
              <span role="cell" className="text-[13px] text-sub">
                {CATEGORY_LABEL[c.ingredient]}
              </span>
              <span role="cell" className="flex items-center gap-2">
                <button type="button" aria-label={`${name} 하나 빼기`} disabled={c.count <= 0} onClick={() => onCount(c.id, c.count - 1)} className={stepBtn}>
                  −
                </button>
                <span className={`min-w-7 text-center font-display text-xl ${status === 'low' || c.count < 2 ? 'text-low' : ''}`} aria-live="polite">
                  {c.count}
                </span>
                <button type="button" aria-label={`${name} 하나 추가`} disabled={c.count >= MAX_COUNT} onClick={() => onCount(c.id, c.count + 1)} className={stepBtn}>
                  +
                </button>
              </span>
              <span role="cell" className="text-[13px] text-sub">
                {mmdd(c.madeAt)}
                {isStore(c) && <span className="ml-1 text-xs">구매</span>}
              </span>
              <span role="cell" className="flex items-center gap-1.5 text-[13px]">
                {mmdd(expiresAt(c))}
                <span className={`rounded-[7px] px-[7px] py-0.5 text-xs font-bold ${status === 'urgent' ? 'bg-urgent text-white' : 'bg-track text-sub'}`}>{dLabel(left)}</span>
              </span>
              <span role="cell">
                <span className={`inline-block rounded-[10px] border px-2.5 py-1 text-xs font-bold ${STATUS[status].cls}`}>{STATUS[status].text}</span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
