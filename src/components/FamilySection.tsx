import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import type { FamilyMember } from '../auth/types'
import { inputCls } from './home/ProfileFields'
import { inviteLink } from '../lib/invite'
import { Sheet } from './Sheet'

/** 가족과 함께 쓰기: 초대 코드를 만들어 공동 양육자를 초대하거나, 받은 코드로 참여한다 (프로필 수정 창) */
export function FamilySection() {
  const { familyEnabled, inFamily, createInvite, listMembers, removeMember, joinFamily, leaveFamily } = useAuth()
  const [invite, setInvite] = useState<{ code: string; expiresAt: string } | null>(null)
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [code, setCode] = useState('')
  const [confirm, setConfirm] = useState<'join' | 'leave' | null>(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)

  const refresh = useCallback(async () => {
    try {
      setMembers(inFamily ? [] : await listMembers())
    } catch {
      setMembers([])
    }
  }, [inFamily, listMembers])

  useEffect(() => {
    void refresh()
  }, [refresh])

  if (!familyEnabled) return null

  const run = async (fn: () => Promise<{ ok: boolean; message?: string }>, done: string) => {
    setBusy(true)
    setNote(null)
    const r = await fn()
    setBusy(false)
    setConfirm(null)
    if (r.ok) setNote({ tone: 'ok', text: done })
    else setNote({ tone: 'error', text: r.message ?? '처리하지 못했어요.' })
    return r.ok
  }

  const make = async () => {
    setBusy(true)
    setNote(null)
    const r = await createInvite()
    setBusy(false)
    if (r.ok) setInvite({ code: r.code, expiresAt: r.expiresAt })
    else setNote({ tone: 'error', text: r.message })
  }

  const copy = async (text: string, done: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setNote({ tone: 'ok', text: done })
    } catch {
      setNote({ tone: 'error', text: '복사하지 못했어요. 직접 적어 전해 주세요.' })
    }
  }

  /** 휴대폰에서는 공유 창(카카오톡 등)으로 바로 보낸다. 지원하지 않는 브라우저는 복사로 대신한다 */
  const share = async () => {
    if (!invite) return
    const link = inviteLink(invite.code)
    if (typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches) {
      try {
        await navigator.share({ title: '맘마 가족 초대', text: '맘마에서 함께 이유식 식단을 관리해요.', url: link })
        return
      } catch (e) {
        if ((e as { name?: string }).name === 'AbortError') return
      }
    }
    await copy(link, '초대 링크를 복사했어요. 카카오톡 등으로 보내 주세요.')
  }

  const btn = 'min-h-11 rounded-[22px] border border-line bg-card px-4 text-[13px] font-semibold text-text disabled:opacity-50'

  return (
    <section className="flex flex-col gap-2" aria-label="가족과 함께 쓰기">
      <h3 className="m-0 text-[13px] font-semibold text-sub">가족과 함께 쓰기</h3>
      <div className="flex flex-col gap-2.5 rounded-2xl border border-line bg-card p-3.5">
        {inFamily ? (
          <>
            <p className="m-0 text-[13px] leading-[1.6]">초대받은 가족 기록을 함께 쓰는 중이에요. 식단·홈큐브·성장 기록이 모두 같이 보이고 바뀌어요.</p>
            <button type="button" disabled={busy} onClick={() => setConfirm('leave')} className={`${btn} self-start`}>
              가족 기록에서 나가기
            </button>
          </>
        ) : (
          <>
            <p className="m-0 text-xs leading-[1.6] text-sub">엄마·아빠·할머니처럼 함께 아기를 돌보는 분을 초대하면 같은 식단과 큐브 재고를 같이 보고 고칠 수 있어요. 초대받은 분도 맘마에 로그인해야 해요.</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={make} className={btn}>
                초대 코드 만들기
              </button>
            </div>
            {invite && (
              <div className="flex flex-col gap-1.5 rounded-xl bg-bg p-3">
                <span className="text-xs text-sub">{new Date(invite.expiresAt).toLocaleDateString('ko-KR')}까지 쓸 수 있는 코드</span>
                <div className="flex items-center gap-2">
                  <b className="font-display text-2xl tracking-[0.12em]" aria-label={`초대 코드 ${invite.code.split('').join(' ')}`}>
                    {invite.code}
                  </b>
                  <button type="button" onClick={() => copy(invite.code, '코드를 복사했어요. 메신저로 보내 주세요.')} className={btn}>
                    코드 복사
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={share} className="min-h-11 rounded-[22px] border-none bg-ink px-4 text-[13px] font-bold text-white">
                    초대 링크 보내기
                  </button>
                </div>
                <span className="text-xs leading-relaxed text-sub">링크를 열면 로그인한 뒤 바로 참여 화면이 나와요. 링크나 코드를 아는 사람은 누구나 참여할 수 있으니 믿는 가족에게만 보내 주세요.</span>
              </div>
            )}
            {members.length > 0 && (
              <ul className="m-0 flex list-none flex-col p-0" aria-label="함께 쓰는 사람">
                {members.map((m) => (
                  <li key={m.uid} className="flex items-center gap-2 border-b border-track py-1.5 text-[13px]">
                    <span className="flex-1 truncate">
                      {m.name || '가족'} <span className="text-xs text-sub">· {new Date(m.joinedAt).toLocaleDateString('ko-KR')} 참여</span>
                    </span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={async () => {
                        if (await run(() => removeMember(m.uid), '내보냈어요.')) void refresh()
                      }}
                      className="min-h-11 border-none bg-transparent px-2 text-xs font-semibold text-urgent-ink underline"
                    >
                      내보내기
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20))}
                placeholder="받은 초대 코드"
                aria-label="받은 초대 코드"
                className={`${inputCls} min-w-0 flex-1 font-normal tracking-[0.1em]`}
              />
              <button type="button" disabled={busy || code.length < 8} onClick={() => setConfirm('join')} className={btn}>
                참여하기
              </button>
            </div>
          </>
        )}
        {note && (
          <p role={note.tone === 'error' ? 'alert' : 'status'} className={`m-0 text-xs font-medium ${note.tone === 'error' ? 'text-urgent' : 'text-sub'}`}>
            {note.text}
          </p>
        )}
      </div>

      <Sheet
        open={confirm !== null}
        title={confirm === 'join' ? '가족 기록에 참여' : '가족 기록에서 나가기'}
        onClose={() => !busy && setConfirm(null)}
        footer={
          <div className="flex gap-2">
            <button type="button" onClick={() => setConfirm(null)} disabled={busy} className="h-12 flex-1 rounded-3xl border border-line bg-card text-[15px] font-semibold text-sub">
              취소
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => (confirm === 'join' ? run(() => joinFamily(code), '참여했어요. 가족의 기록이 보여요.').then((ok) => ok && setCode('')) : run(leaveFamily, '내 기록으로 돌아왔어요.'))}
              className="h-12 flex-[2] rounded-3xl border-none bg-ink text-[15px] font-bold text-white disabled:opacity-60"
            >
              {busy ? '처리하는 중…' : confirm === 'join' ? '참여하기' : '나가기'}
            </button>
          </div>
        }
      >
        {confirm === 'join' ? (
          <>
            <p className="m-0 text-[15px] leading-[1.7]">참여하면 이 기기에 보이는 식단·홈큐브·성장 기록이 <b>초대한 분의 기록으로 바뀌어요</b>.</p>
            <p className="m-0 text-[13px] leading-[1.6] text-sub">내 예전 기록은 지워지지 않고 서버에 남아 있어요. 가족 기록에서 나가면 다시 보여요. 나중에 옮기고 싶다면 먼저 '기록 내려받기'로 파일을 받아 두세요.</p>
          </>
        ) : (
          <p className="m-0 text-[15px] leading-[1.7]">나가면 가족 기록은 더 이상 보이지 않고, 참여하기 전의 내 기록으로 돌아와요. 가족 기록은 초대한 분에게 그대로 남아요.</p>
        )}
      </Sheet>
    </section>
  )
}
