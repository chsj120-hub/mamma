import { useMemo, useRef, useState } from 'react'
import { applyCsv, checkCsv, CSV_COLUMNS, decodeCsv, downloadTemplate, MAX_CSV_BYTES, parseCsv, type CsvCheck, type ImportMode } from '../../lib/csv'
import { useAppData } from '../../lib/data'
import { DOW_KO, dowOf, md, todayKey } from '../../lib/date'
import { ingredientName } from '../../lib/ingredients'
import { mealItems, mealSlots, SLOTS, slotOptions, sortMeals } from '../../lib/meal'
import { Sheet } from '../Sheet'

const MAX_SHOWN_ISSUES = 30
const MAX_SHOWN_DAYS = 12

type Loaded = { fileName: string; check: CsvCheck } | { fileName: string; fatal: string }

type Props = {
  onClose: () => void
  /** 입력 후 안내 문구를 화면에 띄우려고 */
  onDone: (message: string) => void
}

/** PC: CSV 파일로 식단 일괄 입력. 예시 내려받기 → 채워서 올리기 → 검사 결과 확인 → 입력(실행취소 가능) */
export function CsvImportDialog({ onClose, onDone }: Props) {
  const { plans, commitPlans, profile } = useAppData()
  const today = todayKey()
  const fileRef = useRef<HTMLInputElement>(null)
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [mode, setMode] = useState<ImportMode>('skip')
  const [busy, setBusy] = useState(false)

  const check = loaded && 'check' in loaded ? loaded.check : null
  const result = useMemo(() => (check ? applyCsv(plans, check, mode) : null), [plans, check, mode])

  const pick = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    try {
      if (file.size > MAX_CSV_BYTES) return setLoaded({ fileName: file.name, fatal: '파일이 너무 커요 (1MB 이하). 나눠서 올려 주세요.' })
      if (!/\.(csv|txt)$/i.test(file.name)) return setLoaded({ fileName: file.name, fatal: 'CSV 파일(.csv)만 올릴 수 있어요. 엑셀에서 "CSV UTF-8" 또는 "CSV"로 저장해 주세요.' })
      const rows = parseCsv(decodeCsv(await file.arrayBuffer()))
      const slots = mealSlots(profile)
      setLoaded({ fileName: file.name, check: checkCsv(rows, today, (label) => slots.find((x) => x.label === label)?.time) })
    } catch {
      setLoaded({ fileName: file.name, fatal: '파일을 읽지 못했어요. 예시 파일 형식인지 확인해 주세요.' })
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const importNow = () => {
    if (!result || result.days === 0) return
    commitPlans(result.plans, `CSV 가져오기 · ${result.days}일 ${result.meals}끼`)
    onDone(`CSV에서 ${result.days}일 ${result.meals}끼를 입력했어요. 실행취소로 되돌릴 수 있어요.`)
    onClose()
  }

  const dayRows = check ? [...check.days].sort(([a], [b]) => a.localeCompare(b)) : []

  return (
    <Sheet
      open
      wide
      title="CSV로 식단 입력"
      onClose={onClose}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-sub" aria-live="polite">
            {result ? (result.days > 0 ? `${result.days}일 ${result.meals}끼를 넣어요` : '넣을 수 있는 날이 없어요') : '파일을 올리면 검사 결과가 나와요'}
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="h-12 rounded-3xl border border-line bg-card px-5 text-sm font-semibold">
              닫기
            </button>
            <button type="button" disabled={!result || result.days === 0} onClick={importNow} className="h-12 rounded-3xl border-none bg-ink px-6 text-[15px] font-bold text-white disabled:opacity-40">
              {result && result.days > 0 ? `${result.days}일 입력하기` : '입력하기'}
            </button>
          </div>
        </div>
      }
    >
      <ol className="m-0 flex list-none flex-col gap-3 p-0">
        <li className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-4">
          <b className="text-sm">① 예시 파일 내려받기</b>
          <p className="m-0 text-xs leading-relaxed text-sub">
            예시에 한 줄에 한 끼씩 적혀 있어요. 같은 날짜를 여러 줄에 적으면 그날의 여러 끼니가 돼요. 엑셀·구글 시트에서 열어 내용만 바꿔 쓰세요. 첫 줄(머리글)은 그대로 두세요.
          </p>
          <button type="button" onClick={() => downloadTemplate(today)} className="h-11 self-start rounded-[14px] border border-line bg-bg px-4 text-sm font-semibold text-ink">
            예시 CSV 내려받기
          </button>
          <details className="text-xs text-sub">
            <summary className="cursor-pointer py-1 font-semibold">열 설명과 넣을 수 있는 재료 이름</summary>
            <ul className="m-0 mt-1 flex list-none flex-col gap-1.5 p-0">
              {CSV_COLUMNS.map((c) => (
                <li key={c.key}>
                  <b className="text-text">{c.header}</b>{' '}
                  {'slot' in c ? slotOptions(SLOTS.find((s) => s.key === c.slot)!.categories).map(ingredientName).join(', ') : c.note}
                </li>
              ))}
            </ul>
          </details>
        </li>

        <li className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-4">
          <b className="text-sm">② 채운 파일 올리기</b>
          <input ref={fileRef} type="file" accept=".csv,text/csv,.txt" className="sr-only" id="csv-file" onChange={(e) => pick(e.target.files?.[0])} />
          <label
            htmlFor="csv-file"
            className="flex h-11 w-fit cursor-pointer items-center rounded-[14px] border-none bg-ink px-4 text-sm font-bold text-white focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink"
          >
            {busy ? '읽는 중…' : loaded ? '다른 파일 고르기' : 'CSV 파일 고르기'}
          </label>
          {loaded && <span className="text-xs text-sub">{loaded.fileName}</span>}
          {loaded && 'fatal' in loaded && (
            <p role="alert" className="m-0 rounded-xl bg-urgent-bg p-3 text-[13px] font-medium text-urgent-ink">
              {loaded.fatal}
            </p>
          )}
        </li>

        {check && result && (
          <li className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4">
            <b className="text-sm">③ 검사 결과</b>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat label="읽은 줄" value={check.totalRows} />
              <Stat label="넣을 수 있는 날" value={check.days.size} tone="ok" />
              <Stat label="오류 줄" value={new Set(check.errors.map((e) => e.line)).size} tone={check.errors.length ? 'bad' : 'plain'} />
            </div>

            {check.days.size > 0 && (
              <fieldset className="m-0 flex flex-col gap-1.5 border-none p-0">
                <legend className="p-0 pb-1 text-[13px] font-semibold text-sub">이미 식단이 있는 날은?</legend>
                {(
                  [
                    ['skip', '건너뛰기 (기존 식단 유지)'],
                    ['replace', 'CSV 내용으로 바꾸기'],
                  ] as const
                ).map(([v, label]) => (
                  <label key={v} className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm">
                    <input type="radio" name="csv-mode" checked={mode === v} onChange={() => setMode(v)} className="size-5 accent-ink" />
                    {label}
                  </label>
                ))}
                {result.skippedExisting.length > 0 && <span className="text-xs text-sub">기존 식단이 있어 건너뛰는 날: {result.skippedExisting.map((d) => `${md(d).month}/${md(d).day}`).join(', ')}</span>}
              </fieldset>
            )}

            {check.errors.length > 0 && (
              <div role="alert" className="flex flex-col gap-1 rounded-xl bg-urgent-bg p-3">
                <b className="text-[13px] text-urgent-ink">고쳐야 할 곳 {check.errors.length}개 — 오류가 있는 줄의 날짜는 통째로 건너뛰어요</b>
                <ul className="m-0 flex list-none flex-col gap-0.5 p-0 text-xs text-urgent-sub">
                  {check.errors.slice(0, MAX_SHOWN_ISSUES).map((e, i) => (
                    <li key={i}>
                      <b>{e.line}번째 줄</b> · {e.message}
                    </li>
                  ))}
                  {check.errors.length > MAX_SHOWN_ISSUES && <li>… 외 {check.errors.length - MAX_SHOWN_ISSUES}개</li>}
                </ul>
                <span className="text-xs text-urgent-sub">줄 번호는 엑셀의 행 번호와 같아요. 고친 뒤 다시 올려 주세요.</span>
              </div>
            )}

            {check.warnings.length > 0 && (
              <ul className="m-0 flex list-none flex-col gap-0.5 rounded-xl bg-low-bg p-3 text-xs text-low">
                {check.warnings.slice(0, MAX_SHOWN_ISSUES).map((w, i) => (
                  <li key={i}>
                    {w.line > 0 && <b>{w.line}번째 줄 · </b>}
                    {w.message}
                  </li>
                ))}
              </ul>
            )}

            {dayRows.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-semibold text-sub">입력될 식단 미리보기</span>
                <div className="max-h-56 overflow-y-auto rounded-xl border border-line">
                  {dayRows.slice(0, MAX_SHOWN_DAYS).map(([date, rows]) => (
                    <div key={date} className="flex gap-3 border-b border-track px-3 py-2 text-xs last:border-b-0">
                      <b className="w-16 shrink-0">
                        {md(date).month}/{md(date).day} ({DOW_KO[dowOf(date)]})
                      </b>
                      <div className="flex flex-1 flex-col gap-0.5">
                        {sortMeals(rows.map((r) => r.meal)).map((m) => (
                          <span key={m.id}>
                            <span className="text-sub">{m.label}</span> {mealItems(m).filter((id) => id !== m.base).map(ingredientName).join(' · ') || '재료 없음'}
                            {m.allergen && <span className="font-semibold text-allergy"> · {ingredientName(m.allergen)} 테스트</span>}
                            {m.status === 'done' && <span className="text-done"> · 완료</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {dayRows.length > MAX_SHOWN_DAYS && <div className="px-3 py-2 text-xs text-sub">… 외 {dayRows.length - MAX_SHOWN_DAYS}일</div>}
                </div>
              </div>
            )}
          </li>
        )}
      </ol>
    </Sheet>
  )
}

function Stat({ label, value, tone = 'plain' }: { label: string; value: number; tone?: 'plain' | 'ok' | 'bad' }) {
  const cls = tone === 'ok' ? 'bg-done-bg text-done' : tone === 'bad' ? 'bg-urgent-bg text-urgent-ink' : 'bg-bg'
  return (
    <div className={`flex flex-col rounded-xl px-2 py-2 ${cls}`}>
      <span className="font-display text-2xl">{value}</span>
      <span className="text-[11px]">{label}</span>
    </div>
  )
}
