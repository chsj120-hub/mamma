import { useEffect, useRef, useState } from 'react'
import { expiringCubes } from '../lib/cube'
import { useAppData } from '../lib/data'
import { todayKey } from '../lib/date'
import { ingredientName } from '../lib/ingredients'
import { allergenTestProgress } from '../lib/meal'
import { dueReminders, reminderText, showSystemNotification, type DueReminder } from '../lib/notify'
import { load, save } from '../lib/storage'

/** 설정에서 켠 알림 (이 기기에서만 켜고 끈다. 서버로 올리지 않는다) */
export const NOTIFY_KEY = 'notifyOn'
const CHECK_EVERY_MS = 20_000

/**
 * 식사 10분 전 알림. 앱이 열려 있는 동안 20초마다 오늘 식단을 보고,
 * 시스템 알림(허용된 경우)과 화면 위쪽 알림 띠를 보여 준다. 같은 끼니는 하루에 한 번만 알린다.
 */
export function MealReminders() {
  const { plans, toggleMealDone } = useAppData()
  const [banner, setBanner] = useState<(DueReminder & { date: string }) | null>(null)
  const plansRef = useRef(plans)
  plansRef.current = plans

  useEffect(() => {
    const check = () => {
      if (!load<boolean>(NOTIFY_KEY, false)) return
      const now = new Date()
      const date = todayKey(now)
      const due = dueReminders(date, plansRef.current[date]?.meals ?? [], now)
      const seen = load<Record<string, string[]>>('notifiedMeals', {})
      const todaySeen = seen[date] ?? []
      const fresh = due.filter((d) => !todaySeen.includes(d.meal.id))
      if (fresh.length === 0) return
      // 오늘 알린 끼니만 남겨 저장소가 커지지 않게 한다
      save('notifiedMeals', { [date]: [...todaySeen, ...fresh.map((f) => f.meal.id)] })
      for (const f of fresh) {
        const t = reminderText(f)
        void showSystemNotification(t.title, t.body, `meal-${f.meal.id}`)
      }
      setBanner({ ...fresh[0], date })
    }
    check()
    const id = setInterval(check, CHECK_EVERY_MS)
    document.addEventListener('visibilitychange', check)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', check)
    }
  }, [])

  // 그 사이 먹었다고 표시했으면 띠를 숨긴다
  const live = banner ? plans[banner.date]?.meals.find((m) => m.id === banner.meal.id) : undefined
  if (!banner || !live || live.status === 'done') return null
  const text = reminderText({ meal: live, minutes: banner.minutes })

  return (
    <div role="status" aria-live="polite" className="fixed inset-x-0 top-3 z-50 mx-auto flex w-[min(92vw,440px)] items-center gap-3 rounded-2xl bg-text px-4 py-3 text-white shadow-[0_8px_24px_rgba(43,33,24,0.35)] print:hidden">
      <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-text">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      </span>
      <span className="flex min-w-0 flex-1 flex-col leading-snug">
        <b className="text-sm">{text.title}</b>
        <span className="truncate text-xs text-white/80">{text.body}</span>
      </span>
      <button
        type="button"
        onClick={() => {
          toggleMealDone(banner.date, live.id)
          setBanner(null)
        }}
        className="h-11 shrink-0 rounded-[22px] border-none bg-white/15 px-3 text-xs font-bold text-white"
      >
        먹었어요
      </button>
      <button type="button" onClick={() => setBanner(null)} aria-label="알림 닫기" className="flex size-11 shrink-0 items-center justify-center rounded-full border-none bg-transparent text-white/80">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

const BRIEF_HOUR = 8

/**
 * 아침 안내 (알림을 켠 기기에서, 앱이 열려 있을 때 오전 8시 이후 하루 한 번):
 * 오늘이 알레르기 테스트 첫날이거나 소비기한이 가까운 큐브가 있으면 알려 준다.
 */
export function MorningBrief() {
  const { plans, cubes } = useAppData()
  const [lines, setLines] = useState<string[]>([])
  const dataRef = useRef({ plans, cubes })
  dataRef.current = { plans, cubes }

  useEffect(() => {
    const check = () => {
      if (!load<boolean>(NOTIFY_KEY, false)) return
      const now = new Date()
      const today = todayKey(now)
      if (now.getHours() < BRIEF_HOUR || load<string>('briefedOn', '') === today) return
      const { plans: p, cubes: c } = dataRef.current
      const out: string[] = []
      const test = allergenTestProgress(p, today)
      if (test?.day === 1) out.push(`오늘은 ${ingredientName(test.allergen)} 알레르기 테스트 첫날이에요. 오전에 먹이고 낮 동안 반응을 살펴보세요. 이상 반응이 있으면 바로 병원에 가세요.`)
      const soon = expiringCubes(c, today)
      if (soon.length > 0) out.push(`소비기한이 가까운 큐브가 ${soon.length}종 있어요. 이번 주 식단에 먼저 써 보세요.`)
      save('briefedOn', today)
      if (out.length === 0) return
      setLines(out)
      void showSystemNotification('오늘 확인할 것', out[0], `brief-${today}`)
    }
    check()
    const id = setInterval(check, 60_000)
    document.addEventListener('visibilitychange', check)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', check)
    }
  }, [])

  if (lines.length === 0) return null
  return (
    <div role="status" aria-live="polite" className="fixed inset-x-0 top-3 z-40 mx-auto flex w-[min(92vw,440px)] items-start gap-3 rounded-2xl bg-soft px-4 py-3 text-text shadow-[0_8px_24px_rgba(43,33,24,0.2)] print:hidden">
      <span className="flex min-w-0 flex-1 flex-col gap-1 text-[13px] leading-snug">
        <b className="text-sm">오늘 확인할 것</b>
        {lines.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </span>
      <button type="button" onClick={() => setLines([])} className="min-h-11 shrink-0 rounded-[22px] border border-line bg-card px-3 text-xs font-bold">
        확인했어요
      </button>
    </div>
  )
}
