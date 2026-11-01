import { useEffect, useState } from 'react'
import { useAppData } from '../lib/data'
import { canNativeShare, copyImage, downloadBlob, renderWeekImage, shareOrDownload } from '../lib/shareImage'
import { Sheet } from './Sheet'

/** 이번 주 식단표를 이미지로 만들어 공유(휴대폰 공유 창) 또는 저장 (카카오톡·맘카페용). 아기 이름은 기본으로 빼 둔다 */
export function ShareWeekButton({ weekStart, className }: { weekStart: string; className: string }) {
  const { plans, profile } = useAppData()
  const [open, setOpen] = useState(false)
  const [withName, setWithName] = useState(false)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let off = false
    setBlob(null)
    setNote(null)
    renderWeekImage({ weekStart, plans, babyName: withName ? profile.name : undefined, siteUrl: location.host })
      .then((b) => {
        if (off) return
        setBlob(b)
        setPreview((old) => {
          if (old) URL.revokeObjectURL(old)
          return URL.createObjectURL(b)
        })
      })
      .catch(() => !off && setNote('이미지를 만들지 못했어요. 잠시 뒤 다시 시도해 주세요.'))
    return () => {
      off = true
    }
  }, [open, weekStart, plans, withName, profile.name])

  const fileName = `mamma-${weekStart}.png`

  const share = async () => {
    if (!blob) return
    const r = await shareOrDownload(blob, fileName, '이번 주 이유식 식단표')
    if (r === 'downloaded') setNote('공유 창을 열 수 없어서 이미지를 저장했어요.')
    if (r === 'shared') setOpen(false)
  }

  const copy = async () => {
    if (!blob) return
    setNote((await copyImage(blob)) ? '복사했어요. 카카오톡이나 카페 글쓰기 창에서 붙여넣기(Ctrl+V)해 주세요.' : '복사하지 못했어요. 이미지 저장을 눌러 파일로 올려 주세요.')
  }

  const save = () => {
    if (!blob) return
    downloadBlob(blob, fileName)
    setNote('이미지를 저장했어요. 카카오톡이나 카페에 파일로 올려 보세요.')
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        이미지로 공유
      </button>
      <Sheet
        open={open}
        title="식단표 이미지"
        onClose={() => setOpen(false)}
        footer={
          <div className="flex gap-2">
            <button type="button" onClick={save} disabled={!blob} className="h-12 flex-1 rounded-3xl border border-line bg-card text-[15px] font-semibold text-text disabled:opacity-40">
              이미지 저장
            </button>
            <button type="button" onClick={copy} disabled={!blob} className="h-12 flex-1 rounded-3xl border border-line bg-card text-[15px] font-semibold text-text disabled:opacity-40">
              복사
            </button>
            {canNativeShare() && (
              <button type="button" onClick={share} disabled={!blob} className="h-12 flex-1 rounded-3xl border-none bg-ink text-[15px] font-bold text-white disabled:opacity-40">
                공유하기
              </button>
            )}
          </div>
        }
      >
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px]">
          <input type="checkbox" checked={withName} onChange={(e) => setWithName(e.target.checked)} className="m-0 size-5 accent-ink" />
          제목에 아기 이름 넣기
        </label>
        {preview ? <img src={preview} alt="이번 주 식단표 미리보기" className="w-full rounded-xl border border-line" /> : <p className="m-0 text-sm text-sub">이미지를 만드는 중…</p>}
        {note && (
          <p role="status" className="m-0 text-[13px] font-medium text-sub">
            {note}
          </p>
        )}
        <p className="m-0 text-xs leading-relaxed text-sub">생년월일은 이미지에 들어가지 않아요. 이미지 아래에 사이트 주소가 함께 들어가요. 카카오톡으로는 '복사' 후 대화창에 붙여넣거나 저장한 파일을 보내 주세요.</p>
      </Sheet>
    </>
  )
}
