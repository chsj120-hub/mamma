import { useState } from 'react'
import { qrDataUrl, shareApp, shareLink, type ShareSource } from '../lib/share'

type Props = {
  source: ShareSource
  /** 버튼 아래에 '휴대폰/PC에서 열기' QR 보기 버튼도 보여 줄지 (PC 화면용) */
  withQr?: boolean
  className?: string
}

/** 친구에게 맘마 추천하기. 공유 창 또는 링크 복사, 선택적으로 QR. 브라우저 전용 API는 눌렀을 때만 쓴다(정적 HTML 만들기에서도 그대로 쓰인다) */
export function ShareApp({ source, withQr = false, className = '' }: Props) {
  const [note, setNote] = useState<string | null>(null)
  const [qr, setQr] = useState<string | null>(null)
  const [qrOpen, setQrOpen] = useState(false)

  const share = async () => {
    const r = await shareApp(source)
    if (r === 'copied') setNote('링크를 복사했어요. 카카오톡이나 메시지에 붙여 넣어 보내 주세요.')
    else if (r === 'failed') setNote('복사하지 못했어요. 주소창의 주소를 직접 보내 주세요.')
    else setNote(null)
  }

  const toggleQr = async () => {
    if (qrOpen) return setQrOpen(false)
    try {
      if (!qr) setQr(await qrDataUrl(shareLink('qr')))
      setQrOpen(true)
    } catch {
      setNote('QR 코드를 만들지 못했어요. 링크 복사를 이용해 주세요.')
    }
  }

  const btn = 'inline-flex min-h-11 items-center justify-center rounded-[22px] border border-line bg-card px-4 text-[13px] font-semibold text-text'

  return (
    <div className={`flex flex-col items-start gap-2 ${className}`}>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void share()} className={btn}>
          친구에게 맘마 추천하기
        </button>
        {withQr && (
          <button type="button" aria-expanded={qrOpen} onClick={() => void toggleQr()} className={btn}>
            휴대폰에서 열기 (QR)
          </button>
        )}
      </div>
      {note && (
        <p role="status" className="m-0 text-xs leading-[1.6] text-sub">
          {note}
        </p>
      )}
      {qrOpen && qr && (
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3">
          <img src={qr} alt="맘마 주소 QR 코드" width={132} height={132} className="size-[132px]" />
          <p className="m-0 text-xs leading-[1.6] text-sub">휴대폰 카메라로 찍으면 바로 열려요. 같은 계정으로 로그인하면 기록이 이어져요.</p>
        </div>
      )}
    </div>
  )
}
