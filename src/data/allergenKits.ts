// 시판 알레르기 테스트 키트가 담고 있는 재료. 키트를 사서 앱의 알레르기 테스트와 함께 쓸 때 어떤 재료가 키트에 있고 없는지 보여 주는 용도.
//
// 출처 (2026-11-02 확인, 구성은 바뀔 수 있으니 구매한 포장의 원재료 표시를 우선한다):
// - 스푼타임 '초기 이유식 스타트킷' 출시 기사(전자신문 2023-12-05): 10종 원물 파우더 — 땅콩, 새우, 메밀, 밀, 대두, 흰살 생선, 호두, 참깨, 조개, 게
// - 스푼타임 공식 사이트: '10종 알레르겐 단계 도입', 완성한 이유식에 섞어 먹이는 방식, 6개월 이상. 재료 이름은 페이지에 적혀 있지 않았다
// - 공식 레시피 페이지의 알레르기 재료 표시는 밀·메밀·대두·참깨·새우·조개·흰살생선·땅콩·호두·달걀이라, 최신 구성(게 ↔ 달걀)은 포장에서 확인해야 한다
// - 사용자 식단표: '계란은 스타트킷에 없기도 하고 간단해서 직접' → 달걀·우유는 키트 밖에서 직접 준비
import type { IngredientId } from '../lib/ingredients'

export const KIT_NAME = '스푼타임 스타트킷'

/** 키트에 들어 있는 재료 (앱 재료로 옮긴 것. 키트의 '흰살 생선'은 앱의 '대구살'로 기록한다) */
export const KIT_INGREDIENTS: IngredientId[] = ['wheat', 'peanut', 'soybean', 'buckwheat', 'sesame', 'shrimp', 'clam', 'cod', 'walnut', 'crab']

export const inKit = (id: IngredientId) => KIT_INGREDIENTS.includes(id)

/**
 * 키트를 쓸 때 권하는 순서. 사용자 식단표의 알레르기 테스트 순서(밀 → 땅콩 → 달걀 → 대두 → 우유 → 메밀 → 참깨 → 새우 → 조개 → 흰살생선 → 호두 → 게).
 * 달걀·우유처럼 키트에 없는 재료도 같은 줄에 넣어, 직접 준비해서 이어 가게 한다
 */
export const SHEET_ALLERGEN_ORDER: IngredientId[] = ['wheat', 'peanut', 'egg', 'soybean', 'milk', 'buckwheat', 'sesame', 'shrimp', 'clam', 'cod', 'walnut', 'crab']
