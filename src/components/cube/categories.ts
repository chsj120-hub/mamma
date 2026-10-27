import { INGREDIENT_IDS, INGREDIENTS, type IngredientCategory, type IngredientId } from '../../lib/ingredients'

export type CubeFilter = 'all' | IngredientCategory

export const CUBE_FILTERS: { id: CubeFilter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'meat', label: '고기·생선' },
  { id: 'veggie', label: '채소' },
  { id: 'fruit', label: '과일' },
  { id: 'grain', label: '곡물' },
  { id: 'etc', label: '기타' },
]

const LABEL: Record<IngredientCategory, string> = { meat: '고기', veggie: '채소', fruit: '과일', grain: '곡물', etc: '기타' }

/** 분류보다 자세히 보여 줄 재료 */
const DETAIL: Partial<Record<IngredientId, string>> = {
  cod: '생선',
  fish: '생선',
  shrimp: '해산물',
  crab: '해산물',
  yolk: '달걀',
  egg: '달걀',
  milk: '유제품',
  soybean: '콩',
  peanut: '견과',
  walnut: '견과',
  almond: '견과',
  cashew: '견과',
  sesame: '씨앗',
}

/** 카드·표에 쓰는 분류 이름 (예: 대구살 '생선', 새우 '해산물') */
export const CATEGORY_LABEL = Object.fromEntries(INGREDIENT_IDS.map((id) => [id, DETAIL[id] ?? LABEL[INGREDIENTS[id].category]])) as Record<IngredientId, string>
