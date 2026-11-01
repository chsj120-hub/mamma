import { useRef, useState } from 'react'
import { applyBackup, downloadBackup, lastBackupAt, parseBackup, type ParsedBackup } from '../lib/backup'
import { sendFeedback, type FeedbackKind } from '../lib/feedback'
import { inputCls } from './home/ProfileFields'
import { Sheet } from './Sheet'

const KINDS: { id: FeedbackKind; label: string }[] = [
  { id: 'bug', label: '오류 신고' },
  { id: 'idea', label: '이런 기능이 있으면' },
  { id: 'other', label: '그 밖의 문의' },
]

const KEY_NAME = { profile: '아기 프로필', mealPlans: '식단', cubes: '홈큐브', reactions: '알레르기 반응', milestones: '마일스톤', growth: '성장 기록' } as const

/** 내 기록 백업·복원과 문의하기 (프로필 수정 창) */
export function DataSection() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<Extract<ParsedBackup, { ok: true }> | null>(null)
  const [note, setNote] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const [asking, setAsking] = useState(false)
  const [lastBackup, setLastBackup] = useState(lastBackupAt)
  const backup = () => {
    downloadBackup()
    setLastBackup(lastBackupAt())
  }

  const pick = async (file: File | undefined) => {
    if (!file) return
    setNote(null)
    if (file.size > 5_000_000) return setNote({ tone: 'error', text: '파일이 너무 커요. 맘마에서 내려받은 백업 파일을 골라 주세요.' })
    const parsed = parseBackup(await file.text())
    if (!parsed.ok) return setNote({ tone: 'error', text: parsed.message })
    setPending(parsed)
  }

  const restore = () => {
    if (!pending) return
    applyBackup(pending.backup, pending.keys)
    setPending(null)
    setNote({ tone: 'ok', text: '기록을 가져왔어요.' })
  }

  const btn = 'min-h-11 rounded-[22px] border border-line bg-card px-4 text-[13px] font-semibold text-text'

  return (
    <section className="flex flex-col gap-2" aria-label="내 기록">
      <h3 className="m-0 text-[13px] font-semibold text-sub">내 기록</h3>
      <div className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-3.5">
        <p className="m-0 text-xs leading-[1.6] text-sub">기록을 파일로 내려받아 보관하거나, 다른 계정·기기로 옮길 때 쓸 수 있어요.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={backup} className={btn}>
            기록 내려받기
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className={btn}>
            백업 파일 가져오기
          </button>
          <button type="button" onClick={() => setAsking(true)} className={btn}>
            문의·오류 신고
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            void pick(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        <p className="m-0 text-xs text-sub">{lastBackup ? `마지막으로 내려받은 날: ${new Date(lastBackup).toLocaleDateString('ko-KR')}` : '아직 내려받은 적이 없어요. 한 번 받아 두면 안심이에요.'}</p>
        {note && (
          <p role={note.tone === 'error' ? 'alert' : 'status'} className={`m-0 text-xs font-medium ${note.tone === 'error' ? 'text-urgent' : 'text-sub'}`}>
            {note.text}
          </p>
        )}
      </div>

      <Sheet
        open={pending !== null}
        title="백업 파일 가져오기"
        onClose={() => setPending(null)}
        footer={
          <div className="flex gap-2">
            <button type="button" onClick={() => setPending(null)} className="h-12 flex-1 rounded-3xl border border-line bg-card text-[15px] font-semibold text-sub">
              취소
            </button>
            <button type="button" onClick={restore} className="h-12 flex-[2] rounded-3xl border-none bg-ink text-[15px] font-bold text-white">
              지금 기록 바꾸기
            </button>
          </div>
        }
      >
        {pending && (
          <>
            <p className="m-0 text-[15px] leading-[1.7]">
              {new Date(pending.backup.exportedAt).toLocaleDateString('ko-KR')}에 내려받은 백업이에요. 가져오면 같은 종류의 지금 기록이 <b>파일의 기록으로 바뀌어요</b>.
            </p>
            <p className="m-0 text-[13px] leading-[1.6] text-sub">
              바뀌는 항목: {pending.keys.map((k) => KEY_NAME[k]).join(' · ')}. 되돌리려면 먼저 지금 기록을 내려받아 두세요.
            </p>
          </>
        )}
      </Sheet>

      <FeedbackSheet open={asking} onClose={() => setAsking(false)} />
    </section>
  )
}

function FeedbackSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [kind, setKind] = useState<FeedbackKind>('bug')
  const [message, setMessage] = useState('')
  const [contact, setContact] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [errorText, setErrorText] = useState('')

  const close = () => {
    if (state === 'sending') return
    if (state === 'done') {
      setMessage('')
      setContact('')
    }
    setState('idle')
    onClose()
  }

  const send = async () => {
    if (!message.trim() || state === 'sending') return
    setState('sending')
    try {
      await sendFeedback(kind, message, contact)
      setState('done')
    } catch (e) {
      setErrorText(e instanceof Error ? e.message : '보내지 못했어요. 잠시 뒤 다시 시도해 주세요.')
      setState('error')
    }
  }

  return (
    <Sheet
      open={open}
      title="문의·오류 신고"
      onClose={close}
      footer={
        state === 'done' ? (
          <button type="button" onClick={close} className="h-12 w-full rounded-3xl border-none bg-ink text-[15px] font-bold text-white">
            닫기
          </button>
        ) : (
          <button type="button" onClick={send} disabled={!message.trim() || state === 'sending'} className="h-12 w-full rounded-3xl border-none bg-ink text-[15px] font-bold text-white disabled:opacity-40">
            {state === 'sending' ? '보내는 중…' : '보내기'}
          </button>
        )
      }
    >
      {state === 'done' ? (
        <p role="status" className="m-0 text-[15px] leading-[1.7]">
          보내 주셔서 고마워요. 확인하고 답이 필요하면 남겨 주신 이메일로 알려 드릴게요.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="종류">
            {KINDS.map((k) => (
              <button
                key={k.id}
                type="button"
                role="radio"
                aria-checked={kind === k.id}
                onClick={() => setKind(k.id)}
                className={`min-h-11 rounded-[22px] border px-4 text-[13px] font-semibold ${kind === k.id ? 'border-ink bg-ink text-white' : 'border-line bg-card text-text'}`}
              >
                {k.label}
              </button>
            ))}
          </div>
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
            내용
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
              rows={5}
              className={`${inputCls} h-auto py-3 font-normal`}
              placeholder="어떤 화면에서 어떤 일이 있었는지 적어 주세요"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold">
            답받을 이메일 (선택)
            <input value={contact} onChange={(e) => setContact(e.target.value.slice(0, 200))} type="email" className={`${inputCls} font-normal`} placeholder="없으면 비워 두세요" />
          </label>
          <p className="m-0 text-xs leading-[1.6] text-sub">아기 이름·생년월일 같은 정보는 함께 보내지지 않아요. 보낸 화면 주소와 브라우저 종류만 함께 전달돼요.</p>
          {state === 'error' && (
            <p role="alert" className="m-0 text-xs font-medium text-urgent">
              {errorText}
            </p>
          )}
        </>
      )}
    </Sheet>
  )
}
