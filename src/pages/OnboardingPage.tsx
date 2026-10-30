import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { hasProblems, ProfileFields, profileProblems } from '../components/home/ProfileFields'
import { IngredientIcon } from '../components/IngredientIcon'
import { useAppData } from '../lib/data'
import { todayKey } from '../lib/date'
import { STAGE_RULES } from '../data/stageGuide'
import { load } from '../lib/storage'
import type { BabyProfile } from '../lib/types'

/** 가입 직후 아기 정보 입력. 로그인 없이 쓰던 프로필이 이어받아졌다면 그 값으로 미리 채운다 */
function initialDraft(): BabyProfile {
  const kept = load<BabyProfile | null>('profile', null)
  if (kept) return kept
  return { name: '', birthDate: '', stage: 'early', targetMl: 0, mealsPerDay: Math.min(3, Math.max(1, STAGE_RULES.early.mealsPerDay[0])) }
}

export function OnboardingPage() {
  const { user, completeOnboarding, signOutNow } = useAuth()
  const { setProfile } = useAppData()
  const today = todayKey()
  const [draft, setDraft] = useState(initialDraft)
  const [tried, setTried] = useState(false)
  const [saving, setSaving] = useState(false)
  const invalid = hasProblems(profileProblems(draft, today))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setTried(true)
    if (invalid || saving) return
    setSaving(true)
    setProfile({ ...draft, name: draft.name.trim() })
    await completeOnboarding()
  }

  // 이유식 단계가 바뀌면 그 단계의 하루 횟수(질병관리청 기준표)를 기본값으로 맞춘다
  const onChange = (next: BabyProfile) => {
    const stageChanged = next.stage !== draft.stage
    const mealsPerDay = stageChanged ? Math.min(3, Math.max(1, STAGE_RULES[next.stage].mealsPerDay[0])) : next.mealsPerDay
    setDraft({ ...next, mealsPerDay })
  }

  return (
    <div className="flex min-h-dvh flex-col items-center bg-soft px-5 py-8">
      <main className="flex w-full max-w-[480px] flex-col gap-5">
        <div className="flex items-center gap-2" aria-hidden="true">
          <IngredientIcon id="rice" size={32} />
          <IngredientIcon id="carrot" size={32} />
          <IngredientIcon id="apple" size={32} />
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 font-display text-[32px] leading-tight font-normal">우리 아기를 알려 주세요</h1>
          <p className="m-0 text-[15px] leading-relaxed text-sub">월령에 맞는 이유식 단계와 D-Day를 계산하는 데만 써요. 나중에 프로필에서 바꿀 수 있어요.</p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-5 rounded-3xl bg-card p-5 shadow-[0_10px_30px_rgba(146,64,14,0.08)]" noValidate>
          <ProfileFields draft={draft} onChange={onChange} today={today} autoStage showErrors={tried} />
          <p className="m-0 text-xs leading-relaxed text-sub">1회 목표량은 소아청소년과나 보건소에서 안내받은 양을 적어 주세요.</p>
          <button type="submit" disabled={saving} className="h-12 rounded-3xl border-none bg-ink text-[15px] font-bold text-white disabled:opacity-60">
            {saving ? '저장하는 중…' : '시작하기'}
          </button>
        </form>

        <p className="m-0 text-center text-xs text-sub">
          {user?.displayName} 계정으로 가입 중이에요 ·{' '}
          <button type="button" onClick={signOutNow} className="inline h-11 border-none bg-transparent p-0 text-xs font-semibold text-ink underline">
            다른 계정으로 시작하기
          </button>
        </p>
      </main>
    </div>
  )
}
