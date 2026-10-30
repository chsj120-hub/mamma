import { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { Sheet } from './Sheet'

/** 회원 탈퇴 확인 창. 서버 기록·계정·이 기기의 데이터를 모두 지우며 되돌릴 수 없다 */
export function DeleteAccountSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { deleteAccount } = useAuth()
  const [sure, setSure] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const close = () => {
    if (busy) return
    setSure(false)
    setError(null)
    onClose()
  }

  const run = async () => {
    if (!sure || busy) return
    setBusy(true)
    setError(null)
    const result = await deleteAccount()
    // 성공하면 로그인 화면으로 바뀌며 이 창도 함께 사라진다
    if (!result.ok) {
      setError(result.message)
      setBusy(false)
    }
  }

  return (
    <Sheet
      open={open}
      title="회원 탈퇴"
      onClose={close}
      footer={
        <div className="flex gap-2">
          <button type="button" onClick={close} disabled={busy} className="h-12 flex-1 rounded-3xl border border-line bg-card text-[15px] font-semibold text-sub disabled:opacity-60">
            취소
          </button>
          <button type="button" onClick={run} disabled={!sure || busy} className="h-12 flex-[2] rounded-3xl border-none bg-urgent-ink text-[15px] font-bold text-white disabled:opacity-40">
            {busy ? '삭제하는 중…' : '탈퇴하고 데이터 삭제'}
          </button>
        </div>
      }
    >
      <p className="m-0 text-[15px] leading-[1.7]">탈퇴하면 아래 정보가 모두 삭제되고 되돌릴 수 없어요.</p>
      <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5 text-[14px] leading-[1.7] text-sub">
        <li>계정 정보와 가입 기록</li>
        <li>아기 프로필, 식단, 홈큐브 재고</li>
        <li>알레르기 테스트·반응 기록, 마일스톤 체크</li>
        <li>이 기기에 저장된 데이터와 실행취소 기록</li>
      </ul>
      <p className="m-0 text-[13px] leading-[1.6] text-sub">남겨 두고 싶은 식단은 탈퇴 전에 출력(PDF)해 두세요. 구글 계정 확인 창이 한 번 나올 수 있어요.</p>
      <label className="flex min-h-11 cursor-pointer items-start gap-3 text-[15px] leading-snug">
        <input type="checkbox" checked={sure} onChange={(e) => setSure(e.target.checked)} className="m-0 mt-0.5 size-5 shrink-0 accent-ink" />
        모든 기록이 삭제되는 것을 확인했어요
      </label>
      {error && (
        <p role="alert" className="m-0 rounded-xl bg-urgent-bg p-3 text-[13px] font-medium text-urgent-ink">
          {error}
        </p>
      )}
    </Sheet>
  )
}
