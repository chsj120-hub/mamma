const icon = (children: React.ReactNode) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
)

type Props = {
  onFill: () => void
  onReplace: () => void
  onUndo: () => void
  undoCount: number
  message: string | null
}

/** 하단 탭 위에 떠 있는 식단 도구 모음 + 결과 안내 */
export function PlannerToolbar({ onFill, onReplace, onUndo, undoCount, message }: Props) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[88px] z-10 mx-auto flex max-w-[480px] flex-col gap-2 px-3">
      <div role="status" aria-live="polite" className="flex justify-center">
        {message && <span className="rounded-full bg-text/90 px-4 py-2 text-[13px] font-semibold text-white shadow-lg">{message}</span>}
      </div>
      <div className="pointer-events-auto grid grid-cols-3 gap-1.5 rounded-[22px] bg-text p-2 shadow-[0_8px_24px_rgba(43,33,24,0.25)]">
        <button type="button" onClick={onFill} className="flex h-12 items-center justify-center gap-1.5 rounded-2xl border-none bg-accent text-[13px] font-bold text-text">
          {icon(<path d="M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2z" />)}
          AI 채우기
        </button>
        <button type="button" onClick={onReplace} className="flex h-12 items-center justify-center gap-1.5 rounded-2xl border-none bg-transparent text-[13px] font-semibold text-white">
          {icon(
            <>
              <path d="M17 1l4 4-4 4" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <path d="M7 23l-4-4 4-4" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </>,
          )}
          재료 대체
        </button>
        <button type="button" onClick={onUndo} className="relative flex h-12 items-center justify-center gap-1.5 rounded-2xl border-none bg-transparent text-[13px] font-semibold text-white">
          {icon(
            <>
              <path d="M9 14 4 9l5-5" />
              <path d="M4 9h11a5 5 0 0 1 0 10h-3" />
            </>,
          )}
          실행취소
          {undoCount > 0 && <span className="sr-only">(기록 {undoCount}개)</span>}
        </button>
      </div>
    </div>
  )
}
