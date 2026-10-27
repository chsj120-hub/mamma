import { shelfLifeDays } from './ingredients'
import { addDays, daysBetween, todayKey, weekStart } from './date'
import { mealItems } from './meal'
import type { Cube, MealPlans } from './types'

export const LOW_STOCK_UNDER = 2
export const EXPIRY_WARN_DAYS = 3

export const isStore = (c: Cube) => c.source === 'store'

/** 소진 기한: 시판은 포장의 소비기한, 직접 만든 큐브는 제조일 + 권장 보관 기간 */
export const expiresAt = (c: Cube) => (isStore(c) && c.expiresOn ? c.expiresOn : addDays(c.madeAt, shelfLifeDays(c.ingredient)))

/** 남은 일수. 0 = 오늘까지, 음수 = 만료 */
export const daysLeft = (c: Cube, today = todayKey()) => daysBetween(today, expiresAt(c))

export const isLowStock = (c: Cube) => c.count < LOW_STOCK_UNDER

/** 3일 이내 소진해야 하거나 이미 만료된 큐브 (남은 일수 오름차순) */
export function expiringCubes(cubes: Cube[], today = todayKey()) {
  return cubes
    .filter((c) => c.count > 0 && daysLeft(c, today) <= EXPIRY_WARN_DAYS)
    .sort((a, b) => daysLeft(a, today) - daysLeft(b, today))
}

/** 'D-2', 'D-Day', '만료' */
export function dLabel(left: number) {
  if (left < 0) return '만료'
  if (left === 0) return 'D-Day'
  return `D-${left}`
}

export type CubeStatus = 'urgent' | 'low' | 'ok'

/** 표의 상태 칸: 기한 임박(3일 이내, 남은 게 있을 때)이 재고 부족보다 우선 */
export function cubeStatus(c: Cube, today = todayKey()): CubeStatus {
  if (c.count > 0 && daysLeft(c, today) <= EXPIRY_WARN_DAYS) return 'urgent'
  if (isLowStock(c)) return 'low'
  return 'ok'
}

/** 오늘부터 이번 주 일요일까지 아직 안 먹은 끼니에 들어간, 보관함에 있는 재료 큐브 수 (한 끼 한 재료 = 큐브 1개) */
export function cubesPlannedThisWeek(plans: MealPlans, cubes: Cube[], today = todayKey()) {
  const stocked = new Set(cubes.filter((c) => c.count > 0).map((c) => c.ingredient))
  const end = addDays(weekStart(today), 6)
  let n = 0
  for (const day of Object.values(plans)) {
    if (day.date < today || day.date > end) continue
    for (const m of day.meals) if (m.status === 'planned') n += mealItems(m).filter((id) => stocked.has(id)).length
  }
  return n
}
