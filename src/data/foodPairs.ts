// 한 끼에 같이 넣지 않으려는 재료 짝. 출처: 사용자 식단표의 '식품 궁합표'(안 좋은 궁합) 중 앱에 있는 재료만.
// 민간에서 전해지는 궁합이라 건강상의 근거가 확인된 것은 아니다. 그래서 화면에 건강 문구로 보여 주지 않고,
// 자동 채우기가 비슷한 후보 중에서 고를 때 겹치지 않게 하는 용도로만 쓴다(재료를 막지는 않는다).
import type { IngredientId } from '../lib/ingredients'

export const AVOID_PAIRS: [IngredientId, IngredientId][] = [
  ['beef', 'sweetpotato'],
  ['beef', 'chestnut'],
  ['carrot', 'cabbage'],
  ['carrot', 'cucumber'],
  ['carrot', 'radish'],
  ['radish', 'cucumber'],
  ['spinach', 'soybean'],
]

export const clashes = (a: IngredientId, b: IngredientId) => AVOID_PAIRS.some(([x, y]) => (x === a && y === b) || (x === b && y === a))
