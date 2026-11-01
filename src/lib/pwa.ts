// 서비스 워커 등록과 '새 버전이 있어요' 알림. 개발 서버에서는 서비스 워커가 없어서 아무 일도 하지 않는다.
import { registerSW } from 'virtual:pwa-register'

type Listener = (needRefresh: boolean) => void
let listener: Listener | null = null
let needRefresh = false
let update: ((reload?: boolean) => Promise<void>) | null = null

/** 앱 시작 때 한 번 부른다. 지원하지 않거나 실패해도 앱은 그대로 동작한다 */
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  try {
    update = registerSW({
      immediate: true,
      onNeedRefresh() {
        needRefresh = true
        listener?.(true)
      },
    })
  } catch {
    // 등록 실패는 무시
  }
}

/** 새 버전 알림 구독. 이미 알림이 와 있었다면 바로 true를 돌려 준다 */
export function onNeedRefresh(fn: Listener) {
  listener = fn
  if (needRefresh) fn(true)
  return () => {
    if (listener === fn) listener = null
  }
}

/** 새 버전으로 바꿔 끼우고 화면을 다시 불러온다 */
export function applyUpdate() {
  void update?.(true)
}
