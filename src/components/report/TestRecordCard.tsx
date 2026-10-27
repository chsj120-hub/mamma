import { useState } from 'react'
import { ingredientName, type IngredientId } from '../../lib/ingredients'
import { TEST_DAYS_TOTAL, type ingredientTests, type TestStatus } from '../../lib/report'
import { IngredientIcon } from '../IngredientIcon'

type Props = {
  rows: ReturnType<typeof ingredientTests>
  onToggleReaction: (id: IngredientId) => void
}

const COLLAPSED = 6

/** 테스트 상태 배지 문구·색 (모바일 카드·PC 표 공용) */
export function testBadge(status: TestStatus, days: number) {
  switch (status) {
    case 'reaction':
      return { text: '반응 있음', cls: 'bg-urgent text-white' }
    case 'passed':
      return { text: '3일 이상 없음', cls: 'bg-done-bg text-done' }
    case 'running':
      return { text: `진행 중 ${days}/${TEST_DAYS_TOTAL}일`, cls: 'bg-allergy-bg text-allergy' }
    case 'short':
      return { text: `${days}일만 먹음`, cls: 'bg-low-bg text-low' }
    case 'planned':
      return { text: '예정', cls: 'bg-track text-sub' }
    case 'untried':
      return { text: '시도 전', cls: 'bg-track text-sub' }
  }
}

/** 재료별 3일 테스트 기록. 반응이 있었던 재료는 직접 표시한다 */
export function TestRecordCard({ rows, onToggleReaction }: Props) {
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? rows : rows.slice(0, COLLAPSED)

  return (
    <section className="flex flex-col gap-2.5 rounded-[20px] border border-line bg-card p-4">
      <h2 className="m-0 text-base font-bold">알레르기 테스트 기록</h2>
      <p className="m-0 text-xs leading-relaxed text-sub">새 재료는 3일 연속 먹여 보며 반응을 살펴요. 두드러기·구토 같은 반응이 있었다면 해당 재료를 눌러 표시해 주세요.</p>
      <ul className="m-0 flex list-none flex-col p-0">
        {shown.map((r) => {
          const b = testBadge(r.status, r.days)
          const reacted = r.status === 'reaction'
          return (
            <li key={r.id} className="flex min-h-11 items-center gap-2.5 border-b border-track py-1.5 last:border-b-0">
              <IngredientIcon id={r.id} size={22} />
              <span className="flex-1 text-sm font-semibold">
                {ingredientName(r.id)}
                {r.allergen && <span className="ml-1.5 text-[11px] font-medium text-allergy">알레르기 주의</span>}
              </span>
              <span className={`shrink-0 rounded-lg px-2 py-[3px] text-xs font-bold ${b.cls}`}>{b.text}</span>
              {r.status !== 'untried' && r.status !== 'planned' && (
                <button
                  type="button"
                  aria-pressed={reacted}
                  aria-label={`${ingredientName(r.id)} ${reacted ? '반응 표시 지우기' : '반응 있었음으로 표시'}`}
                  onClick={() => onToggleReaction(r.id)}
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full border-[1.5px] ${reacted ? 'border-urgent bg-urgent-bg text-urgent' : 'border-line bg-card text-muted'}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                  </svg>
                </button>
              )}
            </li>
          )
        })}
      </ul>
      {rows.length > COLLAPSED && (
        <button type="button" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} className="h-11 rounded-[14px] border border-line bg-bg text-[13px] font-semibold text-ink">
          {expanded ? '접기' : `모두 보기 (${rows.length})`}
        </button>
      )}
    </section>
  )
}
