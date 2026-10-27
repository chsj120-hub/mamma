import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'

const svg = (children: ReactNode) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
)

const TABS = [
  { to: '/', label: '홈', icon: svg(<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />) },
  {
    to: '/planner',
    label: '식단',
    icon: svg(
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </>,
    ),
  },
  {
    to: '/cube',
    label: '홈큐브',
    icon: svg(
      <>
        <path d="M21 8 12 3 3 8v8l9 5 9-5z" />
        <path d="M3 8l9 5 9-5M12 13v8" />
      </>,
    ),
  },
  { to: '/report', label: '성장 리포트', icon: svg(<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />) },
]

export function BottomTabBar() {
  return (
    <nav
      aria-label="하단 메뉴"
      className="fixed inset-x-0 bottom-0 z-20 mx-auto grid max-w-[480px] grid-cols-4 border-t border-line bg-card px-3 pt-2 pb-[max(20px,env(safe-area-inset-bottom))]"
    >
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.to === '/'}
          className={({ isActive }) =>
            `flex min-h-11 flex-col items-center justify-center gap-1 text-[11px] no-underline ${
              isActive ? 'font-bold text-ink' : 'font-medium text-muted'
            }`
          }
        >
          {t.icon}
          {t.label}
        </NavLink>
      ))}
    </nav>
  )
}
