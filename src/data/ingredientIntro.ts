// 재료별 도입 단계와 순서. 자동 채우기는 지금 단계까지 열린 재료를 order 순서대로 하나씩(3일씩) 시작한다.
//
// 순서의 출처 (2026-11-02 반영): 사용자가 실사용 중인 식단표 '이유식_중기식단표_오꾸맘_후기식단_완성본'(초기 6개월 → 중기 → 후기)과
// 그 표의 '식단표 작성하는 방법' 시트(삐뽀삐뽀 참고). 육아 커뮤니티 자료라 소아청소년과 확인 전이다 (docs/OPEN_ISSUES.md #5).
// 순서 원칙: 쌀 → 소고기(철분) → 이파리채소 → 노란채소 → 과일(초기), 중기부터 다른 단백질·질산염 채소·알레르기 재료.
// 알레르기 재료는 미루지 않되(최신 지침), 일반 재료로 5식품군(쌀·고기·채소·과일)을 먼저 익힌 뒤 시작한다 (lib/allergenPlan.ts).
//
// 표와 다르게 둔 것(docs/OPEN_ISSUES.md #5, #6):
// - 새우·게·호두·아몬드·캐슈너트는 후기(9개월)부터 추천한다 (표는 8~9개월). 질병관리청은 '돌 무렵부터'라고 안내하므로 고를 때 설명 칸에 그 안내를 함께 보여 준다
// - 연어(붉은살 생선)는 넣지 않았다: AVOID_BEFORE_12M의 '붉은살 생선' 때문 (표는 10개월)
import type { IngredientId } from '../lib/ingredients'
import type { StageId } from '../lib/types'

export type IntroRule = {
  /** 이 단계부터 먹일 수 있다 */
  stage: StageId
  /** 같은 단계 안에서 시작하는 순서 (작을수록 먼저). 알레르기 재료는 일반 재료와 따로 줄을 선다 */
  order: number
  /** 안내 메모 (조리 형태 등) */
  note?: string
}

