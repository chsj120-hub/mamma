import { useEffect } from 'react'
import { legalReady } from '../data/legal'
import { DELETE_ACCOUNT, PRIVACY, TERMS, type Block, type LegalDoc } from '../data/legalText'

export type LegalKind = 'terms' | 'privacy' | 'delete-account'

const DOCS: Record<LegalKind, LegalDoc> = { terms: TERMS, privacy: PRIVACY, 'delete-account': DELETE_ACCOUNT }
const NAV: { kind: LegalKind; label: string }[] = [
  { kind: 'terms', label: '이용약관' },
  { kind: 'privacy', label: '개인정보 처리방침' },
  { kind: 'delete-account', label: '계정 삭제 안내' },
]

function BlockView({ block }: { block: Block }) {
  if ('p' in block) return <p className="m-0 text-[15px] leading-[1.75] text-text">{block.p}</p>
  return (
    <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-[1.75] text-text">
      {block.ul.map((li) => (
        <li key={li}>{li}</li>
      ))}
    </ul>
  )
}

/** 이용약관·개인정보 처리방침·계정 삭제 안내. 로그인 없이 볼 수 있는 공개 주소(/terms, /privacy, /delete-account)다 */
export function LegalPage({ kind }: { kind: LegalKind }) {
  const doc = DOCS[kind]
  useEffect(() => {
    document.title = `${doc.title} · 맘마`
    window.scrollTo(0, 0)
  }, [doc.title])

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-[760px] flex-wrap items-center justify-between gap-x-4 px-5 py-3">
          <a href="/" className="flex min-h-11 items-center font-display text-2xl text-ink no-underline">
            맘마
          </a>
          <nav className="flex flex-wrap gap-x-4" aria-label="약관 문서">
            {NAV.map((n) => (
              <a
                key={n.kind}
                href={`/${n.kind}`}
                aria-current={n.kind === kind ? 'page' : undefined}
                className={`flex min-h-11 items-center text-[13px] no-underline ${n.kind === kind ? 'font-bold text-ink underline' : 'text-sub'}`}
              >
                {n.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-[760px] flex-col gap-6 px-5 pt-8 pb-16">
        <div className="flex flex-col gap-2">
          <h1 className="m-0 font-display text-[32px] leading-tight font-normal">{doc.title}</h1>
          <p className="m-0 text-[13px] text-sub">시행일 {doc.version}</p>
          {doc.intro && <p className="m-0 text-[15px] leading-[1.75] text-text">{doc.intro}</p>}
        </div>

        {!legalReady && (
          <p role="note" className="m-0 rounded-xl border border-urgent-line bg-urgent-bg px-4 py-3 text-[13px] leading-[1.6] font-medium text-urgent-ink">
            운영자 정보 입력 필요: 공개하기 전에 src/data/legal.ts의 운영자 이름·이메일·보호책임자·데이터 위치를 채워 주세요. 이 문서는 초안이에요.
          </p>
        )}

        {doc.sections.map((s) => (
          <section key={s.title} className="flex flex-col gap-2.5">
            <h2 className="m-0 text-lg font-bold">{s.title}</h2>
            {s.blocks.map((b, i) => (
              <BlockView key={i} block={b} />
            ))}
          </section>
        ))}
      </main>
    </div>
  )
}
