import { Link } from 'react-router-dom'
import { ingredientName, type IngredientId } from '../../lib/ingredients'

type Props = {
  ironDays: number
  allergenTest: { allergen: IngredientId; day: number } | null
  /** 이번 주 먹은 채소 종류 수. 있으면 '채소 다양성' 막대를 보여 준다 */
  veggieKinds?: number
  /** false면 '주간 식단' 링크 숨김 (PC는 같은 화면에 캘린더가 있음) */
  showLink?: boolean
}

/** 채소 다양성 막대가 꽉 차는 기준 (주 10종) */
const VEGGIE_GOAL = 10

const TEST_DAYS = 3

export function NutritionCard({ ironDays, allergenTest, veggieKinds, showLink = true }: Props) {
  const ironPct = Math.round((ironDays / 7) * 100)
  return (
    <section className="flex flex-col gap-3.5 rounded-[20px] border border-line bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="m-0 text-base font-bold">이번 주 영양 균형</h2>
        {showLink && (
          <Link to="/planner" className="flex min-h-11 items-center text-[13px] font-semibold text-ink">
            주간 식단
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-[13px]">
          <span>철분(소고기) 공급</span>
          <span className="font-bold">{ironDays} / 7일</span>
        </div>
        <div
          role="progressbar"
          aria-label="철분 공급 일수"
          aria-valuemin={0}
          aria-valuemax={7}
          aria-valuenow={ironDays}
          className="h-2 overflow-hidden rounded bg-track"
        >
          <div className="h-full rounded bg-accent transition-[width] duration-500" style={{ width: `${ironPct}%` }} />
        </div>
      </div>

      {veggieKinds != null && (
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-[13px]">
            <span>채소 다양성</span>
            <span className="font-bold">{veggieKinds}종</span>
          </div>
          <div
            role="progressbar"
            aria-label="이번 주 채소 종류"
            aria-valuemin={0}
            aria-valuemax={VEGGIE_GOAL}
            aria-valuenow={Math.min(veggieKinds, VEGGIE_GOAL)}
            className="h-2 overflow-hidden rounded bg-track"
          >
            <div className="h-full rounded bg-accent transition-[width] duration-500" style={{ width: `${Math.min(100, (veggieKinds / VEGGIE_GOAL) * 100)}%` }} />
          </div>
        </div>
      )}

      {allergenTest && (
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-[13px]">
            <span>{ingredientName(allergenTest.allergen)} 3일 테스트</span>
            <span className="font-bold">
              {Math.min(allergenTest.day, TEST_DAYS)} / {TEST_DAYS}일
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5" aria-hidden="true">
            {Array.from({ length: TEST_DAYS }, (_, i) => (
              <div key={i} className={`h-2 rounded ${i < allergenTest.day ? 'bg-allergy-bar' : 'bg-track'}`} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
