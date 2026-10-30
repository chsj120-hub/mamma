import { useEffect, useState, type FormEvent } from 'react'
import { todayKey } from '../../lib/date'
import type { BabyProfile } from '../../lib/types'
import { AccountSection } from '../AccountSection'
import { DataSection } from '../DataSection'
import { FamilySection } from '../FamilySection'
import { NotifySettings } from '../NotifySettings'
import { Sheet } from '../Sheet'
import { hasProblems, ProfileFields, profileProblems } from './ProfileFields'

// 다른 화면에서 import { inputCls } from '.../ProfileModal' 로 쓰던 것을 그대로 쓸 수 있게 다시 내보낸다
export { inputCls } from './ProfileFields'

type Props = {
  open: boolean
  profile: BabyProfile
  onSave: (p: BabyProfile) => void
  onClose: () => void
}

export function ProfileModal({ open, profile, onSave, onClose }: Props) {
  const [draft, setDraft] = useState(profile)

  useEffect(() => {
    if (open) setDraft(profile)
  }, [open, profile])

  const today = todayKey()
  const invalid = hasProblems(profileProblems(draft, today))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (invalid) return
    onSave({ ...draft, name: draft.name.trim() })
  }

  return (
    <Sheet
      open={open}
      title="아기 프로필"
      onClose={onClose}
      footer={
        <button type="submit" form="profile-form" disabled={invalid} className="h-12 w-full rounded-3xl border-none bg-ink text-[15px] font-bold text-white disabled:opacity-40">
          저장
        </button>
      }
    >
      <form id="profile-form" onSubmit={submit} className="flex flex-col gap-5">
        <ProfileFields draft={draft} onChange={setDraft} today={today} />

        <NotifySettings />

        <FamilySection />

        <DataSection />

        <section className="flex flex-col gap-2">
          <h3 className="m-0 text-[13px] font-semibold text-sub">계정</h3>
          <AccountSection />
        </section>
      </form>
    </Sheet>
  )
}
