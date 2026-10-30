// 주간 식단표를 한 장짜리 PNG로 그린다 (카카오톡·맘카페에 올리기 좋게). 화면을 캡처하지 않고 캔버스에 직접 그려서
// 아이콘·버튼 같은 화면 요소 없이 글자만 선명하게 나온다. 아기 생년월일은 넣지 않고, 이름은 이미지에 쓸지 고를 수 있다.
import { addDays, DOW_KO, dowOf, md } from './date'
import { ingredientName } from './ingredients'
import { mealItems, sortMeals } from './meal'
import type { MealPlans } from './types'

const W = 1080
const PAD = 48
const ROW_MIN = 92

const INK = '#2B2118'
const SUB = '#6B5A4A'
const LINE = '#E7DCCB'
const SOFT = '#FFF3DC'
const ACCENT = '#F5B544'
const ALLERGY = '#9A3412'

export type ShareOptions = { weekStart: string; plans: MealPlans; babyName?: string; siteUrl: string }

/** 칸 폭에 맞게 글자를 줄바꿈한다 */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const lines: string[] = []
  let line = ''
  for (const ch of text) {
    const next = line + ch
    if (ctx.measureText(next).width > maxW && line) {
      lines.push(line)
      line = ch === ' ' ? '' : ch
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

export async function renderWeekImage({ weekStart, plans, babyName, siteUrl }: ShareOptions): Promise<Blob> {
  await document.fonts?.ready
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const font = (px: number, weight = 400) => `${weight} ${px}px "IBM Plex Sans KR", "Noto Sans KR", sans-serif`
  const display = (px: number) => `400 ${px}px "Jua", "IBM Plex Sans KR", sans-serif`
  const dayCol = 150
  const textW = W - PAD * 2 - dayCol - 24

  // 높이를 먼저 계산한다
  const probe = document.createElement('canvas').getContext('2d')!
  probe.font = font(28)
  const rows = days.map((d) => {
    const meals = sortMeals(plans[d]?.meals ?? [])
    const lines = meals.map((m) => {
      const names = mealItems(m)
        .filter((id) => id !== m.base)
        .map(ingredientName)
        .join(' · ')
      const text = `${m.label} ${names || '메뉴 미정'}${m.allergen ? ` · 알레르기 테스트 ${ingredientName(m.allergen)}` : ''}`
      return { text: wrap(probe, text, textW), allergen: Boolean(m.allergen) }
    })
    const lineCount = lines.reduce((n, l) => n + l.text.length, 0) || 1
    return { d, lines, h: Math.max(ROW_MIN, 36 + lineCount * 38) }
  })
  const headH = 170
  const footH = 120
  const H = headH + rows.reduce((n, r) => n + r.h, 0) + footH

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, W, H)

  // 머리글
  ctx.fillStyle = SOFT
  ctx.fillRect(0, 0, W, headH - 20)
  ctx.fillStyle = ACCENT
  ctx.fillRect(0, headH - 26, W, 6)
  ctx.fillStyle = INK
  ctx.textBaseline = 'alphabetic'
  ctx.font = display(54)
  ctx.fillText(babyName ? `${babyName}의 이번 주 이유식` : '이번 주 이유식 식단표', PAD, 84)
  ctx.font = font(28)
  ctx.fillStyle = SUB
  const end = addDays(weekStart, 6)
  ctx.fillText(`${md(weekStart).month}.${md(weekStart).day} ~ ${md(end).month}.${md(end).day}`, PAD, 128)

  // 요일별 줄
  let y = headH
  for (const r of rows) {
    ctx.strokeStyle = LINE
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(PAD, y)
    ctx.lineTo(W - PAD, y)
    ctx.stroke()
    const dow = dowOf(r.d)
    ctx.fillStyle = dow === 0 ? '#B91C1C' : dow === 6 ? '#1D4ED8' : INK
    ctx.font = display(40)
    ctx.fillText(DOW_KO[dow], PAD, y + 56)
    ctx.fillStyle = SUB
    ctx.font = font(24)
    ctx.fillText(`${md(r.d).month}.${md(r.d).day}`, PAD + 52, y + 56)
    let ty = y + 46
    if (r.lines.length === 0) {
      ctx.fillStyle = SUB
      ctx.font = font(28)
      ctx.fillText('식단 없음', PAD + dayCol, ty)
    }
    for (const line of r.lines) {
      ctx.fillStyle = line.allergen ? ALLERGY : INK
      ctx.font = font(28, line.allergen ? 600 : 400)
      for (const t of line.text) {
        ctx.fillText(t, PAD + dayCol, ty)
        ty += 38
      }
    }
    y += r.h
  }
  ctx.strokeStyle = LINE
  ctx.beginPath()
  ctx.moveTo(PAD, y)
  ctx.lineTo(W - PAD, y)
  ctx.stroke()

  // 꼬리글: 사이트 주소(자연스러운 유입 통로)
  ctx.fillStyle = SUB
  ctx.font = font(24)
  ctx.fillText('식단표는 참고용이에요. 새 재료나 알레르기 재료는 소아청소년과와 상의해 주세요.', PAD, y + 48)
  ctx.fillStyle = INK
  ctx.font = display(32)
  ctx.fillText(`맘마 · ${siteUrl.replace(/^https?:\/\//, '')}`, PAD, y + 92)

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('이미지를 만들지 못했어요'))), 'image/png'))
}

/** 공유 창(휴대폰)을 쓸 수 있으면 열고, 아니면 PNG를 내려받는다. 어느 쪽이든 true */
export async function shareOrDownload(blob: Blob, fileName: string, text: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const file = new File([blob], fileName, { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text })
      return 'shared'
    } catch (e) {
      if ((e as { name?: string }).name === 'AbortError') return 'cancelled'
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'downloaded'
}
