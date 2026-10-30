// 앱 데이터(아기 프로필·식단·홈큐브) 상태. 화면은 useAppData()로만 읽고 쓴다.
import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from 'react'
import { newId } from './meal'
import { useStoredState } from './storage'
import { SAMPLE_PROFILE, SEED_SAMPLE_DATA, sampleCubes, sampleMealPlans } from './seed'
import type { IngredientId } from './ingredients'
import type { MilestoneChecks } from './milestones'
import type { BabyProfile, Cube, GrowthRecord, MealPlans, Taste } from './types'

export type Snapshot = { id: string; at: number; label: string; plans: MealPlans }

const MAX_SNAPSHOTS = 20

type AppData = {
  profile: BabyProfile
  setProfile: (p: BabyProfile) => void
  plans: MealPlans
  cubes: Cube[]
  toggleMealDone: (date: string, mealId: string) => void
  /** 끼니 반응 한 줄 기록 (스냅샷 없이 바로 저장) */
  setTaste: (date: string, mealId: string, taste: Taste | undefined) => void
  /** 먹은 양 기록 (스냅샷 없이 바로 저장) */
  setEatenMl: (date: string, mealId: string, ml: number | undefined) => void
  /** 식단을 바꾸기 전 상태를 스냅샷으로 남기고 next로 교체 (수정·삭제·자동 채우기·재료 대체용) */
  commitPlans: (next: MealPlans, label: string) => void
  snapshots: Snapshot[]
  /** 해당 스냅샷으로 되돌리고, 그보다 최근 기록은 지운다 */
  restoreSnapshot: (id: string) => void
  /** 같은 재료·같은 날짜·같은 종류(직접/시판·소비기한) 큐브가 있으면 수량을 더한다 */
  addCube: (c: Omit<Cube, 'id'>) => void
  updateCube: (id: string, patch: Partial<Omit<Cube, 'id'>>) => void
  removeCube: (id: string) => void
  /** 알레르기·이상 반응이 있었던 재료 */
  reactions: IngredientId[]
  toggleReaction: (id: IngredientId) => void
  /** 마일스톤 체크 (키: '묶음:번호' → 체크한 시각) */
  milestones: MilestoneChecks
  /** 체크하면 지금 시각을 저장, 다시 누르면 지운다 */
  toggleMilestone: (key: string) => void
  /** 키·몸무게·머리둘레 기록 (날짜순) */
  growth: GrowthRecord[]
  /** 같은 날짜 기록이 있으면 그 값에 합쳐 저장 */
  saveGrowth: (r: Omit<GrowthRecord, 'id'>) => void
  removeGrowth: (id: string) => void
}

