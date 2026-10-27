// 재료별 도입 단계와 순서. 자동 채우기는 지금 단계까지 열린 재료를 order 순서대로 하나씩(3일씩) 시작한다.
// 순서 원칙: 쌀 → 소고기(철분) → 채소 → 과일, 중기부터 다른 단백질·알레르기 재료.
// 알레르기 재료는 미루지 않되(최신 지침), 단계 진입 후 일반 재료 사이에 끼워 넣는다.
import type { IngredientId } from '../lib/ingredients'
import type { StageId } from '../lib/types'

export type IntroRule = {
  /** 이 단계부터 먹일 수 있다 */
  stage: StageId
  /** 같은 단계 안에서 시작하는 순서 (작을수록 먼저) */
  order: number
  /** 안내 메모 (조리 형태 등) */
  note?: string
}

export const INGREDIENT_INTRO: Record<IngredientId, IntroRule> = {
  // 초기 (6개월): 쌀 → 소고기 → 채소 → 과일
  rice: { stage: 'early', order: 1, note: '첫 재료. 10배죽 미음' },
  beef: { stage: 'early', order: 2, note: '철분 보충을 위해 쌀 다음 바로' },
  zucchini: { stage: 'early', order: 3 },
  potato: { stage: 'early', order: 4 },
  sweetpotato: { stage: 'early', order: 5 },
  pumpkin: { stage: 'early', order: 6 },
  broccoli: { stage: 'early', order: 7, note: '꽃 부분만' },
  bokchoy: { stage: 'early', order: 8, note: '잎 부분만' },
  apple: { stage: 'early', order: 9, note: '익혀서 갈아 주기' },
  pear: { stage: 'early', order: 10, note: '익혀서 갈아 주기' },
  banana: { stage: 'early', order: 11 },

  // 중기 (7~8개월): 다른 단백질, 노른자, 질산염 채소
  chicken: { stage: 'middle', order: 1, note: '안심 부위' },
  yolk: { stage: 'middle', order: 2, note: '완숙 노른자부터' },
  carrot: { stage: 'middle', order: 3 },
  cod: { stage: 'middle', order: 4, note: '흰살생선, 가시 확인' },
  onion: { stage: 'middle', order: 5 },
  spinach: { stage: 'middle', order: 6, note: '데쳐서 물은 버리기' },
  soybean: { stage: 'middle', order: 7, note: '두부 형태로' },
  radish: { stage: 'middle', order: 8 },
  avocado: { stage: 'middle', order: 9 },
  chestnut: { stage: 'middle', order: 10, note: '푹 익혀 으깨기' },
  beet: { stage: 'middle', order: 11, note: '소량부터' },

  // 후기 (9~11개월): 달걀 전체, 밀, 버섯, 생선, 땅콩·참깨(가루로)
  egg: { stage: 'late', order: 1, note: '완숙, 흰자 포함' },
  wheat: { stage: 'late', order: 2, note: '국수·빵 형태' },
  shiitake: { stage: 'late', order: 3, note: '잘게 다져서' },
  fish: { stage: 'late', order: 4, note: '흰살생선 위주, 붉은살은 돌 이후' },
  peanut: { stage: 'late', order: 5, note: '땅콩가루·묽은 땅콩버터로. 통땅콩 금지' },
  sesame: { stage: 'late', order: 6, note: '곱게 간 깨' },

  // 완료기 (12개월~): 우유, 갑각류, 견과류
  milk: { stage: 'complete', order: 1, note: '생우유는 돌 이후 (요거트·치즈는 후기부터 소량 가능)' },
  shrimp: { stage: 'complete', order: 2 },
  crab: { stage: 'complete', order: 3 },
  walnut: { stage: 'complete', order: 4, note: '곱게 갈아서' },
  almond: { stage: 'complete', order: 5, note: '곱게 갈아서' },
  cashew: { stage: 'complete', order: 6, note: '곱게 갈아서' },
}
