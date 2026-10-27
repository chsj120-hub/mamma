import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { todayKey } from '../../lib/date'
import {
  hasRange,
  OPTION_FOR,
  PAGE_MM,
  periodStart,
  PRINT_KINDS,
  PX_PER_MM,
  rangeChoices,
  type PrintKind,
  type PrintOptions,
  type PrintSettings,
} from '../../lib/print'
import { useStoredState } from '../../lib/storage'
import { PrintDocument } from './PrintDocument'

const OPTION_LABELS: Record<keyof PrintOptions, { name: string; sub: string }> = {
  icons: { name: '재료 아이콘', sub: '흑백 출력 시 회색' },
  allergen: { name: '알레르기 테스트 표시', sub: '' },
  shopping: { name: '장보기 목록', sub: '재고 부족 큐브' },
  memo: { name: '메모 칸', sub: '손으로 적는 공간' },
}

const DEFAULTS: Omit<PrintSettings, 'kind'> = {
  range: 'current',
  customDate: '',
  options: { icons: true, allergen: true, shopping: true, memo: true },
  paper: 'landscape',
  mono: false,
}

/** 저장 키. 기본 용지를 가로로 바꾸면서 v2로 올림 (예전 '세로' 저장값을 쓰지 않도록) */
const STORE_KEY = 'printSettings.v2'

/** 프린터·브라우저마다 생기는 반올림 오차를 감안해 한 장 높이의 97%까지만 채운다 */
const FIT_SAFETY = 0.97

/** 미리보기 종이 폭(px) */
const PREVIEW_W = { portrait: 340, landscape: 440 }

type Props = {
  /** 처음 고를 출력 종류 (연 화면에 맞춰) */
  initialKind: PrintKind
  onClose: () => void
}