const Ctx = createContext<AppData | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useStoredState<BabyProfile>('profile', SAMPLE_PROFILE)
  const [plans, setPlans] = useStoredState<MealPlans>('mealPlans', () => (SEED_SAMPLE_DATA ? sampleMealPlans() : {}))
  const [cubes, setCubes] = useStoredState<Cube[]>('cubes', () => (SEED_SAMPLE_DATA ? sampleCubes() : []))
  const [snapshots, setSnapshots] = useStoredState<Snapshot[]>('snapshots', [])
  const [reactions, setReactions] = useStoredState<IngredientId[]>('reactions', [])
  const [milestones, setMilestones] = useStoredState<MilestoneChecks>('milestones', {})

  const [growth, setGrowth] = useStoredState<GrowthRecord[]>('growth', [])

  const plansRef = useRef(plans)
  plansRef.current = plans

  const toggleMealDone = useCallback(
    (date: string, mealId: string) =>
      setPlans((prev) => {
        const day = prev[date]
        if (!day) return prev
        const meals = day.meals.map((m) =>
          m.id === mealId ? { ...m, status: m.status === 'done' ? ('planned' as const) : ('done' as const) } : m,
        )
        return { ...prev, [date]: { ...day, meals } }
      }),
    [setPlans],
  )

  const setEatenMl = useCallback(
    (date: string, mealId: string, ml: number | undefined) =>
      setPlans((prev) => {
        const day = prev[date]
        if (!day) return prev
        return { ...prev, [date]: { ...day, meals: day.meals.map((m) => (m.id === mealId ? { ...m, eatenMl: ml } : m)) } }
      }),
    [setPlans],
  )

  const setTaste = useCallback(
    (date: string, mealId: string, taste: Taste | undefined) =>
      setPlans((prev) => {
        const day = prev[date]
        if (!day) return prev
        return { ...prev, [date]: { ...day, meals: day.meals.map((m) => (m.id === mealId ? { ...m, taste } : m)) } }
      }),
    [setPlans],
  )

  const saveGrowth = useCallback(
    (r: Omit<GrowthRecord, 'id'>) =>
      setGrowth((prev) => {
        const same = prev.find((x) => x.date === r.date)
        const next = same ? prev.map((x) => (x === same ? { ...x, ...r } : x)) : [...prev, { id: newId(), ...r }]
        return [...next].sort((a, b) => a.date.localeCompare(b.date))
      }),
    [setGrowth],
  )

  const removeGrowth = useCallback((id: string) => setGrowth((prev) => prev.filter((x) => x.id !== id)), [setGrowth])

  const commitPlans = useCallback(
    (next: MealPlans, label: string) => {
      const prev = plansRef.current
      setSnapshots((s) => [{ id: newId(), at: Date.now(), label, plans: prev }, ...s].slice(0, MAX_SNAPSHOTS))
      setPlans(next)
    },
    [setPlans, setSnapshots],
  )

  const restoreSnapshot = useCallback(
    (id: string) => {
      const idx = snapshots.findIndex((s) => s.id === id)
      if (idx < 0) return
      // 되돌리는 건 편집만. 그 뒤에 남긴 완료 체크·먹은 양 기록은 같은 끼니(id)면 지킨다
      const current = plansRef.current
      const records = new Map(Object.values(current).flatMap((d) => d.meals.map((m) => [m.id, m] as const)))
      const restored: MealPlans = {}
      for (const [date, day] of Object.entries(snapshots[idx].plans)) {
        restored[date] = {
          ...day,
          meals: day.meals.map((m) => {
            const now = records.get(m.id)
            return now ? { ...m, status: now.status, eatenMl: now.eatenMl, taste: now.taste } : m
          }),
        }
      }
      setPlans(restored)
      setSnapshots(snapshots.slice(idx + 1))
    },
    [snapshots, setPlans, setSnapshots],
  )

  const addCube = useCallback(
    (c: Omit<Cube, 'id'>) =>
      setCubes((prev) => {
        const same = prev.find(
          (x) => x.ingredient === c.ingredient && x.madeAt === c.madeAt && (x.source ?? 'homemade') === (c.source ?? 'homemade') && x.expiresOn === c.expiresOn,
        )
        if (same) return prev.map((x) => (x === same ? { ...x, count: x.count + c.count } : x))
        return [...prev, { id: newId(), ...c }]
      }),
    [setCubes],
  )

  const updateCube = useCallback(
    (id: string, patch: Partial<Omit<Cube, 'id'>>) => setCubes((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    [setCubes],
  )

  const removeCube = useCallback((id: string) => setCubes((prev) => prev.filter((x) => x.id !== id)), [setCubes])

  const toggleReaction = useCallback(
    (id: IngredientId) => setReactions((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
    [setReactions],
  )

  const toggleMilestone = useCallback(
    (key: string) =>
      setMilestones((prev) => {
        const next = { ...prev }
        if (next[key]) delete next[key]
        else next[key] = new Date().toISOString() // 같은 날 여러 개도 최신순으로 정렬되게 시각까지
        return next
      }),
    [setMilestones],
  )

  const value = useMemo(
    () => ({
      profile,
      setProfile,
      plans,
      cubes,
      toggleMealDone,
      setEatenMl,
      setTaste,
      commitPlans,
      snapshots,
      restoreSnapshot,
      addCube,
      updateCube,
      removeCube,
      reactions,
      toggleReaction,
      milestones,
      toggleMilestone,
      growth,
      saveGrowth,
      removeGrowth,
    }),
    [profile, setProfile, plans, cubes, toggleMealDone, setEatenMl, setTaste, commitPlans, snapshots, restoreSnapshot, addCube, updateCube, removeCube, reactions, toggleReaction, milestones, toggleMilestone, growth, saveGrowth, removeGrowth],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAppData() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAppData는 AppDataProvider 안에서만 사용할 수 있어요')
  return ctx
}
