// 공개 가이드 글. 글 한 편 = src/content/guide/<주소>.json 파일 하나. 추가·수정 방법은 docs/GUIDE_CONTENT.md
// 글은 '초안(draft)'으로 시작하고, 출처를 채워 검토를 마친 뒤 draft를 지워야 검색·광고용으로 공개된다.

export type GuideSection = { h: string; p?: string[]; ul?: string[] }
export type GuidePost = {
  slug: string
  title: string
  description: string
  category: string
  /** 목록 순서(작을수록 앞) */
  order: number
  /** 마지막으로 내용을 확인한 날 (YYYY-MM-DD) */
  updated: string
  /** true면 초안: 검색에 노출하지 않고(noindex) sitemap에서 뺀다. 출처 확인이 끝나면 지운다 */
  draft?: boolean
  sections: GuideSection[]
  /** 출처. 건강 수치를 쓴 글은 공공기관·학회 원문 링크가 반드시 있어야 한다 */
  sources: { label: string; url: string }[]
  faq?: { q: string; a: string }[]
}

const modules = import.meta.glob<GuidePost>('../content/guide/*.json', { eager: true, import: 'default' })

export const GUIDE_POSTS: GuidePost[] = Object.values(modules).sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'ko'))

export const getPost = (slug: string) => GUIDE_POSTS.find((p) => p.slug === slug)

export const publishedPosts = () => GUIDE_POSTS.filter((p) => !p.draft)

/** 카테고리 순서를 지키며 글을 묶는다 */
export function postsByCategory() {
  const map = new Map<string, GuidePost[]>()
  for (const p of GUIDE_POSTS) map.set(p.category, [...(map.get(p.category) ?? []), p])
  return [...map]
}
