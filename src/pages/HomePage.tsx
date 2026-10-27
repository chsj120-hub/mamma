import { useState } from 'react'
import { AppHeader, NotificationButton } from '../components/AppHeader'
import { AllergenNotice } from '../components/AllergenNotice'
import { ExpiryAlert } from '../components/home/ExpiryAlert'
import { MealCard } from '../components/home/MealCard'
import { NutritionCard } from '../components/home/NutritionCard'
import { ProfileCard } from '../components/home/ProfileCard'
import { ProfileModal } from '../components/home/ProfileModal'
import { expiringCubes } from '../lib/cube'
import { useAppData } from '../lib/data'
import { todayKey } from '../lib/date'
import { allergenTestProgress, ironDaysThisWeek } from '../lib/meal'

export function HomePage() {
  const { profile, setProfile, plans, cubes, toggleMealDone, setEatenMl } = useAppData()
  const [editing, setEditing] = useState(false)

  const today = todayKey()
  const meals = [...(plans[today]?.meals ?? [])].sort((a, b) => a.time.localeCompare(b.time))
  const doneCount = meals.filter((m) => m.status === 'done').length
  const expiring = expiringCubes(cubes, today)
  const allergenTest = allergenTestProgress(plans, today)

  return (
    <>
      <AppHeader right={<NotificationButton to="/cube" unread={expiring.length} />} />
      <main className="flex flex-col gap-4 px-5 pt-1">
        <ProfileCard profile={profile} onEdit={() => setEditing(true)} />
        <ExpiryAlert cubes={expiring} />
        <AllergenNotice how="식단 탭에서 날짜를 눌러 '알레르기 테스트' 칸에 넣을 수 있어요." />

        <section className="flex flex-col gap-2.5" aria-labelledby="today-meals">
          <div className="flex items-baseline justify-between">
            <h2 id="today-meals" className="m-0 text-lg font-bold">
              오늘의 식단
            </h2>
            {meals.length > 0 && (
              <span className="text-[13px] text-muted" aria-live="polite">
                {doneCount} / {meals.length} 완료
              </span>
            )}
          </div>
          {meals.length === 0 ? (
            <p className="m-0 rounded-[20px] border border-dashed border-line bg-card p-5 text-center text-sm text-sub">
              오늘 계획된 식단이 없어요. 식단 탭에서 추가해 주세요.
            </p>
          ) : (
            meals.map((m) => (
              <MealCard
                key={m.id}
                meal={m}
                allergenDay={allergenTest && m.allergen === allergenTest.allergen ? allergenTest.day : undefined}
                onToggle={() => toggleMealDone(today, m.id)}
                targetMl={profile.targetMl}
                onEatenChange={(ml) => setEatenMl(today, m.id, ml)}
              />
            ))
          )}
        </section>

        <NutritionCard ironDays={ironDaysThisWeek(plans, today)} allergenTest={allergenTest} />

        <p className="m-0 px-1 pb-2 text-[11px] leading-relaxed text-muted">
          식단과 영양 정보는 참고용이에요. 아기의 건강 상태나 알레르기가 걱정되면 소아청소년과 진료를 먼저 받아 주세요.
        </p>
      </main>

      <ProfileModal
        open={editing}
        profile={profile}
        onClose={() => setEditing(false)}
        onSave={(p) => {
          setProfile(p)
          setEditing(false)
        }}
      />
    </>
  )
}
