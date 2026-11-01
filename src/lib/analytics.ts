// 방문 분석(Cloudflare Web Analytics). 쿠키를 쓰지 않는 방식이고, 토큰(VITE_CF_ANALYTICS_TOKEN)이 있을 때만 켠다.
// 개발 서버에서는 켜지 않는다. 설정 방법: docs/ANALYTICS.md
export function startAnalytics() {
  const token = import.meta.env.VITE_CF_ANALYTICS_TOKEN as string | undefined
  if (!token || import.meta.env.DEV) return
  const s = document.createElement('script')
  s.defer = true
  s.src = 'https://static.cloudflareinsights.com/beacon.min.js'
  s.setAttribute('data-cf-beacon', JSON.stringify({ token }))
  document.head.appendChild(s)
}
