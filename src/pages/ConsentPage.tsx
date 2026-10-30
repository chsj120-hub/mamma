import { useState, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { IngredientIcon } from '../components/IngredientIcon'
import { CONSENT_ITEMS } from '../data/legalText'

type Checks = { terms: boolean; privacy: boolean; sensitive: boolean; guardian: boolean }
const NONE: Checks = { terms: false, privacy: false, sensitive: false, guardian: false }

function Details({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <details className="ml-8 text-[13px] text-sub">
      <summary className="flex min-h-11 cursor-pointer items-center">자세히 보기</summary>
      <dl className="m-0 mb-2 flex flex-col gap-2 rounded-xl bg-bg p-3" aria-label={title}>
        {rows.map(([k, v]) => (
          <div key={k} className="flex flex-col gap-0.5">
            <dt className="font-bold text-text">{k}</dt>
            <dd className="m-0 leading-[1.6]">{v}</dd>
          </div>
        ))}
      </dl>
    </details>
  )
}

function Row({ checked, onToggle, label, children }: { checked: boolean; onToggle: () => void; label: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-col">
      <label className="flex min-h-11 cursor-pointer items-start gap-3 py-2.5 text-[15px] leading-snug">
        <input type="checkbox" checked={checked} onChange={onToggle} className="m-0 mt-0.5 size-5 shrink-0 accent-ink" />
        <span>
          <span className="font-bold text-sub">[필수] </span>
          {label}
        </span>
      </label>
      {children}
    </div>
  )
}

/**
 * 가입 직후(그리고 약관이 바뀌어 다시 동의가 필요할 때) 나오는 동의 화면.
 * 동의하지 않으면: 막 가입하던 중이면 계정을 지우고, 이미 쓰던 계정이면 로그아웃한다.
 */
export function ConsentPage() {
  const { user, onboarded, recordConsent, deleteAccount, signOutNow } = useAuth()
  const [checks, setChecks] = useState<Checks>(NONE)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const all = checks.terms && checks.privacy && checks.sensitive && checks.guardian
  const isNewSignup = !onboarded

  const toggle = (k: keyof Checks) => setChecks((c) => ({ ...c, [k]: !c[k] }))

  const agree = async () => {
    if (!all || busy) return
    setBusy(true)
    setError(null)
    try {
      await recordConsent()
    } catch {
      setError('동의 내용을 저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.')
      setBusy(false)
    }
  }

  const decline = async () => {
    if (busy) return
    setBusy(true)
    setError(null)
    if (isNewSignup) {
      const result = await deleteAccount()
      if (!result.ok) {
        setError(result.message)
        setBusy(false)
      }
    } else {
      await signOutNow()
    }
  }

  const link = 'font-semibold text-ink underline'

  return (
    <div className="flex min-h-dvh flex-col items-center bg-soft px-5 py-8">
      <main className="flex w-full max-w-[520px] flex-col gap-5">
        <div className="flex items-center gap-2" aria-hidden="true">
          <IngredientIcon id="rice" size={32} />
          <IngredientIcon id="carrot" size={32} />
          <IngredientIcon id="apple" size={32} />
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 font-display text-[32px] leading-tight font-normal">{isNewSignup ? '시작하기 전에 확인해 주세요' : '약관이 바뀌었어요'}</h1>
          <p className="m-0 text-[15px] leading-relaxed text-sub">
            {isNewSignup ? '맘마를 쓰려면 아래 내용에 동의가 필요해요.' : '바뀐 내용에 다시 동의하면 이어서 쓸 수 있어요.'}
          </p>
        </div>

        <section className="flex flex-col rounded-3xl bg-card px-5 py-3 shadow-[0_10px_30px_rgba(146,64,14,0.08)]" aria-label="동의 항목">
          <label className="flex min-h-11 cursor-pointer items-center gap-3 border-b border-line py-2.5 text-base font-bold">
            <input
              type="checkbox"
              checked={all}
              onChange={() => setChecks(all ? NONE : { terms: true, privacy: true, sensitive: true, guardian: true })}
              className="m-0 size-5 shrink-0 accent-ink"
            />
            전체 동의
          </label>

          <Row
            checked={checks.terms}
            onToggle={() => toggle('terms')}
            label={
              <>
                <a href="/terms" target="_blank" rel="noopener noreferrer" className={link}>
                  이용약관
                </a>
                에 동의해요
              </>
            }
          />
          <Row
            checked={checks.privacy}
            onToggle={() => toggle('privacy')}
            label={
              <>
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className={link}>
                  개인정보 수집·이용
                </a>
                에 동의해요
              </>
            }
          >
            <Details title={CONSENT_ITEMS.privacy.title} rows={CONSENT_ITEMS.privacy.rows} />
          </Row>
          <Row checked={checks.sensitive} onToggle={() => toggle('sensitive')} label={<>건강 관련 정보(알레르기 테스트·반응, 섭취 기록) 수집·이용에 동의해요</>}>
            <Details title={CONSENT_ITEMS.sensitive.title} rows={CONSENT_ITEMS.sensitive.rows} />
          </Row>
          <Row checked={checks.guardian} onToggle={() => toggle('guardian')} label={<>만 14세 이상이고, 아기의 보호자로서 아기 정보를 직접 입력해요</>} />
        </section>

        <p role="note" className="m-0 rounded-2xl bg-card px-4 py-3 text-[13px] leading-[1.65] text-sub">
          맘마의 식단·알레르기 안내는 참고용이에요. 새 재료나 알레르기 재료를 시작하기 전에는 소아청소년과와 상의해 주세요. 두드러기, 구토, 숨쉬기 힘든 모습이 보이면 바로 병원에 가 주세요.
        </p>

        {error && (
          <p role="alert" className="m-0 rounded-xl bg-urgent-bg p-3 text-center text-[13px] font-medium text-urgent-ink">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={agree}
            disabled={!all || busy}
            className="h-12 rounded-3xl border-none bg-ink text-[15px] font-bold text-white disabled:opacity-40"
          >
            {busy ? '처리하는 중…' : '동의하고 계속하기'}
          </button>
          <button type="button" onClick={decline} disabled={busy} className="min-h-11 rounded-3xl border border-line bg-card text-[13px] font-semibold text-sub disabled:opacity-60">
            {isNewSignup ? '동의하지 않아요 (가입 취소)' : '동의하지 않아요 (로그아웃)'}
          </button>
          <p className="m-0 text-center text-xs leading-relaxed text-sub">
            {isNewSignup ? '가입을 취소하면 만들어진 계정 정보가 바로 삭제돼요.' : '동의하지 않으면 로그아웃돼요. 기록은 그대로 남아 있어요.'}
            {user?.email ? ` (${user.email})` : ''}
          </p>
        </div>
      </main>
    </div>
  )
}
