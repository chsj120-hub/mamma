// 빌드 때 공개 페이지(가이드·약관·방침)를 정적 HTML로 미리 만들기 위한 진입점. 브라우저에서는 쓰이지 않는다.
// `vite build -c vite.ssr.config.ts --ssr src/prerender.tsx` 로 번들한 뒤, scripts/prerender.mjs가 이 모듈을 불러 쓴다.
import { renderToString } from 'react-dom/server'
import { GUIDE_POSTS, getPost } from './lib/guide'
import { GuideIndexPage, GuidePostPage } from './pages/GuidePages'
import { LegalPage } from './pages/LegalPage'

export type PrerenderRoute = { path: string; title: string; description: string; html: string; noindex: boolean }

const SITE_DESC = '월령에 맞춰 이유식 식단을 짜고, 홈큐브 재고와 성장 기록까지 한곳에서 관리해요.'

export function routes(): PrerenderRoute[] {
  const published = GUIDE_POSTS.filter((p) => !p.draft).length
  const out: PrerenderRoute[] = [
    { path: '/guide', title: '이유식 가이드 · 맘마', description: '월령별 이유식 단계, 재료 시작 순서, 홈큐브 보관까지. 출처를 밝힌 이유식 가이드예요.', html: renderToString(<GuideIndexPage />), noindex: published === 0 },
    { path: '/terms', title: '이용약관 · 맘마', description: SITE_DESC, html: renderToString(<LegalPage kind="terms" />), noindex: false },
    { path: '/privacy', title: '개인정보 처리방침 · 맘마', description: SITE_DESC, html: renderToString(<LegalPage kind="privacy" />), noindex: false },
    { path: '/delete-account', title: '계정 삭제 안내 · 맘마', description: SITE_DESC, html: renderToString(<LegalPage kind="delete-account" />), noindex: false },
  ]
  for (const p of GUIDE_POSTS) {
    const post = getPost(p.slug)!
    out.push({ path: `/guide/${p.slug}`, title: `${post.title} · 맘마 가이드`, description: post.description, html: renderToString(<GuidePostPage slug={p.slug} />), noindex: Boolean(post.draft) })
  }
  return out
}
