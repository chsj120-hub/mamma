import { Link } from 'react-router-dom'
import { daysLeft, dLabel } from '../../lib/cube'
import { ingredientName } from '../../lib/ingredients'
import type { Cube } from '../../lib/types'

/** 3일 안에 써야 하거나 만료된 큐브 경고 배너. 대상이 없으면 렌더하지 않는다 */
export function ExpiryAlert({ cubes, hint, linkLabel = '보관함' }: { cubes: Cube[]; hint?: string; linkLabel?: string }) {
  if (cubes.length === 0) return null
  return (
    <section role="alert" className="flex items-start gap-3 rounded-[18px] border border-urgent-line bg-urgent-bg px-4 py-3.5">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-px shrink-0 text-urgent">
        <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
      <div className="flex flex-1 flex-col gap-1">
        <span className="text-sm font-bold text-urgent-ink">3일 안에 써야 할 큐브 {cubes.length}개</span>
        <span className="text-[13px] text-urgent-sub">
          {cubes.map((c) => `${ingredientName(c.ingredient)} 큐브 ${dLabel(daysLeft(c))}`).join(' · ')}
          {hint && ` — ${hint}`}
        </span>
      </div>
      <Link to="/cube" className="flex min-h-11 items-start py-0.5 text-[13px] font-semibold text-urgent-ink underline">
        {linkLabel}
      </Link>
    </section>
  )
}
