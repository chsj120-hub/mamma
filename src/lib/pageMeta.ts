import { useEffect } from 'react'

type Meta = { title: string; description: string; canonical?: string; noindex?: boolean }

function upsert(selector: string, create: () => HTMLElement) {
  let el = document.head.querySelector<HTMLElement>(selector)
  if (!el) {
    el = create()
    document.head.appendChild(el)
  }
  return el
}

/** 페이지마다 제목·설명·대표 주소·검색 노출 여부를 바꾼다. 페이지를 떠나면 원래 값으로 돌려놓는다 */
export function usePageMeta({ title, description, canonical, noindex }: Meta) {
  useEffect(() => {
    const prevTitle = document.title
    const descEl = upsert('meta[name="description"]', () => Object.assign(document.createElement('meta'), { name: 'description' }))
    const prevDesc = descEl.getAttribute('content') ?? ''
    document.title = title
    descEl.setAttribute('content', description)

    const added: HTMLElement[] = []
    if (canonical) {
      const link = document.createElement('link')
      link.rel = 'canonical'
      link.href = canonical
      document.head.appendChild(link)
      added.push(link)
    }
    if (noindex) {
      const robots = document.createElement('meta')
      robots.name = 'robots'
      robots.content = 'noindex'
      document.head.appendChild(robots)
      added.push(robots)
    }
    return () => {
      document.title = prevTitle
      descEl.setAttribute('content', prevDesc)
      added.forEach((el) => el.remove())
    }
  }, [title, description, canonical, noindex])
}
