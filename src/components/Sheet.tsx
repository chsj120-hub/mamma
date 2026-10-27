import { useEffect, useRef, type ReactNode } from 'react'

type Props = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  /** 아래에 고정되는 버튼 영역 */
  footer?: ReactNode
}

/** 화면 아래에서 올라오는 시트 (PC 폭에서는 가운데 모달). 네이티브 <dialog> 사용 */
export function Sheet({ open, title, onClose, children, footer }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dlg = ref.current
    if (!dlg) return
    if (open && !dlg.open) dlg.showModal()
    else if (!open && dlg.open) dlg.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={title}
      className="m-auto mb-0 w-full max-w-[480px] rounded-t-3xl border-none bg-bg p-0 text-text backdrop:bg-black/40 sm:mb-auto sm:rounded-3xl"
    >
      <div className="flex max-h-[88dvh] flex-col">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="m-0 font-display text-2xl font-normal">{title}</h2>
          <button type="button" onClick={onClose} aria-label="닫기" className="flex size-11 items-center justify-center rounded-full border border-line bg-card">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex flex-col gap-5 overflow-y-auto px-5 pb-5">{children}</div>
        {footer && <div className="border-t border-line bg-bg px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </dialog>
  )
}
