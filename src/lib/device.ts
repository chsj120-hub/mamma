import { useSyncExternalStore } from 'react'

/** 이 폭 이상이면 PC 레이아웃 */
export const DESKTOP_MIN_WIDTH = 1024

const query = `(min-width: ${DESKTOP_MIN_WIDTH}px)`

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(query)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

/** 창 폭이 1024px 이상인지. 창 크기를 바꾸면 바로 다시 그린다 */
export function useIsDesktop() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches)
}