/** PC 출력 모달: 종류·기간·항목·용지·색상을 고르고, 실제 인쇄 문서를 축소해 미리 보여 준다 */
export function PrintDialog({ initialKind, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const today = todayKey()
  const [saved, setSaved] = useStoredState<Omit<PrintSettings, 'kind'>>(STORE_KEY, DEFAULTS)
  const [kind, setKind] = useState<PrintKind>(initialKind)
  /** 한 장에 맞추는 축소 비율 (1 = 100%) */
  const [fit, setFit] = useState(1)
  const [pdfHint, setPdfHint] = useState(false)
  const settings: PrintSettings = { ...DEFAULTS, ...saved, options: { ...DEFAULTS.options, ...saved.options }, kind }
  const set = (patch: Partial<Omit<PrintSettings, 'kind'>>) => setSaved((s) => ({ ...s, ...patch }))

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  const page = PAGE_MM[settings.paper]
  const scale = PREVIEW_W[settings.paper] / (page.w * PX_PER_MM)

  // 숨겨 둔 원래 크기 문서를 재서, 가로·세로 모두 A4 한 장 안에 들어가는 비율을 구한다
  useLayoutEffect(() => {
    const measure = () => {
      const el = measureRef.current
      if (!el) return
      const fitH = (page.h * PX_PER_MM * FIT_SAFETY) / el.scrollHeight
      const fitW = (page.w * PX_PER_MM) / el.scrollWidth
      const next = Math.min(1, fitH, fitW)
      setFit((prev) => (Math.abs(prev - next) > 0.005 ? next : prev))
    }
    measure()
    // 웹폰트가 늦게 로드되면 글자 폭이 바뀌니 한 번 더 잰다
    document.fonts?.ready.then(measure)
  })

  const print = () => window.print()
  const allowed = OPTION_FOR[kind]
  const start = periodStart(kind, settings.range, settings.customDate, today)

  const seg = (on: boolean) => `h-9 rounded-[18px] border-none px-4 text-[13px] font-bold ${on ? 'bg-card text-ink' : 'bg-transparent text-muted'}`
  // zoom은 레이아웃 크기 자체를 줄여서, 인쇄할 때 다음 장으로 넘치지 않는다
  const fitStyle: CSSProperties = { zoom: fit, width: `${page.w / fit}mm`, minHeight: `${(page.h * FIT_SAFETY) / fit}mm` }

  return (
    <>
      <dialog
        ref={ref}
        onClose={onClose}
        onClick={(e) => e.target === ref.current && onClose()}
        aria-labelledby="print-title"
        className="m-auto w-[calc(100%-32px)] max-w-[980px] overflow-hidden rounded-[26px] border-none bg-card p-0 text-text shadow-[0_24px_64px_rgba(43,33,24,0.35)] backdrop:bg-[rgba(43,33,24,0.55)]"
      >
        <div className="flex max-h-[90dvh] flex-col">
          <div className="flex items-center justify-between border-b border-line px-[26px] py-[22px]">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-soft text-ink" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9V2h12v7" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
              </span>
              <h2 id="print-title" className="m-0 font-display text-[26px] font-normal">
                출력하기
              </h2>
            </div>
            <button type="button" onClick={onClose} aria-label="닫기" className="flex size-11 items-center justify-center rounded-full border border-line bg-card">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-wrap overflow-y-auto">
            <div className="flex min-w-0 flex-[1_1_400px] flex-col gap-[22px] px-[26px] py-[22px]">
              <fieldset className="m-0 flex flex-col gap-2.5 border-none p-0">
                <legend className="p-0 pb-2.5 text-sm font-bold">무엇을 출력할까요?</legend>
                <div className="grid grid-cols-2 gap-2">
                  {PRINT_KINDS.map((k) => (
                    <button
                      key={k.id}
                      type="button"
                      aria-pressed={kind === k.id}
                      onClick={() => setKind(k.id)}
                      className={`flex min-h-16 flex-col gap-0.5 rounded-[14px] border-2 px-3.5 py-2.5 text-left ${kind === k.id ? 'border-ink bg-soft' : 'border-line bg-card'}`}
                    >
                      <span className="text-sm font-bold">{k.name}</span>
                      <span className="text-xs text-sub">{k.sub}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="flex flex-col gap-2">
                <label htmlFor="print-range" className="text-sm font-bold">
                  기간
                </label>
                {hasRange(kind) ? (
                  <div className="flex flex-wrap gap-2">
                    <select
                      id="print-range"
                      value={settings.range}
                      onChange={(e) => set({ range: e.target.value as PrintSettings['range'] })}
                      className="h-11 min-w-[160px] rounded-xl border border-line bg-bg px-3 text-sm text-text"
                    >
                      {rangeChoices(kind).map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    {settings.range === 'custom' && (
                      <input
                        type={kind === 'month' ? 'month' : 'date'}
                        aria-label={kind === 'month' ? '출력할 달' : '출력할 주의 날짜'}
                        value={kind === 'month' ? (settings.customDate || today).slice(0, 7) : settings.customDate || today}
                        onChange={(e) => set({ customDate: kind === 'month' ? `${e.target.value}-01` : e.target.value })}
                        className="h-11 rounded-xl border border-line bg-bg px-3 text-sm text-text"
                      />
                    )}
                  </div>
                ) : (
                  <span id="print-range" className="flex h-11 items-center rounded-xl border border-line bg-bg px-3 text-sm text-sub">
                    {kind === 'cube' ? '오늘 기준 재고' : '전체 단계 · 오늘 기준'}
                  </span>
                )}
                {hasRange(kind) && <span className="text-xs text-sub">시작일 {start.replaceAll('-', '.')}</span>}
              </div>

              <fieldset className="m-0 flex flex-col gap-1 border-none p-0">
                <legend className="p-0 pb-2 text-sm font-bold">포함할 항목</legend>
                {(Object.keys(OPTION_LABELS) as (keyof PrintOptions)[]).map((key) => {
                  const ok = allowed.includes(key)
                  return (
                    <label key={key} className={`flex min-h-11 items-center gap-3 text-sm ${ok ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'}`}>
                      <input
                        type="checkbox"
                        disabled={!ok}
                        checked={ok && settings.options[key]}
                        onChange={() => set({ options: { ...settings.options, [key]: !settings.options[key] } })}
                        className="m-0 size-5 accent-ink"
                      />
                      <span className="flex-1">{OPTION_LABELS[key].name}</span>
                      <span className="text-xs text-sub">{OPTION_LABELS[key].sub}</span>
                    </label>
                  )
                })}
              </fieldset>

              <div className="flex flex-wrap gap-5">
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-bold" id="paper-label">
                    용지 방향
                  </span>
                  <div role="group" aria-labelledby="paper-label" className="flex rounded-[22px] bg-track p-1">
                    <button type="button" aria-pressed={settings.paper === 'portrait'} onClick={() => set({ paper: 'portrait' })} className={seg(settings.paper === 'portrait')}>
                      세로
                    </button>
                    <button type="button" aria-pressed={settings.paper === 'landscape'} onClick={() => set({ paper: 'landscape' })} className={seg(settings.paper === 'landscape')}>
                      가로
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-bold" id="color-label">
                    색상
                  </span>
                  <div role="group" aria-labelledby="color-label" className="flex rounded-[22px] bg-track p-1">
                    <button type="button" aria-pressed={!settings.mono} onClick={() => set({ mono: false })} className={seg(!settings.mono)}>
                      컬러
                    </button>
                    <button type="button" aria-pressed={settings.mono} onClick={() => set({ mono: true })} className={seg(settings.mono)}>
                      흑백
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex min-w-0 flex-[1_1_380px] flex-col items-center gap-3 bg-[#F7F1E8] px-[26px] py-[22px]">
              <span className="self-start text-[13px] font-semibold text-sub" aria-live="polite">
                미리보기 · A4 {settings.paper === 'portrait' ? '세로' : '가로'} 한 장{fit < 0.995 ? ` · ${Math.round(fit * 100)}%로 축소` : ''}
              </span>
              <div
                role="img"
                aria-label="출력 미리보기"
                className="overflow-hidden bg-white shadow-[0_6px_20px_rgba(43,33,24,0.18)]"
                style={{ width: PREVIEW_W[settings.paper], height: page.h * PX_PER_MM * scale + 24 * scale * PX_PER_MM, filter: settings.mono ? 'grayscale(1)' : undefined }}
              >
                {/* 실제 출력물(여백 12mm 포함)을 그대로 축소 */}
                <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', padding: '12mm', width: `${page.w + 24}mm` }}>
                  <div style={fitStyle} className="flex flex-col">
                    <PrintDocument settings={settings} today={today} />
                  </div>
                </div>
              </div>
              {pdfHint && (
                <p className="m-0 rounded-xl bg-card px-3 py-2 text-xs leading-relaxed text-sub" role="status">
                  인쇄 창의 <b>대상(프린터)</b>에서 <b>'PDF로 저장'</b>을 고르면 파일로 저장돼요.
                </p>
              )}
            </div>
          </div>

          {/* 측정용: 원래 크기(축소 전) 문서. 화면에 보이지 않음 */}
          <div aria-hidden="true" className="pointer-events-none invisible fixed top-0 -left-[9999px]">
            <div ref={measureRef} style={{ width: `${page.w}mm` }} className="flex flex-col">
              <PrintDocument settings={settings} today={today} />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-[26px] py-[18px]">
            <button type="button" onClick={onClose} className="h-11 rounded-[14px] border border-line bg-card px-[18px] text-sm font-semibold">
              취소
            </button>
            <button
              type="button"
              onClick={() => {
                setPdfHint(true)
                // 안내 문구가 그려진 뒤 인쇄 창을 연다
                setTimeout(print, 50)
              }}
              className="flex h-11 items-center gap-2 rounded-[14px] border border-line bg-card px-[18px] text-sm font-semibold"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6M12 18v-6M9 15l3 3 3-3" />
              </svg>
              PDF로 저장
            </button>
            <button type="button" onClick={print} className="flex h-11 items-center gap-2 rounded-[14px] border-none bg-ink px-5 text-sm font-bold text-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 9V2h12v7" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              인쇄하기
            </button>
          </div>
        </div>
      </dialog>

      {/* 인쇄 전용: 화면에서는 숨기고, 인쇄할 때만 이 문서만 나온다 (index.css #print-root) */}
      {createPortal(
        <div id="print-root" style={{ filter: settings.mono ? 'grayscale(1)' : undefined }}>
          <style>{`@page { size: A4 ${settings.paper}; margin: 12mm; }`}</style>
          <div style={fitStyle} className="flex flex-col">
            <PrintDocument settings={settings} today={today} />
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
