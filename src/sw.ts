/// <reference lib="webworker" />
// 맘마 서비스 워커 (vite-plugin-pwa injectManifest). tsconfig에서는 제외돼 있고 빌드 때 번들된다.
// 하는 일
// 1) 앱 파일(JS·CSS·이미지·HTML)을 미리 캐시해서 오프라인에서도 화면이 열리게 한다. 파일 목록은 빌드 때 자동으로 채워진다.
// 2) 구글 폰트를 캐시한다 (오프라인에서도 글꼴이 유지되게).
// 3) 알림 표시와 '알림을 누르면 앱 열기' (안드로이드 크롬은 서비스 워커의 showNotification()만 된다).
// 하지 않는 일: Firebase·구글 로그인 주소는 캐시하지 않는다 (항상 네트워크). 로그인·동기화가 깨지기 때문이다.
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { clientsClaim } from 'workbox-core'
import { ExpirationPlugin } from 'workbox-expiration'
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<string | { url: string; revision: string | null }> }

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// 어떤 주소로 열어도(예: /cube, /guide/…) 앱 화면(index.html)을 준다. sitemap.xml 같은 파일 주소는 제외한다.
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html'), { denylist: [/\/[^/?]+\.[^/]+$/] }))

registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({ cacheName: 'google-fonts-css' }),
)
registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-files',
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] }), new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 })],
  }),
)

// 새 버전은 사용자가 '새로고침'을 누를 때 바꿔 끼운다 (열려 있던 화면과 새 파일이 섞여 깨지는 것을 막는다)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') void self.skipWaiting()
})
clientsClaim()

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => 'focus' in c)
      return open ? open.focus() : self.clients.openWindow('/')
    }),
  )
})
