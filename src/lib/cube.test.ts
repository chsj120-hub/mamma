// 큐브 소진 기한 규칙 테스트. 직접 만든 큐브는 질병관리청 안내(냉동 1주일)에 따라 7일, 시판 큐브는 포장의 소비기한을 따른다.
import { describe, expect, it } from 'vitest'
import { addDays } from './date'
import { cubeStatus, daysLeft, expiresAt } from './cube'
import type { Cube } from './types'

const TODAY = '2026-11-02'
const homemade = (madeAt: string, ingredient: Cube['ingredient'] = 'beef'): Cube => ({ id: 'a', ingredient, count: 3, madeAt })

describe('큐브 소진 기한', () => {
  it('직접 만든 큐브는 재료와 상관없이 제조일 + 7일이다', () => {
    expect(expiresAt(homemade(TODAY, 'beef'))).toBe(addDays(TODAY, 7))
    expect(expiresAt(homemade(TODAY, 'broccoli'))).toBe(addDays(TODAY, 7))
  })

  it('시판 큐브는 포장에 적힌 소비기한을 따른다', () => {
    const store: Cube = { id: 'b', ingredient: 'beef', count: 2, madeAt: TODAY, source: 'store', expiresOn: addDays(TODAY, 30) }
    expect(expiresAt(store)).toBe(addDays(TODAY, 30))
  })

  it('만든 지 5일이면 D-2로 임박, 8일이면 만료로 본다', () => {
    expect(daysLeft(homemade(addDays(TODAY, -5)), TODAY)).toBe(2)
    expect(cubeStatus(homemade(addDays(TODAY, -5)), TODAY)).toBe('urgent')
    expect(daysLeft(homemade(addDays(TODAY, -8)), TODAY)).toBe(-1)
  })
})
