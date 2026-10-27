import { useState, type ReactNode } from 'react'
import { CATEGORY_LABEL } from '../../components/cube/categories'
import { PrintDialog } from '../../components/print/PrintDialog'
import { CubeSheet } from '../../components/cube/CubeSheet'
import { CubeTable } from '../../components/desktop/CubeTable'
import { IngredientIcon } from '../../components/IngredientIcon'
import { cubesPlannedThisWeek, daysLeft, expiringCubes, LOW_STOCK_UNDER } from '../../lib/cube'
import { useAppData } from '../../lib/data'
import { todayKey } from '../../lib/date'
import { ingredientName, type IngredientId } from '../../lib/ingredients'
import { useStoredState } from '../../lib/storage'

const TABS = ['전체', '고기', '생선·해산물', '채소', '과일', '곡물', '기타'] as const

/** 탭 → 그 탭에 들어가는 분류 이름 (CATEGORY_LABEL 기준) */
const TAB_LABELS: Record<Exclude<Tab, '전체'>, string[]> = {
  고기: ['고기'],
  '생선·해산물': ['생선', '해산물'],
  채소: ['채소'],
  과일: ['과일'],
  곡물: ['곡물'],
  기타: ['달걀', '유제품', '콩', '견과', '씨앗', '기타'],
}
type Tab = (typeof TABS)[number]

type Editing = { kind: 'add' } | { kind: 'edit'; id: string } | null

function StatCard({ label, value, unit, note, tone }: { label: string; value: number; unit: string; note: string; tone: 'plain' | 'low' | 'urgent' }) {
  const cls = {
    plain: 'border-line bg-card',
    low: 'border-low-soft-line bg-low-bg text-low',
    urgent: 'border-urgent-line bg-urgent-bg text-urgent-ink',
  }[tone]
  return (
    <div className={`flex flex-col gap-1 rounded-[18px] border px-[18px] py-4 ${cls}`}>
      <span className={`text-[13px] ${tone === 'plain' ? 'text-sub' : ''}`}>{label}</span>
      <span className="font-display text-[34px] leading-tight">
        {value}
        <span className="text-base">{unit}</span>
      </span>
      <span className={`text-xs ${tone === 'plain' ? 'text-sub' : ''}`}>{note}</span>
    </div>
  )
}

const icon = (children: ReactNode, sw = 2) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
)

