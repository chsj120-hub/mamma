import type { ReactNode } from 'react'
import { GUIDE_POSTS, getPost, postsByCategory, publishedPosts, type GuidePost } from '../lib/guide'
import { usePageMeta } from '../lib/pageMeta'

// 이 파일의 컴포넌트는 브라우저와 빌드 때 정적 HTML 만들기(src/prerender.tsx)에서 똑같이 쓰인다.
// 그래서 라우터·저장소·로그인 같은 것에 기대지 않고 일반 <a> 링크만 쓴다.

const SITE = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg text-ink">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-[760px] items-center justify-between gap-4 px-5 py-3">
          <a href="/guide" className="flex min-h-11 items-center font-display text-2xl text-ink no-underline">
            맘마 가이드
          </a>
          <a href="/" className="flex min-h-11 items-center rounded-[22px] bg-ink px-4 text-[13px] font-bold text-white no-underline">
            맘마 열기
          </a>
        </div>
      </header>
      <main className="mx-auto flex max-w-[760px] flex-col gap-6 px-5 pt-8 pb-16">{children}</main>
      <footer className="border-t border-line bg-card">
        <div className="mx-auto flex max-w-[760px] flex-wrap gap-x-5 px-5 py-4 text-xs text-sub">
          <a href="/terms" className="inline-flex min-h-11 items-center text-inherit underline">
            이용약관
          </a>
          <a href="/privacy" className="inline-flex min-h-11 items-center text-inherit underline">
            개인정보 처리방침
          </a>
          <span className="flex min-h-11 items-center">이 글은 참고용이며 진단·치료를 대신하지 않아요.</span>
        </div>
      </footer>
    </div>
  )
}

const DraftNote = () => (
  <p role="note" className="m-0 rounded-xl border border-urgent-line bg-urgent-bg px-4 py-3 text-[13px] leading-[1.6] font-medium text-urgent-ink">
    초안이에요. 출처 확인과 검토가 끝나기 전이라 검색에 노출되지 않아요. 확인되지 않은 내용은 따르지 마세요.
  </p>
)

