import { ENABLED_PROVIDERS, type Provider } from '../../auth'
import { useAuth } from '../../auth/AuthProvider'
import { LegalLinks } from '../../components/LegalLinks'
import { ShareApp } from '../../components/ShareApp'
import heroUrl from '../../assets/brand/hero.webp'
import { SocialButton } from '../../components/login/SocialButton'
import { load, save } from '../../lib/storage'

/** 모바일 로그인·가입 (AppLogin 시안). 처음 누르면 자동으로 가입돼요 */
export function AppLogin() {
  const { signIn, signingIn, loginError, notice } = useAuth()
  const recent = load<Provider | null>('lastLoginProvider', null)

  const start = (provider: Provider) => {
    save('lastLoginProvider', provider)
    void signIn(provider, { allowSignUp: true, keepSignedIn: true })
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-cream">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 pt-8 pb-4">
        <h1 className="m-0">
          <img src={heroUrl} alt="맘마" width={720} height={802} draggable={false} className="h-auto w-[min(72vw,300px)] [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent),linear-gradient(to_bottom,transparent,#000_6%,#000_94%,transparent)] [mask-composite:intersect]" />
        </h1>
        <p className="m-0 text-center text-base leading-[1.55] text-sub">
          우리 아기 이유식,
          <br />
          월령에 맞춰 쉽게 계획해요
        </p>
      </div>

      <section className="flex flex-col gap-3 rounded-t-[32px] bg-card px-6 pt-7 pb-[max(34px,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(146,64,14,0.08)]">
        <h2 className="m-0 mb-1 text-center text-lg font-bold">간편하게 시작하기</h2>
        {ENABLED_PROVIDERS.map((p) => (
          <SocialButton key={p} provider={p} verb="시작하기" recent={ENABLED_PROVIDERS.length > 1 && recent === p} loading={signingIn === p} disabled={signingIn !== null} onClick={() => start(p)} />
        ))}
        {notice === 'deleted' && (
          <p role="status" className="m-0 rounded-xl bg-soft p-3 text-center text-[13px] font-medium text-text">
            계정과 기록을 모두 삭제했어요.
          </p>
        )}
        {loginError && (
          <p role="alert" className="m-0 rounded-xl bg-urgent-bg p-3 text-center text-[13px] font-medium text-urgent-ink">
            {loginError}
          </p>
        )}
        <p className="m-0 mt-1.5 text-center text-xs leading-[1.6] text-sub">
          처음이면 다음 화면에서 약관 동의 후 가입돼요.
          <br />
          <LegalLinks />
        </p>
        <div className="mt-1 flex items-center justify-center rounded-xl bg-bg px-3 py-2.5 text-xs text-sub">PC에서도 같은 주소로 접속해 같은 계정으로 로그인하면 큰 화면으로 볼 수 있어요</div>
        <ShareApp source="share-login" className="items-center" />
      </section>
    </div>
  )
}
