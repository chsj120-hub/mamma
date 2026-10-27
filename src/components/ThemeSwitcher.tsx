import { THEMES, useTheme, type ThemeId } from '../lib/theme'

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  return (
    <div role="radiogroup" aria-label="테마 선택" className="grid grid-cols-3 gap-2">
      {(Object.keys(THEMES) as ThemeId[]).map((id) => {
        const t = THEMES[id]
        const selected = id === theme
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setTheme(id)}
            className={`flex min-h-11 flex-col items-center gap-2 rounded-2xl border-[1.5px] bg-card p-3 text-[13px] font-bold transition ${
              selected ? 'border-text' : 'border-line'
            }`}
          >
            <span className="flex gap-1" aria-hidden="true">
              <span className="size-5 rounded-md" style={{ background: t.accent }} />
              <span className="size-5 rounded-md border border-line" style={{ background: t.soft }} />
              <span className="size-5 rounded-md" style={{ background: t.ink }} />
            </span>
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
