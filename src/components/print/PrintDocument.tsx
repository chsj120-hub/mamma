import type { ReactNode } from 'react'
import { cubeStatus, daysLeft, dLabel, expiresAt, isStore, LOW_STOCK_UNDER } from '../../lib/cube'
import { useAppData } from '../../lib/data'
import { addDays, daysInMonth, DOW_KO, dowOf, koreanTime, md } from '../../lib/date'
import { ingredientName, type IngredientId } from '../../lib/ingredients'
import { allergenStreak, daySummary, mealItems, sortMeals } from '../../lib/meal'
import { checkedOn, currentGroup, GROUP_NAMES, isChecked, MILESTONE_GROUPS, milestoneKey, MILESTONES } from '../../lib/milestones'
import { dotDate, periodStart, shortDot, type PrintSettings } from '../../lib/print'
import { ingredientTests, periodDates, periodSummary, triedIngredients, weekIntake, weekLabel } from '../../lib/report'
import { CATEGORY_LABEL } from '../cube/categories'
import { IngredientIcon } from '../IngredientIcon'
import { testBadge } from '../report/TestRecordCard'

type Props = { settings: PrintSettings; today: string }

/**
 * 출력용 문서 (A4). 화면 미리보기와 실제 인쇄가 같은 컴포넌트를 쓴다.
 * 인쇄에서는 테마 색 대신 고정 잉크 색을 주로 쓰고, 흑백 옵션은 바깥에서 grayscale 필터를 건다.
 */
