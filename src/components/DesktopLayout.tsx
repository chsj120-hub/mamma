import { useState, type ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAppData } from '../lib/data'
import { dotted } from '../lib/date'
import { STAGES } from '../lib/stage'
import { THEMES, useTheme, type ThemeId } from '../lib/theme'
import { Logo } from './AppHeader'
import { ProfileModal } from './home/ProfileModal'

const svg = (children: ReactNode) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
)

const MENU = [
  {
    to: '/',
    label: '식단 플래너',
    icon: svg(
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </>,
    ),
  },
  {
    to: '/cube',
    label: '홈큐브 보관함',
    icon: svg(
      <>
        <path d="M21 8 12 3 3 8v8l9 5 9-5z" />
        <path d="M3 8l9 5 9-5M12 13v8" />
      </>,
    ),
  },
  { to: '/report', label: '성장 리포트', icon: svg(<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />) },
  {
    to: '/milestone',
    label: '마일스톤',
    icon: svg(
      <>
        <path d="M9 11l3 3 8-8" />
        <path d="M20 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </>,
    ),
  },
]

/** PC 공통 레이아웃: 왼쪽 사이드 메뉴(240px) + 오른쪽 본문(최대 1200px, 여백 32px) */
export function DesktopLayout() {
  return (
    <div className="flex min-h-dvh bg-bg">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-x-auto">
        <div className="mx-auto w-full max-w-[1200px] p-8 print:max-w-none print:p-0">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function Sidebar() {
  const { profile, setProfile } = useAppData()
  const { theme, setTheme } = useTheme()
  const [editing, setEditing] = useState(false)

  return (
    <aside className="print:hidden sticky top-0 flex h-dvh w-60 shrink-0 flex-col gap-7 overflow-y-auto border-r border-line bg-card px-5 py-7">
      <Logo />

      <nav aria-label="주 메뉴" className="flex flex-col gap-1">
        {MENU.map((m) => (
          <NavLink
            key={m.to}
            to={m.to}
            end={m.to === '/'}
            className={({ isActive }) =>
              `flex h-11 items-center gap-2.5 rounded-xl px-3.5 text-sm no-underline ${isActive ? 'bg-soft font-bold text-ink' : 'font-medium text-sub hover:bg-bg'}`
            }
          >
            {m.icon}
            {m.label}
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col gap-2.5">
        <span className="text-xs font-semibold text-muted" id="theme-label">
          테마
        </span>
        <div role="radiogroup" aria-labelledby="theme-label" className="flex flex-col gap-1.5">
          {(Object.keys(THEMES) as ThemeId[]).map((id) => {
            const on = theme === id
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setTheme(id)}
                className={`flex h-11 items-center gap-2.5 rounded-xl border-[1.5px] bg-card px-3 text-left text-[13px] font-semibold ${on ? 'border-text' : 'border-line'}`}
              >
                <span className="size-[18px] rounded-full" style={{ background: THEMES[id].accent }} aria-hidden="true" />
                {THEMES[id].name}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-1.5 rounded-[18px] bg-soft p-4">
        <span className="text-[15px] font-bold">{profile.name}</span>
        <span className="text-xs text-sub">
          {dotted(profile.birthDate)} 출생 · {STAGES[profile.stage].short}
        </span>
        <span className="text-xs text-sub">
          1회 {profile.targetMl}ml · 하루 {profile.mealsPerDay}회
        </span>
        <button type="button" onClick={() => setEditing(true)} className="mt-1.5 h-10 rounded-xl border-none bg-card text-[13px] font-semibold text-ink">
          프로필 수정
        </button>
      </div>

      <ProfileModal
        open={editing}
        profile={profile}
        onClose={() => setEditing(false)}
        onSave={(p) => {
          setProfile(p)
          setEditing(false)
        }}
      />
    </aside>
  )
}
