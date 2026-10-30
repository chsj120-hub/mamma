import type { Taste } from '../lib/types'

export const TASTE_LABEL: Record<Taste, string> = { good: '잘 먹음', some: '조금 먹음', refuse: '거부' }
const ORDER: Taste[] = ['good', 'some', 'refuse']

/** 끼니 반응 한 줄 (잘 먹음 / 조금 먹음 / 거부). 같은 걸 다시 누르면 지운다. 색이 아니라 글자로 구분한다 */
export function TastePicker({ value, onChange, compact = false }: { value?: Taste; onChange: (t: Taste | undefined) => void; compact?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5" role="radiogroup" aria-label="먹은 반응">
        {!compact && <span className="mr-auto text-[13px] font-semibold text-sub">반응</span>}
        {ORDER.map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={value === t}
            onClick={() => onChange(value === t ? undefined : t)}
            className={`min-h-11 rounded-[18px] border-[1.5px] px-3 text-[13px] font-semibold ${value === t ? 'border-ink bg-ink text-white' : 'border-line bg-card text-text'}`}
          >
            {TASTE_LABEL[t]}
          </button>
        ))}
      </div>
      {value === 'refuse' && <p className="m-0 text-xs leading-relaxed text-sub">한 번 거부해도 8~10번 다시 시도해 보세요. 억지로 먹이지는 마세요.</p>}
    </div>
  )
}
