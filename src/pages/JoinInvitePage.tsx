import { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { IngredientIcon } from '../components/IngredientIcon'
import { clearPendingInvite } from '../lib/invite'

/**
 * 초대 링크로 들어온 사람에게 보여 주는 '가족 기록에 참여' 확인 화면.
 * 로그인과 약관 동의를 마친 뒤에 나온다. 새로 가입하는 사람은 아기 정보를 따로 적지 않아도 된다(초대한 분의 기록을 쓰니까).
 */
export function JoinInvitePage({ code, onDone }: { code: string; onDone: () => void }) {
  const { user, onboarded, inFamily, joinFamily } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const later = () => {
    clearPendingInvite()
    onDone()
  }

  const join = async () => {
    setBusy(true)
    setError(null)
    const r = await joinFamily(code)
    if (r.ok) {
      clearPendingInvite()
      onDone()
    } else {
      setError(r.message)
      setBusy(false)
    }
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
          <h1 className="m-0 font-display text-[32px] leading-tight font-normal">가족 기록에 초대받았어요</h1>
          <p className="m-0 text-[15px] leading-relaxed text-sub">{user?.displayName}님, 초대한 분과 같은 식단과 홈큐브, 성장 기록을 함께 보고 고칠 수 있어요.</p>
        </div>

        <section className="flex flex-col gap-2.5 rounded-3xl bg-card p-5 text-[14px] leading-[1.7] shadow-[0_10px_30px_rgba(146,64,14,0.08)]">
          {inFamily ? (
            <p className="m-0 font-semibold">이미 다른 가족 기록에 참여 중이에요. 다른 가족에 참여하려면 먼저 프로필 수정 → 가족과 함께 쓰기에서 나가 주세요.</p>
          ) : (
            <>
              <p className="m-0">
                참여하면 이 기기에 보이는 기록이 <b>초대한 분의 기록으로 바뀌어요</b>.
              </p>
              <p className="m-0 text-sub">{onboarded ? '이 계정에 있던 예전 기록은 지워지지 않고 서버에 남아요. 가족 기록에서 나가면 다시 보여요.' : '아기 정보는 따로 입력하지 않아도 돼요. 초대한 분의 기록을 그대로 써요.'}</p>
              <p className="m-0 text-sub">초대 링크를 보내 준 사람이 아는 가족인지 확인해 주세요. 참여하면 아기 이름·식단·알레르기 기록이 서로 보여요.</p>
            </>
          )}
        </section>

        {error && (
          <p role="alert" className="m-0 rounded-xl bg-urgent-bg p-3 text-center text-[13px] font-medium text-urgent-ink">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-2">
          {!inFamily && (
            <button type="button" onClick={join} disabled={busy} className="h-12 rounded-3xl border-none bg-ink text-[15px] font-bold text-white disabled:opacity-60">
              {busy ? '참여하는 중…' : '가족 기록에 참여하기'}
            </button>
          )}
          <button type="button" onClick={later} disabled={busy} className="min-h-11 rounded-3xl border border-line bg-card text-[13px] font-semibold text-sub disabled:opacity-60">
            {inFamily ? '닫기' : onboarded ? '지금은 참여하지 않을래요' : '참여하지 않고 내 아기 정보 입력하기'}
          </button>
        </div>
      </main>
    </div>
  )
}