export function PrintDocument({ settings, today }: Props) {
  const { profile, plans, cubes, reactions, milestones } = useAppData()
  const { kind, options } = settings
  const start = periodStart(kind, settings.range, settings.customDate, today)
  const end = kind === 'month' ? addDays(start, daysInMonth(start) - 1) : addDays(start, 6)

  const title = {
    week: `${profile.name} 주간 이유식 식단표`,
    month: `${profile.name} ${md(start).month}월 이유식 식단표`,
    report: `${profile.name} 성장 리포트`,
    cube: '홈큐브 재고표',
    milestone: `${profile.name} 이유식 마일스톤`,
  }[kind]
  const rangeLabel = {
    week: `${dotDate(start)} – ${shortDot(end)}`,
    month: `${start.slice(0, 4)}년 ${md(start).month}월`,
    report: `${weekLabel(start)} · ${shortDot(start)} – ${shortDot(end)}`,
    cube: `${dotDate(today)} 기준`,
    milestone: `${dotDate(today)} 기준`,
  }[kind]

  const icon = (id: IngredientId, size = 14) => (options.icons ? <IngredientIcon id={id} size={size} className="shrink-0" /> : null)

  // 장보기: 재료별 합계가 2개 미만
  const totals = new Map<IngredientId, number>()
  for (const c of cubes) totals.set(c.ingredient, (totals.get(c.ingredient) ?? 0) + c.count)
  const shopping = [...totals].filter(([, n]) => n < LOW_STOCK_UNDER).map(([id]) => id)

  return (
    <article className="flex h-full flex-col gap-[3mm] bg-white font-sans text-[11px] leading-snug text-text [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
      <header className="flex items-end justify-between border-b-2 border-accent pb-[2mm]">
        <h1 className="m-0 font-display text-[20px] font-normal">{title}</h1>
        <span className="text-[10px] text-sub">{rangeLabel}</span>
      </header>

      {kind === 'week' && <WeekSheet start={start} plans={plans} icon={icon} showAllergen={options.allergen} today={today} />}
      {kind === 'month' && <MonthSheet start={start} plans={plans} icon={icon} showAllergen={options.allergen} today={today} />}
      {kind === 'report' && (
        <ReportSheet start={start} plans={plans} today={today} target={profile.targetMl * profile.mealsPerDay} icon={icon} showAllergen={options.allergen} reactions={reactions} />
      )}
      {kind === 'cube' && (
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="border-b border-line text-left text-[10px] text-sub">
              {['재료', '분류', '수량', '제조·구매일', '소진 기한', '상태'].map((h) => (
                <th key={h} className="py-[1.5mm] font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...cubes]
              .sort((a, b) => daysLeft(a, today) - daysLeft(b, today))
              .map((c) => {
                const st = cubeStatus(c, today)
                return (
                  <tr key={c.id} className="border-b border-track">
                    <td className="py-[1.2mm]">
                      <span className="flex items-center gap-1.5 font-semibold">
                        {icon(c.ingredient)}
                        {ingredientName(c.ingredient)}
                        {isStore(c) && <span className="text-[9px] font-normal text-sub">(시판)</span>}
                      </span>
                    </td>
                    <td className="text-sub">{CATEGORY_LABEL[c.ingredient]}</td>
                    <td>{c.count}개</td>
                    <td className="text-sub">{shortDot(c.madeAt)}</td>
                    <td>
                      {shortDot(expiresAt(c))} <b className={st === 'urgent' ? 'text-urgent' : 'text-sub'}>{dLabel(daysLeft(c, today))}</b>
                    </td>
                    <td className={st === 'urgent' ? 'font-bold text-urgent' : st === 'low' ? 'font-bold text-low' : 'text-sub'}>
                      {st === 'urgent' ? '기한 임박' : st === 'low' ? '재고 부족' : '정상'}
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      )}
      {kind === 'milestone' && (
        <div className="grid grid-cols-1 gap-[3mm]">
          {MILESTONE_GROUPS.map((g) => (
            <section key={g} className="flex flex-col gap-[1mm]">
              <h2 className="m-0 text-[12px] font-bold">
                {GROUP_NAMES[g]}
                {g === currentGroup(profile.birthDate, today) && <span className="ml-1.5 text-[10px] font-semibold text-ink">지금 단계</span>}
              </h2>
              {MILESTONES[g].map((m, i) => {
                const key = milestoneKey(g, i)
                const on = isChecked(milestones, key)
                const date = checkedOn(milestones, key)
                return (
                  <div key={key} className="flex items-center gap-2 border-b border-track py-[1mm]">
                    <Box checked={on} />
                    <span className="flex-1">{m.text}</span>
                    <span className="text-[10px] text-sub">{on ? (date ? `${shortDot(date)} 체크` : '체크함') : ''}</span>
                  </div>
                )
              })}
            </section>
          ))}
        </div>
      )}

      {options.shopping && (kind === 'week' || kind === 'month' || kind === 'cube') && (
        <section className="flex flex-col gap-[1mm]">
          <h2 className="m-0 text-[12px] font-bold">장보기 · 만들 큐브</h2>
          {shopping.length === 0 ? (
            <span className="text-sub">부족한 재료가 없어요.</span>
          ) : (
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {shopping.map((id) => (
                <span key={id} className="flex items-center gap-1">
                  <Box />
                  {icon(id)}
                  {ingredientName(id)}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {options.memo && (
        <section className="mt-auto flex flex-col gap-[5mm] pt-[2mm]">
          <h2 className="m-0 text-[12px] font-bold">메모</h2>
          <span className="border-b border-plan-dot" />
          <span className="border-b border-plan-dot" />
          <span className="border-b border-plan-dot" />
        </section>
      )}

      <footer className={`flex justify-between border-t border-line pt-[1.5mm] text-[9px] text-muted ${options.memo ? '' : 'mt-auto'}`}>
        <span>맘마 이유식 플래너 · {dotDate(today)} 출력</span>
        <span>식단·영양 정보는 참고용이에요. 걱정되면 소아청소년과와 상의해 주세요.</span>
      </footer>
    </article>
  )
}

function Box({ checked = false }: { checked?: boolean }) {
  return (
    <span className="flex size-[3.2mm] shrink-0 items-center justify-center rounded-[0.6mm] border border-[#A8937C] text-[8px] leading-none font-bold text-done">
      {checked ? '✓' : ''}
    </span>
  )
}

type SheetProps = { start: string; plans: ReturnType<typeof useAppData>['plans']; icon: (id: IngredientId, size?: number) => ReactNode; showAllergen: boolean; today: string }

function WeekSheet({ start, plans, icon, showAllergen }: SheetProps) {
  return (
    <div className="flex flex-col">
      <p className="m-0 pb-[1mm] text-[10px] text-sub">베이스 쌀은 생략했어요. 먹은 끼니는 □에 체크해 주세요.</p>
      {Array.from({ length: 7 }, (_, i) => {
        const date = addDays(start, i)
        const meals = sortMeals(plans[date]?.meals ?? [])
        const dow = dowOf(date)
        return (
          <div key={date} className="flex gap-[3mm] border-b border-track py-[1.6mm]">
            <span className={`w-[12mm] shrink-0 font-bold ${dow === 0 ? 'text-urgent' : dow === 6 ? 'text-sat' : ''}`}>
              {DOW_KO[dow]} {md(date).day}
            </span>
            <div className="flex flex-1 flex-col gap-[1mm]">
              {meals.length === 0 && <span className="text-muted">식단 없음</span>}
              {meals.map((m) => (
                <div key={m.id} className="flex items-center gap-2">
                  <span className="w-[16mm] shrink-0 text-[10px] text-sub">
                    {m.label} {koreanTime(m.time).replace('오전 ', '').replace('오후 ', '')}
                  </span>
                  <span className="flex flex-1 flex-wrap items-center gap-x-2.5 gap-y-0.5">
                    {mealItems(m)
                      .filter((id) => id !== m.base)
                      .map((id) => (
                        <span key={id} className="flex items-center gap-0.5">
                          {icon(id)}
                          {ingredientName(id)}
                        </span>
                      ))}
                    {showAllergen && m.allergen && (
                      <span className="rounded-[1mm] bg-allergy-bg px-1 text-[9.5px] font-bold text-allergy">
                        {ingredientName(m.allergen)} {allergenStreak(plans, date, m.allergen)}일차
                      </span>
                    )}
                  </span>
                  <Box checked={m.status === 'done'} />
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MonthSheet({ start, plans, icon, showAllergen }: SheetProps) {
  const lead = dowOf(start)
  const count = daysInMonth(start)
  return (
    <div className="flex flex-1 flex-col">
      <div className="grid grid-cols-7 gap-[1mm] pb-[1mm] text-center text-[10px] font-semibold text-sub">
        {DOW_KO.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid flex-1 auto-rows-fr grid-cols-7 gap-[1mm]">
        {Array.from({ length: lead }, (_, i) => (
          <span key={`b${i}`} />
        ))}
        {Array.from({ length: count }, (_, i) => {
          const date = addDays(start, i)
          const s = daySummary(plans[date])
          const al = showAllergen && s.allergen
          return (
            <div key={date} className={`flex min-h-[20mm] flex-col gap-[0.5mm] overflow-hidden rounded-[1mm] border p-[1mm] ${al ? 'border-allergy-ring bg-allergy-soft' : 'border-line'}`}>
              <span className="flex justify-between text-[9.5px] font-bold">
                {md(date).day}
                {s.status === 'done' && <span className="text-done">✓</span>}
              </span>
              {s.mains.slice(0, 4).map((id) => (
                <span key={id} className="flex items-center gap-0.5 truncate text-[8.5px] leading-tight">
                  {icon(id, 10)}
                  {ingredientName(id)}
                </span>
              ))}
              {s.mains.length > 4 && <span className="text-[8px] text-muted">+{s.mains.length - 4}</span>}
              {al && s.allergen && <span className="mt-auto truncate text-[8px] font-bold text-allergy">{ingredientName(s.allergen)} {allergenStreak(plans, date, s.allergen)}일차</span>}
            </div>
          )
        })}
      </div>
      <p className="m-0 pt-[1mm] text-[9px] text-sub">베이스 쌀 생략 · ✓ 그날 모두 먹음{showAllergen ? ' · 보라 칸: 알레르기 테스트' : ''}</p>
    </div>
  )
}

function ReportSheet({ start, plans, today, target, icon, showAllergen, reactions }: SheetProps & { target: number; reactions: IngredientId[] }) {
  const dates = periodDates('week', start)
  const sum = periodSummary(plans, dates, today)
  const days = weekIntake(plans, start)
  const max = Math.max(target * 1.25, ...days.map((d) => d.ml ?? 0))
  const tests = ingredientTests(plans, today, reactions).filter((t) => t.status !== 'untried')
  const tried = triedIngredients(plans)
  const kpis = [
    ['하루 평균 섭취량', sum.avgMl != null ? `${sum.avgMl}ml` : '–', `목표 ${target}ml`],
    ['철분 공급일', `${sum.ironDays} / ${sum.eatenDays}일`, '먹은 날 중 소고기'],
    ['새로 시도한 재료', `${sum.newOnes.length}종`, sum.newOnes.map(ingredientName).slice(0, 3).join(' · ') || '–'],
    ['식단 완료율', sum.mealsDue ? `${Math.round((sum.mealsDone / sum.mealsDue) * 100)}%` : '–', `${sum.mealsDue}끼 중 ${sum.mealsDone}끼`],
  ]
  return (
    <div className="flex flex-col gap-[3mm]">
      <div className="grid grid-cols-4 gap-[2mm]">
        {kpis.map(([label, value, sub]) => (
          <div key={label} className="flex flex-col rounded-[1.5mm] border border-line p-[2mm]">
            <span className="text-[9px] text-sub">{label}</span>
            <span className="font-display text-[16px]">{value}</span>
            <span className="truncate text-[8.5px] text-sub">{sub}</span>
          </div>
        ))}
      </div>

      <section className="flex flex-col gap-[1mm]">
        <h2 className="m-0 text-[12px] font-bold">하루 섭취량</h2>
        <div className="relative grid h-[34mm] grid-cols-7 items-end gap-[3mm] border-b border-line">
          <div className="absolute inset-x-0 border-t border-dashed border-sub" style={{ bottom: `${(target / max) * 100}%` }} />
          {days.map((d) => (
            <div key={d.date} className="flex h-full flex-col items-center justify-end gap-0.5">
              <span className="text-[8.5px] text-sub">{d.ml != null && d.date <= today ? d.ml : ''}</span>
              <div className={`w-full rounded-t-[1mm] ${d.iron ? 'bg-accent' : 'bg-bar-off'}`} style={{ height: d.ml != null && d.date <= today ? `${(d.ml / max) * 100}%` : 0 }} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-[3mm] text-center text-[9px] text-sub">
          {days.map((d) => (
            <span key={d.date}>
              {DOW_KO[dowOf(d.date)]} {md(d.date).day}
            </span>
          ))}
        </div>
        <span className="text-[9px] text-sub">진한 막대: 소고기(철분) 포함 · 점선: 하루 목표 {target}ml</span>
      </section>

      {showAllergen && (
        <section className="flex flex-col gap-[1mm]">
          <h2 className="m-0 text-[12px] font-bold">알레르기·새 재료 3일 테스트</h2>
          {tests.length === 0 ? (
            <span className="text-sub">아직 기록이 없어요.</span>
          ) : (
            <div className="grid grid-cols-2 gap-x-[6mm]">
              {tests.map((t) => (
                <div key={t.id} className="flex items-center gap-1.5 border-b border-track py-[0.8mm]">
                  {icon(t.id)}
                  <span className="flex-1 font-semibold">
                    {ingredientName(t.id)}
                    {t.allergen && <span className="ml-1 text-[8.5px] font-normal text-allergy">주의</span>}
                  </span>
                  <span className="text-[9px] text-sub">{t.first ? shortDot(t.first) : t.next ? `${shortDot(t.next)} 예정` : ''}</span>
                  <span className="w-[22mm] text-right text-[9.5px] font-bold">{testBadge(t.status, t.days).text}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="flex flex-col gap-[1mm]">
        <h2 className="m-0 text-[12px] font-bold">먹어본 재료 {tried.length}종</h2>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {tried.length === 0 && <span className="text-sub">완료한 끼니가 아직 없어요.</span>}
          {tried.map((id) => (
            <span key={id} className="flex items-center gap-0.5">
              {icon(id)}
              {ingredientName(id)}
            </span>
          ))}
        </div>
      </section>
    </div>
  )
}
