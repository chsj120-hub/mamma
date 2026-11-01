import { useEffect, useState } from 'react'
import { applyUpdate, onNeedRefresh } from '../lib/pwa'

/** 새 버전이 준비되면 화면 아래에 알리고, 누르면 새로고침한다 (자동으로 바꾸면 쓰던 화면이 깨질 수 있어서) */
export function UpdateBanner() {
  const [show, setShow] = useState(false)
  useEffect(() => onNeedRefresh(setShow), [])
  if (!show) return null
  return (
    <div role="status" aria-live="polite" className="fixed inset-x-0 bottom-20 z-50 mx-auto flex w-[min(92vw,420px)] items-center gap-3 rounded-2xl bg-text px-4 py-3 text-white shadow-[0_8px_24px_rgba(43,33,24,0.35)] print:hidden lg:bottom-6">
      <span className="flex-1 text-sm font-semibold">새 버전이 있어요</span>
      <button type="button" onClick={applyUpdate} className="min-h-11 rounded-[22px] border-none bg-accent px-4 text-[13px] font-bold text-text">
        새로고침
      </button>
      <button type="button" onClick={() => setShow(false)} className="min-h-11 border-none bg-transparent px-2 text-xs font-semibold text-white/80">
        나중에
      </button>
    </div>
  )
}
