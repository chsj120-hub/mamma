import { useState } from 'react'
import { PROVIDER_NAME } from '../auth'
import { useAuth, type SyncStatus } from '../auth/AuthProvider'
import { DeleteAccountSheet } from './DeleteAccountSheet'
import { LegalLinks } from './LegalLinks'

const STATUS_TEXT: Record<SyncStatus, string> = {
  off: '',
  idle: '',
  saving: '서버에 저장하는 중…',
  saved: '서버에 저장됨',
  error: '서버에 저장하지 못했어요',
}

/** 로그인한 계정과 로그아웃 (모바일: 프로필 수정 창, PC: 같은 창 + 사이드 메뉴 프로필 카드) */
export function AccountSection() {
  const { user, syncStatus, syncError, signOutNow } = useAuth()
  const [deleting, setDeleting] = useState(false)
  if (!user) return null

  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-3.5" aria-label="계정">
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-full bg-soft font-display text-ink" aria-hidden="true">
          {user.displayName.slice(0, 1)}
        </span>
        <span className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate text-[13px] font-bold">{user.displayName}</span>
          <span className="truncate text-xs text-sub">
            {PROVIDER_NAME[user.provider]} 계정{user.email ? ` · ${user.email}` : ''}
          </span>
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span role="status" aria-live="polite" className={`text-xs font-medium ${syncStatus === 'error' ? 'text-urgent' : 'text-sub'}`}>
          {STATUS_TEXT[syncStatus]}
        </span>
        <button type="button" onClick={signOutNow} className="h-11 rounded-[22px] border border-line bg-card px-4 text-[13px] font-semibold text-sub">
          로그아웃
        </button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-3 border-t border-line pt-1 text-xs text-sub">
        <LegalLinks />
        <button type="button" onClick={() => setDeleting(true)} className="min-h-11 border-none bg-transparent p-0 text-xs font-semibold text-urgent-ink underline">
          회원 탈퇴
        </button>
      </div>
      <DeleteAccountSheet open={deleting} onClose={() => setDeleting(false)} />
      {syncStatus === 'error' && syncError && (
        <p role="alert" className="m-0 text-xs text-urgent">
          {syncError}
        </p>
      )}
    </section>
  )
}
