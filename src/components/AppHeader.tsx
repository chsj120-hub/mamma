import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import iconUrl from '../assets/brand/icon.webp'
import wordmarkUrl from '../assets/brand/wordmark.webp'
import { useIsDesktop } from '../lib/device'

/** 맘마 로고 (앱 아이콘 + 글자 로고). PC 사이드 메뉴와 모바일 헤더가 함께 쓴다. 다른 제목을 주면 글자만 바꿔 쓴다 */
export function Logo({ title = '맘마' }: { title?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <img src={iconUrl} alt="" width={40} height={40} draggable={false} className="size-10 rounded-[14px]" />
      {title === '맘마' ? (
        <img src={wordmarkUrl} alt="맘마" width={64} height={40} draggable={false} className="h-8 w-auto" />
      ) : (
        <span className="font-display text-[26px] tracking-[-0.5px]">{title}</span>
      )}
    </div>
  )
}

/** 화면 상단 헤더: 로고(또는 제목) + 오른쪽 동작 영역. PC에서는 사이드 메뉴에 로고가 있으니 제목만 */
export function AppHeader({ title, right }: { title?: string; right?: ReactNode }) {
  const desktop = useIsDesktop()
  return (
    <header className="flex items-center justify-between px-5 pt-5 pb-3">
      {desktop ? <h1 className="m-0 font-display text-[26px] font-normal">{title ?? '오늘의 식단'}</h1> : <Logo title={title} />}
      {right}
    </header>
  )
}

/** 알림 버튼. 확인할 알림이 있으면 빨간 점 표시 */
export function NotificationButton({ to, unread }: { to: string; unread: number }) {
  return (
    <Link
      to={to}
      aria-label={unread ? `알림 ${unread}개` : '알림'}
      className="relative flex size-11 items-center justify-center rounded-full border border-line bg-card"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B2118" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {unread > 0 && <span className="absolute top-[9px] right-[10px] size-[9px] rounded-full border-2 border-card bg-dot" />}
    </Link>
  )
}