/** PC 홈큐브 보관함 (/cube) */
export function PcCubePage() {
  const { cubes, plans, addCube, updateCube, removeCube } = useAppData()
  const today = todayKey()
  const [tab, setTab] = useState<Tab>('전체')
  const [printing, setPrinting] = useState(false)
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Editing>(null)
  const [bought, setBought] = useStoredState<IngredientId[]>('shoppingChecked', [])

  const total = cubes.reduce((n, c) => n + c.count, 0)
  const kinds = new Set(cubes.filter((c) => c.count > 0).map((c) => c.ingredient)).size

  // 재료별 합계로 장보기 목록 (같은 재료를 여러 날 만들었어도 한 줄)
  const byIngredient = new Map<IngredientId, number>()
  for (const c of cubes) byIngredient.set(c.ingredient, (byIngredient.get(c.ingredient) ?? 0) + c.count)
  const shopping = [...byIngredient].filter(([, n]) => n < LOW_STOCK_UNDER).sort((a, b) => a[1] - b[1])

  const q = query.trim()
  const rows = cubes
    .filter((c) => tab === '전체' || TAB_LABELS[tab].includes(CATEGORY_LABEL[c.ingredient]))
    .filter((c) => !q || ingredientName(c.ingredient).includes(q))
    .sort((a, b) => daysLeft(a, today) - daysLeft(b, today))

  const editingCube = editing?.kind === 'edit' ? cubes.find((c) => c.id === editing.id) : undefined
  const toggleBought = (id: IngredientId) => setBought((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-sub">냉동 큐브 재고와 유통기한</span>
          <h1 className="m-0 font-display text-4xl font-normal">홈큐브 보관함</h1>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <button type="button" onClick={() => setPrinting(true)} className="flex h-11 items-center gap-2 rounded-[14px] border border-line bg-card px-4 text-sm font-semibold">
            {icon(
              <>
                <path d="M6 9V2h12v7" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </>,
            )}
            재고표 출력
          </button>
          <button type="button" onClick={() => setEditing({ kind: 'add' })} className="flex h-11 items-center gap-2 rounded-[14px] border-none bg-ink px-4 text-sm font-bold text-white">
            {icon(<path d="M12 5v14M5 12h14" />, 2.5)}
            큐브 추가
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
        <StatCard label="보관 중인 큐브" value={total} unit="개" note={`${kinds}종 재료`} tone="plain" />
        <StatCard label="재고 부족 (2개 미만)" value={cubes.filter((c) => c.count < LOW_STOCK_UNDER).length} unit="종" note="장보기 목록에 자동 추가" tone="low" />
        <StatCard label="기한 임박 (3일 이내)" value={expiringCubes(cubes, today).length} unit="종" note="이번 주 식단에 우선 배치" tone="urgent" />
        <StatCard label="이번 주 사용 예정" value={cubesPlannedThisWeek(plans, cubes, today)} unit="개" note="주간 식단 기준" tone="plain" />
      </div>

      <div className="flex flex-wrap items-start gap-5">
        <section aria-label="재고 표" className="flex min-w-0 flex-[3_1_640px] flex-col gap-3.5 rounded-[22px] border border-line bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div role="group" aria-label="재료 분류" className="flex flex-wrap gap-1.5">
              {TABS.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={tab === t}
                  onClick={() => setTab(t)}
                  className={`h-10 rounded-[20px] border px-4 text-[13px] font-semibold ${tab === t ? 'border-text bg-text text-white' : 'border-line bg-card'}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <label className="flex h-10 min-w-[200px] items-center gap-2 rounded-xl border border-line bg-bg px-3 focus-within:border-ink">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="shrink-0 text-muted">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
              <span className="sr-only">재료 검색</span>
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="재료 검색" className="w-full border-none bg-transparent text-sm text-text outline-none" />
            </label>
          </div>

          {rows.length === 0 ? (
            <p className="m-0 rounded-2xl bg-bg p-8 text-center text-sm text-sub">
              {cubes.length === 0 ? '아직 보관 중인 큐브가 없어요. 큐브 추가를 눌러 주세요.' : q ? `'${q}'에 맞는 큐브가 없어요.` : '이 분류에는 큐브가 없어요.'}
            </p>
          ) : (
            <CubeTable cubes={rows} today={today} onCount={(id, count) => updateCube(id, { count })} onEdit={(id) => setEditing({ kind: 'edit', id })} />
          )}
        </section>

        <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-5">
          <section className="flex flex-col gap-2.5 rounded-[22px] border border-line bg-card p-[18px]">
            <h2 className="m-0 text-[17px] font-bold">장보기 · 만들 큐브</h2>
            {shopping.length === 0 ? (
              <span className="text-[13px] text-sub">부족한 재료가 없어요.</span>
            ) : (
              <ul className="m-0 flex list-none flex-col p-0">
                {shopping.map(([id, n]) => {
                  const done = bought.includes(id)
                  return (
                    <li key={id}>
                      <label className="flex min-h-11 cursor-pointer items-center gap-2.5 border-b border-track text-sm">
                        <input type="checkbox" checked={done} onChange={() => toggleBought(id)} className="m-0 size-5 shrink-0 accent-done" />
                        <IngredientIcon id={id} size={24} />
                        <span className={`flex-1 font-semibold ${done ? 'text-muted line-through' : ''}`}>{ingredientName(id)}</span>
                        <span className="text-xs text-low">남은 {n}개</span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className="flex flex-col gap-2.5 rounded-[22px] border border-line bg-card p-[18px]">
            <h2 className="m-0 text-[17px] font-bold">권장 보관 기간</h2>
            <div className="flex justify-between border-b border-track py-1.5 text-sm">
              <span>고기·생선</span>
              <span className="font-bold">21일</span>
            </div>
            <div className="flex justify-between border-b border-track py-1.5 text-sm">
              <span>채소·과일·곡물</span>
              <span className="font-bold">14일</span>
            </div>
            <span className="text-xs leading-normal text-sub">직접 만든 큐브 기준이에요. 시판 큐브는 포장에 적힌 소비기한을 따라요. 기한 3일 이내 큐브는 상단 알림과 대시보드에 표시돼요. 해동한 큐브는 다시 얼리지 마세요.</span>
          </section>
        </div>
      </div>

      {editing?.kind === 'add' && (
        <CubeSheet
          onClose={() => setEditing(null)}
          onSave={(c) => {
            addCube(c)
            // 다시 만들었으면 장보기 체크는 풀어 둔다
            setBought((prev) => prev.filter((x) => x !== c.ingredient))
            setEditing(null)
          }}
        />
      )}
      {editingCube && (
        <CubeSheet
          key={editingCube.id}
          cube={editingCube}
          onClose={() => setEditing(null)}
          onSave={(c) => {
            updateCube(editingCube.id, c)
            setEditing(null)
          }}
          onDelete={() => {
            removeCube(editingCube.id)
            setEditing(null)
          }}
        />
      )}
      {printing && <PrintDialog initialKind={'cube'} onClose={() => setPrinting(false)} />}
    </div>
  )
}
