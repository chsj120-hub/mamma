// 공개 가이드 글. 글 한 편 = src/content/guide/<주소>.json 파일 하나. 추가·수정 방법은 docs/GUIDE_CONTENT.md
// 글은 '초안(draft)'으로 시작하고, 출처를 채워 검토를 마친 뒤 draft를 지워야 검색·광고용으로 공개된다.

export type GuideSection = {
  h: string
  p?: string[]
  ul?: string[]
  /** 직접 찍은 사진. 파일은 public/guide-img/에 두고 src는 '/guide-img/파일이름'으로 쓴다 */
  img?: { src: string; alt: string; caption?: string; w?: number; h?: number }
}
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
  /** 참고한 도서(링크 없이 책 이름만). 공개 글에는 '참고 도서'로 따로 보인다 */
  books?: string[]
  /** 맘마 사용 설명 글: 건강 정보가 없어 출처 칸을 보이지 않는다 */
  howto?: boolean
  /** 직접 해 본 경험·후기·식단 예시: 출처 칸 대신 '개인 경험' 안내가 붙는다 */
  experience?: boolean
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
