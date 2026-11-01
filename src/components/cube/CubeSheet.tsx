import { useState } from 'react'
import { addDays, md, todayKey } from '../../lib/date'
import { INGREDIENT_IDS, ingredientName, shelfLifeDays, type IngredientId } from '../../lib/ingredients'
import type { Cube, CubeSource } from '../../lib/types'
import { inputCls } from '../home/ProfileModal'
import { IngredientIcon } from '../IngredientIcon'
import { Sheet } from '../Sheet'

type Props = {
  /** 없으면 새 큐브 추가 */
  cube?: Cube
  onSave: (c: Omit<Cube, 'id'>) => void
  onDelete?: () => void
  onClose: () => void
}

const MAX_COUNT = 99

/** 큐브 추가·수정 시트 */
export function CubeSheet({ cube, onSave, onDelete, onClose }: Props) {
  const today = todayKey()
  const [ingredient, setIngredient] = useState<IngredientId | null>(cube?.ingredient ?? null)
  const [count, setCount] = useState(cube?.count ?? 6)
  const [madeAt, setMadeAt] = useState(cube?.madeAt ?? today)
  const [source, setSource] = useState<CubeSource>(cube?.source ?? 'homemade')
  const [expiresOn, setExpiresOn] = useState(cube?.expiresOn ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const store = source === 'store'
  const madeInvalid = !madeAt || madeAt > today
  // 시판은 포장의 소비기한을 꼭 받는다 (구매일보다 앞설 수 없음)
  const expiryInvalid = store && (!expiresOn || expiresOn < madeAt)
  const canSave = ingredient !== null && !madeInvalid && !expiryInvalid && (cube ? true : count > 0)
  const expiry = ingredient && !madeInvalid ? addDays(madeAt, shelfLifeDays()) : null

  const stepBtn = 'flex size-11 items-center justify-center rounded-full border-[1.5px] border-line bg-card text-xl font-bold disabled:opacity-30'

  return (
    <Sheet
      open
      title={cube ? `${ingredientName(cube.ingredient)} 큐브` : '큐브 추가'}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          {onDelete && (
            <button
              type="button"
              onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
              className="h-12 rounded-3xl border-[1.5px] border-line bg-card px-4 text-sm font-bold text-urgent"
            >
              {confirmDelete ? '정말 삭제' : '삭제'}
            </button>
          )}
          <button
            type="button"
            disabled={!canSave}
            onClick={() => ingredient && onSave({ ingredient, count, madeAt, source, expiresOn: store ? expiresOn : undefined })}
            className="h-12 flex-1 rounded-3xl border-none bg-ink text-[15px] font-bold text-white disabled:opacity-40"
          >
            {cube ? '저장' : ingredient ? `${ingredientName(ingredient)} ${count}개 넣기` : '재료를 골라 주세요'}
          </button>
        </div>
      }
    >
      {!cube && (
        <section className="flex flex-col gap-2">
          <h3 className="m-0 text-[13px] font-semibold text-sub">재료</h3>
          <div role="listbox" aria-label="재료 고르기" className="grid grid-cols-4 gap-1.5">
            {INGREDIENT_IDS.map((id) => (
              <button
                key={id}
                type="button"
                role="option"
                aria-selected={ingredient === id}
                onClick={() => setIngredient(id)}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border-[1.5px] px-1 py-1.5 text-[11px] ${
                  ingredient === id ? 'border-ink bg-soft font-bold' : 'border-line bg-card'
                }`}
              >
                <IngredientIcon id={id} size={24} />
                {ingredientName(id)}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h3 className="m-0 text-[13px] font-semibold text-sub">수량</h3>
        <div className="flex items-center justify-between rounded-2xl border border-line bg-card p-2">
          <button type="button" aria-label="1개 빼기" disabled={count <= 0} onClick={() => setCount((n) => Math.max(0, n - 1))} className={stepBtn}>
            −
          </button>
          <span className="font-display text-[28px]" aria-live="polite">
            {count}
            <span className="text-base">개</span>
          </span>
          <button type="button" aria-label="1개 더하기" disabled={count >= MAX_COUNT} onClick={() => setCount((n) => Math.min(MAX_COUNT, n + 1))} className={stepBtn}>
            +
          </button>
        </div>
        {cube && count < 2 && <p className="m-0 text-xs font-semibold text-low">2개 미만이면 재고 부족으로 알려 드려요.</p>}
      </section>

      <fieldset className="m-0 flex flex-col gap-1.5 border-none p-0">
        <legend className="mb-1.5 p-0 text-[13px] font-semibold text-sub">큐브 종류</legend>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ['homemade', '직접 만듦', '제조일 + 권장 보관 기간'],
              ['store', '시판', '포장에 적힌 소비기한'],
            ] as const
          ).map(([v, label, desc]) => (
            <button
              key={v}
              type="button"
              aria-pressed={source === v}
              onClick={() => setSource(v)}
              className={`flex min-h-11 flex-col items-start rounded-[14px] border-[1.5px] px-3 py-2 text-left ${source === v ? 'border-ink bg-soft' : 'border-line bg-card'}`}
            >
              <span className="text-sm font-bold">{label}</span>
              <span className="text-xs text-sub">{desc}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-sub">
        {store ? '구매일' : '제조일'}
        <input type="date" className={inputCls} value={madeAt} max={today} onChange={(e) => setMadeAt(e.target.value)} />
        {madeInvalid ? (
          <span className="text-xs font-medium text-urgent">오늘 이전 날짜를 골라 주세요.</span>
        ) : (
          !store &&
          expiry &&
          ingredient && (
            <span className="text-xs font-medium text-muted">
              냉동 {shelfLifeDays()}일 이내(질병관리청 안내) · {md(expiry).month}월 {md(expiry).day}일까지 드세요
            </span>
          )
        )}
      </label>

      {store && (
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-sub">
          소비기한 (포장에 적힌 날짜)
          <input type="date" className={inputCls} value={expiresOn} min={madeAt} onChange={(e) => setExpiresOn(e.target.value)} />
          <span className={`text-xs font-medium ${expiryInvalid ? 'text-urgent' : 'text-muted'}`}>
            {!expiresOn ? '포장에 적힌 소비기한(유통기한)을 확인해 입력해 주세요.' : expiresOn < madeAt ? '구매일보다 뒤 날짜여야 해요.' : '포장의 소비기한을 다시 한번 확인해 주세요. 개봉 후 보관 방법은 포장 안내를 따라 주세요.'}
          </span>
        </label>
      )}
    </Sheet>
  )
}
