// 처음 실행했을 때 보여줄 예시 데이터. 날짜는 오늘 기준으로 만들어 언제 열어도 화면이 채워지게 한다.
import { addDays, daysBetween, todayKey, weekStart } from './date'
import type { BabyProfile, Cube, Meal, MealPlans } from './types'

/**
 * true면 저장된 데이터가 없을 때 예시 식단·홈큐브로 채운다(데모·디자인 확인용).
 * 실제 가입 흐름에서는 새 계정이 빈 상태로 시작해야 하니 false로 둔다.
 */
export const SEED_SAMPLE_DATA = false

export const SAMPLE_PROFILE: BabyProfile = {
  name: '주원이',
  birthDate: '2026-03-17',
  stage: 'middle',
  targetMl: 80,
  mealsPerDay: 2,
}

// 요일별 예시 섭취량(ml) [아침, 저녁]
const EATEN = [[75, 75], [80, 80], [60, 60], [85, 80], [70, 70], [55, 55], [80, 75]]

let seq = 0
const id = () => `seed-${++seq}`

export function sampleMealPlans(today = todayKey()): MealPlans {
  const plans: MealPlans = {}
  const start = weekStart(today)
  // 이번 주 월~일. 소고기 5일, 계란노른자 테스트는 어제~내일 3일
  const week: [Partial<Meal>, Partial<Meal>][] = [
    [{ meat: 'beef', veggie1: 'pumpkin' }, { meat: 'beef', veggie1: 'potato', fruit: 'apple' }],
    [{ meat: 'chicken', veggie1: 'carrot' }, { meat: 'chicken', veggie1: 'bokchoy', fruit: 'banana' }],
    [{ meat: 'beef', veggie1: 'spinach', veggie2: 'onion' }, { meat: 'beef', veggie1: 'sweetpotato' }],
    [{ meat: 'beef', veggie1: 'zucchini', veggie2: 'onion' }, { meat: 'beef', veggie1: 'broccoli', fruit: 'pear' }],
    [{ meat: 'cod', veggie1: 'radish' }, { meat: 'cod', veggie1: 'zucchini', fruit: 'apple' }],
    [{ meat: 'beef', veggie1: 'broccoli' }, { meat: 'beef', veggie1: 'carrot', fruit: 'banana' }],
    [{ meat: 'beef', veggie1: 'potato' }, { meat: 'beef', veggie1: 'pumpkin', fruit: 'pear' }],
  ]
  // 오늘 식단은 시안과 같게
  const todayIdx = daysBetween(start, today)
  week[todayIdx] = [
    { meat: 'beef', veggie1: 'zucchini', veggie2: 'onion' },
    { meat: 'beef', veggie1: 'broccoli', fruit: 'pear' },
  ]

  week.forEach(([am, pm], i) => {
    const date = addDays(start, i)
    const past = date < today
    const allergen = Math.abs(i - todayIdx) <= 1 ? 'yolk' : undefined
    plans[date] = {
      date,
      meals: [
        { id: id(), time: '10:00', label: '아침', base: 'rice', ...am, status: past || date === today ? 'done' : 'planned', eatenMl: past || date === today ? EATEN[i][0] : undefined },
        { id: id(), time: '17:30', label: '저녁', base: 'rice', ...pm, allergen, status: past ? 'done' : 'planned', eatenMl: past ? EATEN[i][1] : undefined },
      ],
    }
  })
  return plans
}

export function sampleCubes(today = todayKey()): Cube[] {
  return [
    { id: id(), ingredient: 'beef', count: 4, madeAt: addDays(today, -19) }, // D-2
    { id: id(), ingredient: 'broccoli', count: 3, madeAt: addDays(today, -13) }, // D-1
    { id: id(), ingredient: 'zucchini', count: 6, madeAt: addDays(today, -4) },
    { id: id(), ingredient: 'onion', count: 1, madeAt: addDays(today, -5) }, // 재고 부족
    { id: id(), ingredient: 'pear', count: 5, madeAt: addDays(today, -2) },
    { id: id(), ingredient: 'rice', count: 8, madeAt: addDays(today, -3) },
  ]
}
