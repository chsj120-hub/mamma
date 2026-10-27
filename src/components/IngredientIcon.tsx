// design/icons 의 식재료 아이콘 (24×24 SVG, 목록은 design/ICONS.md)
import type { IngredientId } from '../lib/ingredients'

const files = import.meta.glob<string>('../assets/icons/*.svg', { eager: true, query: '?url', import: 'default' })

const urlOf = (id: IngredientId) => files[`../assets/icons/${id}.svg`]

type Props = {
  id: IngredientId
  size?: number
  /** true면 둥근 soft 배경 칩 안에 표시 */
  chip?: boolean
  className?: string
  /** 스크린리더용 이름. 옆에 글자가 같이 있으면 생략(장식 처리) */
  label?: string
}

export function IngredientIcon({ id, size = 24, chip = false, className = '', label }: Props) {
  const img = (
    <img
      src={urlOf(id)}
      width={size}
      height={size}
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
      draggable={false}
      className={chip ? '' : className}
    />
  )
  if (!chip) return img
  const box = Math.round(size * 1.6)
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-soft ${className}`}
      style={{ width: box, height: box }}
    >
      {img}
    </span>
  )
}
