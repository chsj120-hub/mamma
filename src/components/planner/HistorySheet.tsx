import type { Snapshot } from '../../lib/data'
import { koreanTime, md, todayKey } from '../../lib/date'
import { Sheet } from '../Sheet'

type Props = {
  snapshots: Snapshot[]
  onRestore: (id: string) => void
  onClose: () => void
}

function when(at: number) {
  const d = new Date(at)
  const key = todayKey(d)
  const time = koreanTime(`${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`)
  return key === todayKey() ? `오늘 ${time}` : `${md(key).month}월 ${md(key).day}일 ${time}`
}

/** 실행 취소: 최근 편집 기록을 보여 주고, 고른 작업 직전 상태로 되돌린다 */
export function HistorySheet({ snapshots, onRestore, onClose }: Props) {
  return (
    <Sheet open title="실행 취소" onClose={onClose}>
      {snapshots.length === 0 ? (
        <p className="m-0 rounded-2xl bg-card p-6 text-center text-sm text-sub">아직 되돌릴 작업이 없어요.</p>
      ) : (
        <>
          <p className="m-0 text-[13px] leading-relaxed text-sub">작업을 고르면 그 작업을 하기 직전으로 돌아가요. 그 뒤에 한 작업도 함께 취소돼요.</p>
          <ol className="m-0 flex list-none flex-col gap-2 p-0">
            {snapshots.map((s, i) => (
              <li key={s.id} className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3">
                <span className={`size-2.5 shrink-0 rounded-full ${i === 0 ? 'bg-accent' : 'bg-plan-dot'}`} aria-hidden="true" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-bold">{s.label}</span>
                  <span className="text-xs text-muted">{when(s.at)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onRestore(s.id)}
                  className="h-11 shrink-0 rounded-[22px] border-[1.5px] border-line bg-card px-3.5 text-[13px] font-bold text-ink"
                >
                  {i === 0 ? '취소하기' : '여기까지 취소'}
                </button>
              </li>
            ))}
          </ol>
        </>
      )}
    </Sheet>
  )
}
