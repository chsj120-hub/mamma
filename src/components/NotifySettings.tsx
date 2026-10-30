import { useState } from 'react'
import { askPermission, LEAD_MINUTES, notifyPermission, showSystemNotification, type NotifyPermission } from '../lib/notify'
import { load, save } from '../lib/storage'
import { NOTIFY_KEY } from './MealReminders'

const PERM_TEXT: Record<NotifyPermission, string> = {
  unsupported: '이 브라우저는 시스템 알림을 지원하지 않아요. 앱 화면 위쪽에 띠로만 알려요.',
  default: '켜면 알림 허용을 물어봐요.',
  granted: '알림이 허용돼 있어요.',
  denied: '알림이 차단돼 있어요. 브라우저 설정에서 이 사이트의 알림을 허용해 주세요. (그동안은 화면 위쪽 띠로만 알려요)',
}

/** 식사 10분 전 알림 켜기/끄기 (이 기기에서만) */
export function NotifySettings() {
  const [on, setOn] = useState(() => load<boolean>(NOTIFY_KEY, false))
  const [perm, setPerm] = useState<NotifyPermission>(() => notifyPermission())
  const [testMsg, setTestMsg] = useState('')

  const toggle = async () => {
    const next = !on
    if (next && perm === 'default') setPerm(await askPermission())
    save(NOTIFY_KEY, next)
    setOn(next)
  }

  const test = async () => {
    const ok = await showSystemNotification('맘마 알림 테스트', `식사 ${LEAD_MINUTES}분 전에 이렇게 알려 드려요`, 'mamma-test')
    setTestMsg(ok ? '알림을 보냈어요.' : '시스템 알림이 허용되지 않아서 보내지 못했어요.')
  }

  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-3.5" aria-labelledby="notify-title">
      <div className="flex items-center justify-between gap-3">
        <span id="notify-title" className="text-sm font-bold">
          식사 {LEAD_MINUTES}분 전 알림
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-labelledby="notify-title"
          onClick={toggle}
          className={`relative h-8 w-14 shrink-0 rounded-full border-none transition-colors ${on ? 'bg-done' : 'bg-plan-dot'}`}
        >
          <span className={`absolute top-1 size-6 rounded-full bg-white shadow transition-all ${on ? 'left-7' : 'left-1'}`} />
          <span className="sr-only">{on ? '켜짐' : '꺼짐'}</span>
        </button>
      </div>
      <p className="m-0 text-xs leading-relaxed text-sub">
        설정한 먹는 시간 {LEAD_MINUTES}분 전에 알려요. <b>앱(탭)이 열려 있는 동안</b>에만 울려요. 오전 8시 이후 처음 열면 알레르기 테스트 첫날과 소비기한 임박 큐브도 알려 줘요. 아이폰은 사파리에서 '홈 화면에 추가'한 앱에서만 알림이 와요.
      </p>
      {on && <p className="m-0 text-xs font-medium text-sub">{PERM_TEXT[perm]}</p>}
      {on && (
        <div className="flex items-center gap-2">
          <button type="button" onClick={test} className="h-11 rounded-[22px] border border-line bg-card px-4 text-[13px] font-semibold text-ink">
            테스트 알림 보내기
          </button>
          <span role="status" className="text-xs text-sub">
            {testMsg}
          </span>
        </div>
      )}
    </section>
  )
}
