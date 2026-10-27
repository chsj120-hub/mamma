import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useStoredState } from './storage'

export type ThemeId = 'amber' | 'blue' | 'green'

export const THEMES: Record<ThemeId, { name: string; label: string; accent: string; soft: string; ink: string; mood: string }> = {
  amber: { name: 'Warm Amber', label: '웜앰버', accent: '#F59E0B', soft: '#FEF3C7', ink: '#92400E', mood: '따뜻하고 친근한 가정식 이유식 분위기' },
  blue: { name: 'Soft Blue', label: '소프트블루', accent: '#3B82F6', soft: '#DBEAFE', ink: '#1E40AF', mood: '산뜻하고 신뢰감 있는 헬스케어 스타일' },
  green: { name: 'Nature Green', label: '네이처 그린', accent: '#10B981', soft: '#D1FAE5', ink: '#065F46', mood: '유기농 식재료의 싱그러운 친환경 스타일' },
}

type ThemeCtx = { theme: ThemeId; setTheme: (t: ThemeId) => void }
const Ctx = createContext<ThemeCtx | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useStoredState<ThemeId>('theme', 'amber')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  return <Ctx.Provider value={{ theme, setTheme }}>{children}</Ctx.Provider>
}

export function useTheme() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useTheme은 ThemeProvider 안에서만 사용할 수 있어요')
  return ctx
}