export function GuideIndexPage() {
  const groups = postsByCategory()
  usePageMeta({
    title: '이유식 가이드 · 맘마',
    description: '월령별 이유식 단계, 재료 시작 순서, 홈큐브 보관까지. 출처를 밝힌 이유식 가이드예요.',
    canonical: `${SITE}/guide`,
    noindex: publishedPosts().length === 0,
  })
  return (
    <Shell>
      <div className="flex flex-col gap-2">
        <h1 className="m-0 font-display text-[32px] leading-tight font-normal">이유식 가이드</h1>
        <p className="m-0 text-[15px] leading-[1.75] text-text">월령에 맞춰 이유식을 준비하는 데 도움이 되는 글을 모았어요. 건강과 관련된 수치는 출처를 함께 적어요.</p>
      </div>
      {groups.length === 0 && <p className="m-0 text-sub">준비 중이에요.</p>}
      {groups.map(([category, posts]) => (
        <section key={category} className="flex flex-col gap-2" aria-label={category}>
          <h2 className="m-0 text-lg font-bold">{category}</h2>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {posts.map((p) => (
              <li key={p.slug}>
                <a href={`/guide/${p.slug}`} className="flex min-h-11 flex-col gap-0.5 rounded-2xl border border-line bg-card px-4 py-3 text-ink no-underline">
                  <span className="text-[15px] font-bold">
                    {p.title}
                    {p.draft && <span className="ml-2 rounded-md bg-soft px-1.5 py-0.5 text-[11px] font-semibold text-sub">초안</span>}
                  </span>
                  <span className="text-[13px] leading-[1.6] text-sub">{p.description}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </Shell>
  )
}

export function GuidePostPage({ slug }: { slug: string }) {
  const post = getPost(slug)
  usePageMeta({
    title: post ? `${post.title} · 맘마 가이드` : '찾을 수 없는 글 · 맘마 가이드',
    description: post?.description ?? '요청한 글을 찾을 수 없어요.',
    canonical: post ? `${SITE}/guide/${post.slug}` : undefined,
    noindex: !post || post.draft,
  })
  if (!post) {
    return (
      <Shell>
        <h1 className="m-0 font-display text-[28px] font-normal">찾을 수 없는 글이에요</h1>
        <a href="/guide" className="text-ink underline">
          가이드 목록으로
        </a>
      </Shell>
    )
  }
  return (
    <Shell>
      <Article post={post} />
    </Shell>
  )
}

function Article({ post }: { post: GuidePost }) {
  const related = GUIDE_POSTS.filter((p) => p.slug !== post.slug && p.category === post.category).slice(0, 3)
  return (
    <article className="flex flex-col gap-6">
      <nav aria-label="현재 위치" className="text-xs text-sub">
        <a href="/guide" className="text-inherit underline">
          가이드
        </a>{' '}
        · {post.category}
      </nav>
      <div className="flex flex-col gap-2">
        <h1 className="m-0 font-display text-[32px] leading-tight font-normal">{post.title}</h1>
        <p className="m-0 text-[13px] text-sub">마지막 확인 {post.updated}</p>
        <p className="m-0 text-[15px] leading-[1.75] text-text">{post.description}</p>
      </div>

      {post.draft && <DraftNote />}

      {post.sections.length > 2 && (
        <nav aria-label="목차" className="rounded-2xl border border-line bg-card px-4 py-3">
          <b className="text-sm">목차</b>
          <ol className="m-0 mt-1.5 flex list-decimal flex-col pl-5 text-[14px]">
            {post.sections.map((s, i) => (
              <li key={s.h}>
                <a href={`#s${i}`} className="inline-flex min-h-11 items-center text-ink underline">
                  {s.h}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {post.sections.map((s, i) => (
        <section key={s.h} id={`s${i}`} className="flex scroll-mt-4 flex-col gap-2.5">
          <h2 className="m-0 text-xl font-bold">{s.h}</h2>
          {s.p?.map((t) => (
            <p key={t} className="m-0 text-[15px] leading-[1.8] text-text">
              {t}
            </p>
          ))}
          {s.ul && (
            <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-[1.8] text-text">
              {s.ul.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}
        </section>
      ))}

      {post.faq && post.faq.length > 0 && (
        <section className="flex flex-col gap-3" aria-label="자주 묻는 질문">
          <h2 className="m-0 text-xl font-bold">자주 묻는 질문</h2>
          {post.faq.map((f) => (
            <div key={f.q} className="flex flex-col gap-1">
              <h3 className="m-0 text-[15px] font-bold">{f.q}</h3>
              <p className="m-0 text-[15px] leading-[1.8] text-text">{f.a}</p>
            </div>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-2 rounded-2xl border border-line bg-card px-4 py-3" aria-label="출처">
        <h2 className="m-0 text-base font-bold">출처</h2>
        {post.sources.length === 0 ? (
          <p className="m-0 text-[13px] text-sub">아직 출처를 채우지 않았어요.</p>
        ) : (
          <ul className="m-0 flex list-disc flex-col gap-1 pl-5 text-[13px]">
            {post.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-ink underline">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="m-0 text-xs leading-relaxed text-sub">이 글은 일반적인 참고 정보예요. 새 재료나 알레르기 재료를 시작하기 전, 아기의 건강이 걱정될 때는 소아청소년과와 상담해 주세요.</p>

      <a href="/" className="flex min-h-12 items-center justify-center rounded-3xl bg-ink px-6 text-[15px] font-bold text-white no-underline">
        맘마에서 우리 아기 식단 짜기
      </a>

      {related.length > 0 && (
        <nav aria-label="관련 글" className="flex flex-col gap-1.5">
          <b className="text-sm">같이 보면 좋은 글</b>
          {related.map((p) => (
            <a key={p.slug} href={`/guide/${p.slug}`} className="inline-flex min-h-11 items-center text-[14px] text-ink underline">
              {p.title}
            </a>
          ))}
        </nav>
      )}
    </article>
  )
}
