import { PROVIDER_NAME, type Provider } from '../../auth'

// src/assets/social/ 안의 kakao·naver·google 이미지(svg/png/webp/jpg). 없으면 빈 자리로 둔다.
const logos = import.meta.glob<string>('../../assets/social/*.{svg,png,webp,jpg,jpeg}', { eager: true, query: '?url', import: 'default' })

function logoOf(provider: Provider) {
  const hit = Object.entries(logos).find(([path]) => new RegExp(`/${provider}\.(svg|png|webp|jpe?g)$`).test(path))
  return hit?.[1]
}

const STYLE: Record<Provider, string> = {
  kakao: 'bg-kakao text-kakao-ink border-transparent',
  naver: 'bg-naver text-white border-transparent',
  google: 'bg-white text-google-ink border-google-line',
}

type Props = {
  provider: Provider
  /** '시작하기' (모바일) / '로그인' (PC) */
  verb: string
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  /** 마지막으로 쓴 로그인 방법 표시 (모바일) */
  recent?: boolean
}

export function SocialButton({ provider, verb, onClick, disabled, loading, recent }: Props) {
  const logo = logoOf(provider)
  const label = `${PROVIDER_NAME[provider]}로 ${verb}`
  return (
    <div className="relative">
      {recent && (
        <span className="absolute -top-2.5 right-3.5 z-10 rounded-[10px] bg-text px-2 py-[3px] text-[11px] font-bold text-white">최근 사용</span>
      )}
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-busy={loading || undefined}
        className={`flex h-[54px] w-full items-center gap-3 rounded-[14px] border px-[18px] text-base font-bold disabled:opacity-60 ${STYLE[provider]}`}
      >
        {/* 로고 자리 24×24 (이미지가 없어도 자리는 유지) */}
        <span className="flex size-6 shrink-0 items-center justify-center" aria-hidden="true">
          {logo && <img src={logo} alt="" width={24} height={24} draggable={false} />}
        </span>
        <span className="mr-9 flex-1 text-center">{loading ? '로그인 중…' : label}</span>
      </button>
    </div>
  )
}
