// 맘마 서비스 워커. 지금은 '알림 표시'와 '알림을 누르면 앱 열기'만 한다 (캐시·오프라인 기능 없음).
// 안드로이드 크롬은 new Notification()을 못 쓰고 서비스 워커의 showNotification()만 되기 때문에 필요하다.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => 'focus' in c)
      return open ? open.focus() : self.clients.openWindow('/')
    }),
  )
})
