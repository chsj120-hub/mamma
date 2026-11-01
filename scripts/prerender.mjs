// 빌드 뒤에 실행: 공개 페이지(가이드·약관·방침)를 정적 HTML 파일로 만들고, sitemap.xml·robots.txt를 만든다.
// - dist/index.html을 틀로 삼아 제목·설명·대표 주소·공유 정보를 바꾸고 #root 안에 미리 그린 내용을 넣는다
// - 브라우저에서 JS가 켜지면 같은 내용을 React가 다시 그려 넣는다 (겉모습은 같다)
// 사이트 주소는 VITE_SITE_URL (.env 또는 호스팅 환경변수. 예: https://mamma.example.com)
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { loadEnv } from 'vite'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
// .env → .env.local → 실제 환경변수 순으로 덮어쓴다 (vite와 같은 규칙)
const SITE = (loadEnv('production', root, 'VITE_').VITE_SITE_URL || 'https://mamma-one.vercel.app').replace(/\/$/, '')

const { routes } = await import(pathToFileURL(join(root, '.ssr', 'prerender.js')).href)
const template = readFileSync(join(dist, 'index.html'), 'utf8')

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const setMeta = (html, re, replacement) => {
  if (!re.test(html)) throw new Error(`index.html에서 ${re}를 찾지 못했어요`)
  return html.replace(re, replacement)
}

function page(html, { path, title, description, body, noindex }) {
  const url = SITE + (path === '/' ? '' : path)
  let out = html
  out = setMeta(out, /<title>.*?<\/title>/, `<title>${esc(title)}</title>`)
  out = setMeta(out, /<meta name="description" content=".*?" \/>/, `<meta name="description" content="${esc(description)}" />`)
  out = setMeta(out, /<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${esc(title)}" />`)
  out = setMeta(out, /<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${esc(description)}" />`)
  out = setMeta(out, /<meta property="og:image" content=".*?" \/>/, `<meta property="og:image" content="${SITE}/og-image.png" />`)
  const extra = [`<link rel="canonical" href="${url}" />`, `<meta property="og:url" content="${url}" />`]
  if (noindex) extra.push('<meta name="robots" content="noindex" />')
  out = out.replace('</head>', `    ${extra.join('\n    ')}\n  </head>`)
  if (body) out = setMeta(out, /<div id="root"><\/div>/, `<div id="root">${body}</div>`)
  return out
}

// 1) 공개 페이지 정적 HTML
const list = routes()
for (const r of list) {
  const dir = join(dist, r.path)
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), page(template, { ...r, body: r.html }))
}

// 2) sitemap.xml: 검색에 노출할 공개 페이지만 (초안·noindex 제외)
const today = new Date().toISOString().slice(0, 10)
const urls = [{ path: '', changefreq: 'weekly' }, ...list.filter((r) => !r.noindex).map((r) => ({ path: r.path, changefreq: r.path.startsWith('/guide') ? 'monthly' : 'yearly' }))]
writeFileSync(
  join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${SITE}${u.path}</loc><lastmod>${today}</lastmod><changefreq>${u.changefreq}</changefreq></url>`)
    .join('\n')}\n</urlset>\n`,
)

// 3) robots.txt: 로그인 뒤 화면 주소는 따로 막을 필요가 없다(로그인 없이 내용이 안 보인다). 사이트맵 위치만 알린다
writeFileSync(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`)

console.log(`정적 HTML ${list.length}개, sitemap ${urls.length}개 주소 (${SITE})`)
for (const r of list) console.log(`  ${r.noindex ? '[noindex]' : '[공개]  '} ${r.path}`)
