import { useState, type ReactNode } from 'react'
import { ENABLED_PROVIDERS, type Provider } from '../../auth'
import { useAuth } from '../../auth/AuthProvider'
import iconUrl from '../../assets/brand/icon.webp'
import wordmarkUrl from '../../assets/brand/wordmark.webp'
import { LegalLinks } from '../../components/LegalLinks'
import { IngredientIcon } from '../../components/IngredientIcon'
import { SocialButton } from '../../components/login/SocialButton'
import type { IngredientId } from '../../lib/ingredients'

const icon = (children: ReactNode) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
)

const FEATURES: { label: string; icon: ReactNode }[] = [
  {
    label: '월간 식단 한눈에',
    icon: icon(
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </>,
    ),
  },
  {
    label: '홈큐브 재고 관리',
    icon: icon(
      <>
        <path d="M21 8 12 3 3 8v8l9 5 9-5z" />
        <path d="M3 8l9 5 9-5M12 13v8" />
      </>,
    ),
  },
  { label: '성장 리포트', icon: icon(<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />) },
  {
    label: '식단표 출력',
    icon: icon(
      <>
        <path d="M6 9V2h12v7" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </>,
    ),
  },
]

const FOODS: IngredientId[] = ['beef', 'broccoli', 'pumpkin', 'carrot', 'apple', 'banana', 'sweetpotato', 'rice']

/** PC 로그인·가입 (PcLogin 시안). 웹앱이라 PC에서도 처음이면 바로 가입된다 */
export function PcLogin() {
  const { signIn, signingIn, notice, loginError } = useAuth()
  const [keep, setKeep] = useState(false)

  const login = (provider: Provider) => void signIn(provider, { allowSignUp: true, keepSignedIn: keep })

  return (
    <div className="flex min-h-dvh flex-wrap bg-bg">
      <section className="relative flex min-w-0 flex-[1_1_520px] flex-col gap-9 overflow-hidden bg-cream px-14 py-12">
        <div className="flex items-center gap-3">
          <img src={iconUrl} alt="" width={48} height={48} draggable={false} className="size-12 rounded-2xl" />
          <img src={wordmarkUrl} alt="맘마" width={96} height={60} draggable={false} className="h-10 w-auto" />
        </div>

        <div className="flex max-w-[520px] flex-col gap-3.5">
          <h1 className="m-0 font-display text-[46px] leading-[1.2] font-normal">
            이유식 계획은
            <br />
            링크 하나로 바로
          </h1>
          <p className="m-0 text-[17px] leading-[1.6] text-sub">설치 없이 PC와 휴대폰 어디서나 같은 주소로 열어, 식단과 홈큐브, 성장 기록을 함께 볼 수 있어요.</p>
        </div>

        <ul className="m-0 grid max-w-[520px] list-none grid-cols-2 gap-3 p-0">
          {FEATURES.map((f) => (
            <li key={f.label} className="flex items-center gap-3 rounded-[18px] bg-card p-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-soft text-ink">{f.icon}</span>
              <span className="text-sm font-semibold">{f.label}</span>
            </li>
          ))}
        </ul>

        <div aria-hidden="true" className="mt-auto flex flex-wrap gap-3.5 opacity-95">
          {FOODS.map((id) => (
            <IngredientIcon key={id} id={id} size={44} />
          ))}
        </div>
      </section>

      <section className="flex min-w-0 flex-[1_1_480px] items-center justify-center px-8 py-12">
        <div className="flex w-full max-w-[420px] flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <h2 className="m-0 text-[28px] font-bold">로그인</h2>
            <p className="m-0 text-[15px] leading-[1.6] text-sub">Google 계정으로 로그인해요. 처음이면 다음 화면에서 약관 동의 후 바로 가입돼요.</p>
          </div>

          {notice === 'deleted' && (
            <p role="status" className="m-0 rounded-[14px] bg-soft p-3 text-[13px] font-medium text-text">
              계정과 기록을 모두 삭제했어요.
            </p>
          )}
          {notice && notice !== 'deleted' && (
            <div role="alert" className="flex flex-col gap-1 rounded-[14px] border border-urgent-line bg-urgent-bg px-4 py-3.5">
              <span className="text-sm font-bold text-urgent-ink">{notice === 'not-registered' ? '아직 가입되지 않은 계정이에요' : '가입이 아직 끝나지 않았어요'}</span>
              <span className="text-[13px] leading-normal text-urgent-sub">
                {notice === 'not-registered'
                  ? '처음이라면 Google로 로그인하면 바로 가입돼요.'
                  : '다시 로그인해 아기 정보 입력을 마쳐 주세요.'}
              </span>
            </div>
          )}
          {loginError && (
            <p role="alert" className="m-0 rounded-[14px] bg-urgent-bg p-3 text-[13px] font-medium text-urgent-ink">
              {loginError}
            </p>
          )}

          <div className="flex flex-col gap-2.5">
            {ENABLED_PROVIDERS.map((p) => (
              <SocialButton key={p} provider={p} verb="로그인" loading={signingIn === p} disabled={signingIn !== null} onClick={() => login(p)} />
            ))}
          </div>

          <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-sub">
            <input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} className="m-0 size-5 accent-ink" />이 PC에서 로그인 상태 유지
          </label>

          <div className="h-px bg-line" />

          <div className="flex flex-col gap-1.5 rounded-[18px] border border-line bg-card p-[18px]">
            <span className="text-[15px] font-bold">휴대폰에서도 같은 주소로</span>
            <span className="text-[13px] leading-[1.55] text-sub">
              휴대폰 브라우저에서 이 주소를 열고 같은 Google 계정으로 로그인하면 식단이 그대로 이어져요. 앱 설치는 필요 없어요. 브라우저 메뉴의 "홈 화면에 추가"를 쓰면 앱처럼 바로 열 수 있어요.
            </span>
          </div>

          <p className="m-0 text-center text-xs text-sub">
            <LegalLinks /> ·{' '}
            <a href="/delete-account" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-inherit underline">
              계정 삭제 안내
            </a>
          </p>
        </div>
      </section>
    </div>
  )
}
