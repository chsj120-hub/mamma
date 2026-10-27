import { useState } from 'react'
import { CubeCard } from '../components/cube/CubeCard'
import { CUBE_FILTERS, type CubeFilter } from '../components/cube/categories'
import { CubeSheet } from '../components/cube/CubeSheet'
import { daysLeft, expiringCubes, isLowStock } from '../lib/cube'
import { useAppData } from '../lib/data'
import { todayKey } from '../lib/date'
import { INGREDIENTS } from '../lib/ingredients'

type Editing = { kind: 'add' } | { kind: 'edit'; id: string } | null

export function CubePage() {
  const { cubes, addCube, updateCube, removeCube } = useAppData()
  const today = todayKey()
  const [filter, setFilter] = useState<CubeFilter>('all')
  const [editing, setEditing] = useState<Editing>(null)

  const total = cubes.reduce((n, c) => n + c.count, 0)
  const lowKinds = cubes.filter(isLowStock).length
  const expiringKinds = expiringCubes(cubes, today).length

  const visible = cubes
    .filter((c) => filter === 'all' || INGREDIENTS[c.ingredient].category === filter)
    .sort((a, b) => daysLeft(a, today) - daysLeft(b, today))

  const editingCube = editing?.kind === 'edit' ? cubes.find((c) => c.id === editing.id) : undefined

  return (
    <>
      <header className="flex items-center justify-between px-5 pt-5 pb-3">
        <h1 className="m-0 font-display text-[26px] font-normal">홈큐브 보관함</h1>
        <button
          type="button"
          onClick={() => setEditing({ kind: 'add' })}
          className="flex h-11 items-center gap-1.5 rounded-[22px] border-none bg-ink px-4 text-sm font-bold text-white"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          큐브 추가
        </button>
      </header>

      <main className="flex flex-col gap-3.5 px-5">
        <dl className="m-0 grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-0.5 rounded-2xl border border-line bg-card p-3">
            <dt className="text-xs text-muted">보관 중</dt>
            <dd className="m-0 font-display text-[26px]">
              {total}
              <span className="text-sm">개</span>
            </dd>
          </div>
          <div className="flex flex-col gap-0.5 rounded-2xl border border-low-soft-line bg-low-bg p-3">
            <dt className="text-xs text-low">재고 부족</dt>
            <dd className="m-0 font-display text-[26px] text-low">
              {lowKinds}
              <span className="text-sm">종</span>
            </dd>
          </div>
          <div className="flex flex-col gap-0.5 rounded-2xl border border-urgent-line bg-urgent-bg p-3">
            <dt className="text-xs text-urgent-ink">기한 임박</dt>
            <dd className="m-0 font-display text-[26px] text-urgent-ink">
              {expiringKinds}
              <span className="text-sm">종</span>
            </dd>
          </div>
        </dl>

        <div role="group" aria-label="재료 분류" className="flex flex-wrap gap-1.5">
          {CUBE_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`h-10 rounded-[20px] px-4 text-[13px] ${
                filter === f.id ? 'border-none bg-text font-bold text-white' : 'border border-line bg-card font-medium text-text'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="m-0 rounded-[18px] border border-dashed border-line bg-card p-6 text-center text-sm text-sub">
            {cubes.length === 0 ? '아직 보관 중인 큐브가 없어요. 오른쪽 위 큐브 추가를 눌러 주세요.' : '이 분류에는 큐브가 없어요.'}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {visible.map((c) => (
              <CubeCard key={c.id} cube={c} today={today} onOpen={() => setEditing({ kind: 'edit', id: c.id })} />
            ))}
          </div>
        )}

        <p className="m-0 px-1 pb-2 text-[11px] leading-relaxed text-muted">
          직접 만든 큐브는 냉동 보관 기준 고기·생선 21일, 그 외 14일이에요. 시판 큐브는 포장에 적힌 소비기한을 따라요. 해동한 큐브는 다시 얼리지 마세요.
        </p>
      </main>

      {editing?.kind === 'add' && (
        <CubeSheet
          onClose={() => setEditing(null)}
          onSave={(c) => {
            addCube(c)
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
    </>
  )
}
