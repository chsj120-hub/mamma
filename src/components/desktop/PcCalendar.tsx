import { addDays, daysInMonth, DOW_KO, dowOf, md } from '../../lib/date'
import { ingredientName } from '../../lib/ingredients'
import { allergenStreak, daySummary } from '../../lib/meal'
import type { MealPlans } from '../../lib/types'
import { IngredientIcon } from '../IngredientIcon'
import { dowInk } from '../planner/dayStyle'

/** 138px 칸에 들어가는 재료 줄 수 (알레르기 줄이 있으면 한 줄 적게). 넘치면 한 줄을 '+n'으로 바꾼다 */
const ROWS = 4

type Props = {
  view: 'month' | 'week'
  /** 월간이면 그 달 1일, 주간이면 그 주 월요일 */
  start: string
  today: string
  plans: MealPlans
  onOpenDay: (date: string) => void
}

/**
 * PC 캘린더. 칸 맨 위 날짜·완료 점, 그 아래 재료 아이콘+이름 세로 목록(베이스 쌀 생략),
 * 알레르기 테스트는 칸 맨 아래 한 줄.
 */
export function PcCalendar({ view, start, today, plans, onOpenDay }: Props) {
  const dates = view === 'week' ? Array.from({ length: 7 }, (_, i) => addDays(start, i)) : Array.from({ length: daysInMonth(start) }, (_, i) => addDays(start, i))
  // 월간은 일요일 시작, 주간은 월요일 시작
  const order = view === 'week' ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6]
  const lead = view === 'month' ? dowOf(start) : 0

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[620px] flex-col gap-1.5">
        <div className="grid grid-cols-7 gap-1.5" aria-hidden="true">
          {order.map((d) => (
            <span key={d} className={`px-2 text-xs font-semibold ${dowInk(d)}`}>
              {DOW_KO[d]}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: lead }, (_, i) => (
            <span key={`b${i}`} className="h-[138px] rounded-xl border-[1.5px] border-transparent" aria-hidden="true" />
          ))}
          {dates.map((date) => (
            <DayCell key={date} date={date} today={today} plans={plans} tall={view === 'week'} onOpen={() => onOpenDay(date)} />
          ))}
        </div>
      </div>
    </div>
  )
}

function DayCell({ date, today, plans, tall, onOpen }: { date: string; today: string; plans: MealPlans; tall: boolean; onOpen: () => void }) {
  const s = daySummary(plans[date])
  const dow = dowOf(date)
  const isToday = date === today
  const rows = tall ? 9 : ROWS - (s.allergen ? 1 : 0)
  const shown = s.mains.length > rows ? s.mains.slice(0, rows - 1) : s.mains
  const more = s.mains.length - shown.length
  const tone = isToday ? 'border-accent bg-soft/60' : s.allergen ? 'border-allergy-ring bg-allergy-soft' : s.status === 'empty' ? 'border-line bg-bg' : 'border-line bg-card'
  const statusText = s.status === 'empty' ? '식단 없음' : s.status === 'done' ? '완료' : '예정'

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={[
        `${md(date).month}월 ${md(date).day}일`,
        isToday ? '오늘' : '',
        s.mains.map(ingredientName).join(', '),
        s.allergen ? `${ingredientName(s.allergen)} 테스트` : '',
        statusText,
        '눌러서 수정',
      ]
        .filter(Boolean)
        .join(', ')}
      className={`flex flex-col gap-[5px] overflow-hidden rounded-xl border-[1.5px] p-2 text-left hover:border-ink ${tall ? 'min-h-[240px]' : 'h-[138px]'} ${tone}`}
    >
      <span className="flex h-[18px] items-center justify-between">
        <span className={`text-[13px] font-bold ${dow === 0 ? 'text-urgent' : dow === 6 ? 'text-sat' : 'text-text'}`}>
          {md(date).day}
          {isToday && <span className="ml-1 text-[11px] font-semibold text-ink">오늘</span>}
        </span>
        {s.status !== 'empty' && <span className={`size-2 rounded-full ${s.status === 'done' ? 'bg-done' : 'bg-plan-dot'}`} aria-hidden="true" />}
      </span>
      {shown.map((id) => (
        <span key={id} className="flex min-w-0 items-center gap-[5px] text-xs leading-none whitespace-nowrap" aria-hidden="true">
          <IngredientIcon id={id} size={20} className="shrink-0" />
          <span className="truncate">{ingredientName(id)}</span>
        </span>
      ))}
      {more > 0 && <span className="pl-[25px] text-[11px] text-muted" aria-hidden="true">+{more}</span>}
      {s.allergen && (
        <span
          title={`${ingredientName(s.allergen)} 알레르기 테스트 ${allergenStreak(plans, date, s.allergen)}일차`}
          className="mt-auto flex min-w-0 items-center gap-1 rounded-md bg-allergy-bg py-0.5 pr-1.5 pl-[3px] text-[11px] leading-none font-semibold whitespace-nowrap text-allergy"
          aria-hidden="true"
        >
          <IngredientIcon id={s.allergen} size={16} className="shrink-0" />
          <span className="truncate">
            {Math.min(allergenStreak(plans, date, s.allergen), 3)}/3일
          </span>
        </span>
      )}
    </button>
  )
}

export function PcCalendarLegend() {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-sub">
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-done" />
        완료
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-plan-dot" />
        예정
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-allergy-bar" />
        알레르기 테스트
      </span>
      <span className="text-muted">· 베이스 쌀은 생략 · 날짜를 누르면 식단을 고칠 수 있어요</span>
    </div>
  )
}
