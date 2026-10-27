/** 새 음식 거부 안내 (마일스톤·리포트 공용) */
export function RetryTip({ className = '' }: { className?: string }) {
  return (
    <aside aria-label="새 음식을 거부할 때" className={`flex gap-3 rounded-[18px] bg-soft px-4 py-3.5 ${className}`}>
      <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-card text-ink">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </span>
      <span className="flex flex-col gap-1 text-[13px] leading-relaxed">
        <b className="text-ink">한 번 거부해도 8~10번 다시 시도해 보세요</b>
        <span className="text-sub">새 음식은 여러 번 맛봐야 익숙해지는 경우가 많아요. 억지로 먹이지 말고, 며칠 간격을 두고 조금씩 다시 내 주세요.</span>
      </span>
    </aside>
  )
}
