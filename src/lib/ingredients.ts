// 재료 목록은 design/ICONS.md 와 같게 유지한다 (아이콘 파일: src/assets/icons/<id>.svg)
export type IngredientCategory = 'grain' | 'meat' | 'veggie' | 'fruit' | 'etc'

export const INGREDIENTS = {
  // 곡물
  rice: { name: '쌀', category: 'grain' },
  wheat: { name: '밀', category: 'grain' },
  // 고기·생선·해산물
  beef: { name: '소고기', category: 'meat' },
  chicken: { name: '닭고기', category: 'meat' },
  cod: { name: '대구살', category: 'meat' },
  fish: { name: '생선', category: 'meat' },
  shrimp: { name: '새우', category: 'meat' },
  crab: { name: '게', category: 'meat' },
  // 채소
  zucchini: { name: '애호박', category: 'veggie' },
  onion: { name: '양파', category: 'veggie' },
  broccoli: { name: '브로콜리', category: 'veggie' },
  pumpkin: { name: '단호박', category: 'veggie' },
  spinach: { name: '시금치', category: 'veggie' },
  potato: { name: '감자', category: 'veggie' },
  radish: { name: '무', category: 'veggie' },
  carrot: { name: '당근', category: 'veggie' },
  bokchoy: { name: '청경채', category: 'veggie' },
  sweetpotato: { name: '고구마', category: 'veggie' },
  beet: { name: '비트', category: 'veggie' },
  shiitake: { name: '표고버섯', category: 'veggie' },
  chestnut: { name: '밤', category: 'veggie' },
  // 과일
  pear: { name: '배', category: 'fruit' },
  apple: { name: '사과', category: 'fruit' },
  banana: { name: '바나나', category: 'fruit' },
  avocado: { name: '아보카도', category: 'fruit' },
  // 달걀·유제품·콩·견과·씨앗
  yolk: { name: '계란노른자', category: 'etc' },
  egg: { name: '계란', category: 'etc' },
  milk: { name: '우유', category: 'etc' },
  soybean: { name: '대두(콩)', category: 'etc' },
  peanut: { name: '땅콩', category: 'etc' },
  walnut: { name: '호두', category: 'etc' },
  almond: { name: '아몬드', category: 'etc' },
  cashew: { name: '캐슈너트', category: 'etc' },
  sesame: { name: '참깨', category: 'etc' },
} as const satisfies Record<string, { name: string; category: IngredientCategory }>

export type IngredientId = keyof typeof INGREDIENTS
export const INGREDIENT_IDS = Object.keys(INGREDIENTS) as IngredientId[]

/**
 * 3일 테스트가 필요한 알레르기 유발 재료 (알레르기 테스트 칸에서 고를 수 있고, 리포트에 '주의'로 표시).
 * 달걀, 우유(요거트 포함), 밀, 대두, 땅콩, 견과류, 참깨, 생선, 갑각류.
 * 자동 채우기는 이 재료를 새로 시작하지 않고, 대신 '시작할 시기' 안내를 띄운다 (lib/allergenNotice.ts).
 */
export const ALLERGENS: IngredientId[] = ['yolk', 'egg', 'milk', 'wheat', 'soybean', 'peanut', 'walnut', 'almond', 'cashew', 'sesame', 'fish', 'cod', 'shrimp', 'crab']

/**
 * 직접 만든 이유식 큐브의 소진 기한(냉동 보관 일수): 7일.
 * 출처: 질병관리청 국가건강정보포털 '식이영양(영유아)' — 조리한 이유식은 냉장 24시간 이내, 냉동 1주일 이내에 먹는 것이 좋다.
 * (예전 값 '고기·생선 21일, 그 외 14일'은 출처를 찾을 수 없어 바꿨다. 재료 종류와 상관없이 같은 기준을 쓴다)
 */
export const HOMEMADE_SHELF_LIFE_DAYS = 7
export const shelfLifeDays = () => HOMEMADE_SHELF_LIFE_DAYS

export const ingredientName = (id: IngredientId) => INGREDIENTS[id].name

/** 한글 이름(예: '소고기')으로 id를 찾는다 */
export const findIngredientId = (name: string) => INGREDIENT_IDS.find((id) => INGREDIENTS[id].name === name)