export const INGREDIENT_INTRO: Record<IngredientId, IntroRule> = {
  // 초기 (6개월): 쌀 → 소고기 → 채소(이파리 → 노란) → 과일. 고구마·감자는 탄수화물이 주성분이라 초기엔 쓰지 않는다
  rice: { stage: 'early', order: 1, note: '첫 재료. 10배죽 미음. 오트밀·현미 같은 잡곡은 쌀에 조금씩 섞어 줄 수 있어요' },
  beef: { stage: 'early', order: 2, note: '철분 보충을 위해 쌀 다음 바로. 지방이 적은 부위(우둔살·안심)' },
  cabbage: { stage: 'early', order: 3, note: '이파리채소. 질긴 부분은 빼고 부드러운 부분만' },
  pumpkin: { stage: 'early', order: 4, note: '노란채소' },
  apple: { stage: 'early', order: 5, note: '익혀서 으깨거나 갈아 주기 (생과일즙은 X)' },
  zucchini: { stage: 'early', order: 6, note: '이파리채소와 번갈아' },
  paprika: { stage: 'early', order: 7, note: '노란채소. 껍질을 벗겨 익혀서' },
  pear: { stage: 'early', order: 8, note: '익혀서 으깨거나 갈아 주기' },
  // 초기의 알레르기 재료 (일반 재료로 쌀·소고기·채소·과일을 익힌 뒤. 평일 오전에, 돌 전까지 꾸준히)
  wheat: { stage: 'early', order: 9, note: '밀가루를 죽에 한 꼬집 섞어서' },
  peanut: { stage: 'early', order: 10, note: '땅콩가루·묽은 땅콩버터로. 통땅콩 금지' },
  egg: { stage: 'early', order: 11, note: '완숙, 노른자·흰자 같이. 스크램블처럼 익혀 잘게' },

  // 중기 (7~8개월): 질산염 채소(비트·당근·시금치) 시작, 다른 단백질, 고구마·감자
  beet: { stage: 'middle', order: 1, note: '소량부터. 질산염 채소는 6개월 이후' },
  broccoli: { stage: 'middle', order: 2, note: '꽃 부분만' },
  bokchoy: { stage: 'middle', order: 3, note: '잎 부분만' },
  chicken: { stage: 'middle', order: 4, note: '안심·가슴살' },
  banana: { stage: 'middle', order: 5, note: '껍질에 갈색 점이 보일 만큼 익은 것' },
  sweetpotato: { stage: 'middle', order: 6, note: '탄수화물이 많아 초기 이후에' },
  carrot: { stage: 'middle', order: 7, note: '질산염 채소. 푹 익혀서' },
  vitaminchae: { stage: 'middle', order: 8, note: '이파리채소. 부드러운 부분만' },
  radish: { stage: 'middle', order: 9 },
  potato: { stage: 'middle', order: 10, note: '탄수화물이 많아 초기 이후에' },
  napacabbage: { stage: 'middle', order: 11, note: '이파리채소. 부드러운 부분만' },
  onion: { stage: 'middle', order: 12 },
  spinach: { stage: 'middle', order: 13, note: '질산염 채소. 데쳐서 물은 버리기' },
  mushroom: { stage: 'middle', order: 14, note: '잘게 다져서' },
  eggplant: { stage: 'middle', order: 15, note: '껍질을 벗겨 푹 익혀서' },
  cucumber: { stage: 'middle', order: 16, note: '껍질·씨를 빼고 익혀서' },
  avocado: { stage: 'middle', order: 17 },
  chestnut: { stage: 'middle', order: 18, note: '푹 익혀 으깨기' },
  // 중기의 알레르기 재료 (한 주에 하나씩 이 순서로 권해요)
  soybean: { stage: 'middle', order: 20, note: '두부 형태로' },
  milk: { stage: 'middle', order: 21, note: '요거트·치즈로 소량부터. 생우유를 음료로 주는 건 돌 이후' },
  buckwheat: { stage: 'middle', order: 22, note: '메밀가루를 죽에 한 꼬집. 국수는 자극이 될 수 있어요' },
  sesame: { stage: 'middle', order: 23, note: '곱게 간 깨' },
  clam: { stage: 'middle', order: 24, note: '조갯살을 푹 익혀 잘게' },
  cod: { stage: 'middle', order: 25, note: '흰살생선, 가시 확인. 생선은 한 주에 자주 넣지 않아요' },
  // 노른자는 달걀(노른자·흰자 같이)을 시작하면 따로 하지 않아도 돼요. 노른자부터 하고 싶을 때만 직접 골라요
  yolk: { stage: 'middle', order: 26, note: '완숙 노른자. 달걀(전란)로 시작했다면 건너뛰어도 돼요' },

  // 후기 (9~11개월): 돼지고기, 버섯, 알레르기 가능 과일
  pork: { stage: 'late', order: 1, note: '기름기 적은 부위' },
  shiitake: { stage: 'late', order: 2, note: '잘게 다져서' },
  kiwi: { stage: 'late', order: 3, note: '알레르기를 일으키기 쉬운 과일이라 처음엔 소량' },
  peach: { stage: 'late', order: 4, note: '알레르기를 일으키기 쉬운 과일이라 처음엔 소량' },
  fish: { stage: 'late', order: 5, note: '흰살생선 위주, 붉은살은 돌 이후' },

  // 후기부터 추천하는 갑각류·견과류 (질병관리청: 돌 무렵부터 → 설명 칸에 안내 문구를 함께 보여 준다)
  shrimp: { stage: 'late', order: 6, note: '질병관리청은 돌 무렵부터 하길 안내해요. 아이마다 다를 수 있으니 상태를 보고 시도해 주세요.' },
  crab: { stage: 'late', order: 7, note: '질병관리청은 돌 무렵부터 하길 안내해요. 아이마다 다를 수 있으니 상태를 보고 시도해 주세요.' },
  walnut: { stage: 'late', order: 8, note: '곱게 갈아서. 질병관리청은 돌 무렵부터 하길 안내해요. 아이마다 다를 수 있으니 상태를 보고 시도해 주세요.' },
  almond: { stage: 'late', order: 9, note: '곱게 갈아서. 질병관리청은 돌 무렵부터 하길 안내해요. 아이마다 다를 수 있으니 상태를 보고 시도해 주세요.' },
  cashew: { stage: 'late', order: 10, note: '곱게 갈아서. 질병관리청은 돌 무렵부터 하길 안내해요. 아이마다 다를 수 있으니 상태를 보고 시도해 주세요.' },
}
