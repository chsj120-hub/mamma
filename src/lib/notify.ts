// 식사 알림. 브라우저 알림(Notification API) + 서비스 워커.
// 한계: 앱(브라우저 탭 또는 홈 화면에 추가한 앱)이 열려 있는 동안에만 정해진 시간에 울린다.
// 앱이 완전히 닫혀 있을 때도 울리려면 서버가 푸시를 보내야 한다 (docs/NOTIFICATIONS.md).
import { ingredientName } from './ingredients'
import { mealItems } from './meal'
import type { Meal } from './types'

/** 식사 몇 분 전에 알릴지 */
export const LEAD_MINUTES = 10

export type NotifyPermission = 'unsupported' | 'default' | 'granted' | 'denied'

export function notifyPermission(): NotifyPermission {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission
}

export async function askPermission(): Promise<NotifyPermission> {
  if (typeof Notification === 'undefined') return 'unsupported'
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

/** 시스템 알림을 띄운다 (허용되지 않았으면 아무것도 안 하고 false) */
export async function showSystemNotification(title: string, body: string, tag: string) {
  if (notifyPermission() !== 'granted') return false
  const options: NotificationOptions = { body, tag, icon: '/icons/icon-192.png', badge: '/icons/badge-96.png', lang: 'ko' }
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg) {
        await reg.showNotification(title, options)
        return true
      }
    }
    new Notification(title, options)
    return true
  } catch {
    return false
  }
}

/** 오늘 날짜(YYYY-MM-DD)와 HH:mm으로 그 끼니의 시각 */
export function mealTime(date: string, time: string) {
  const [y, mo, d] = date.split('-').map(Number)
  const [h, mi] = time.split(':').map(Number)
  return new Date(y, mo - 1, d, h, mi, 0, 0)
}

export type DueReminder = { meal: Meal; minutes: number }

/** 지금 알려야 할 끼니: 아직 안 먹었고, 시작 10분 전부터 시작 1분 뒤까지 */
export function dueReminders(date: string, meals: Meal[], now: Date, lead = LEAD_MINUTES): DueReminder[] {
  const out: DueReminder[] = []
  for (const meal of meals) {
    if (meal.status === 'done') continue
    const ms = mealTime(date, meal.time).getTime() - now.getTime()
    if (ms <= lead * 60_000 && ms > -60_000) out.push({ meal, minutes: Math.max(0, Math.ceil(ms / 60_000)) })
  }
  return out
}

export function reminderText({ meal, minutes }: DueReminder) {
  const items = mealItems(meal)
    .filter((id) => id !== meal.base)
    .map(ingredientName)
    .join(' · ')
  return {
    title: minutes <= 0 ? `${meal.label} 이유식 시간이에요` : `${meal.label} 이유식 ${minutes}분 전이에요`,
    body: items || '메뉴를 정해 보세요',
  }
}
