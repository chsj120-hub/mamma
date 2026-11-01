// 활성 가구 집계 (운영자가 내 PC에서 실행). 사용법과 준비물은 docs/ANALYTICS.md
//   node scripts/stats.mjs --key C:\경로\serviceAccount.json
// 관리자 키는 Firebase 콘솔 → 프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성. 절대 git에 올리지 않는다(.gitignore에 패턴이 있다).
import { readFileSync } from 'node:fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const args = process.argv.slice(2)
const keyPath = args[args.indexOf('--key') + 1] || process.env.GOOGLE_APPLICATION_CREDENTIALS
if (!keyPath) {
  console.error('관리자 키 경로가 필요해요: node scripts/stats.mjs --key <serviceAccount.json>')
  process.exit(1)
}
initializeApp({ credential: cert(JSON.parse(readFileSync(keyPath, 'utf8'))) })
const db = getFirestore()

const dayKey = (d) => d.toISOString().slice(0, 10)
const addDays = (key, n) => dayKey(new Date(Date.parse(key + 'T00:00:00Z') + n * 86_400_000))
const mondayOf = (key) => {
  const dow = new Date(key + 'T00:00:00Z').getUTCDay()
  return addDays(key, -((dow + 6) % 7))
}
const today = dayKey(new Date())

const usersCount = (await db.collection('users').count().get()).data().count
const onboarded = (await db.collection('users').where('onboarded', '==', true).count().get()).data().count

const snap = await db.collection('activity').get()
/** 날짜 → 그날 연 가구 집합 */
const byDay = new Map()
/** 가구 → 처음 연 날짜 */
const first = new Map()
for (const doc of snap.docs) {
  const { d, h } = doc.data()
  if (!byDay.has(d)) byDay.set(d, new Set())
  byDay.get(d).add(h)
  if (!first.has(h) || d < first.get(h)) first.set(h, d)
}
const households = (from, to) => {
  const set = new Set()
  for (let d = from; d <= to; d = addDays(d, 1)) byDay.get(d)?.forEach((h) => set.add(h))
  return set
}

console.log(`\n맘마 활성 가구 (${today} 기준, 접속 기록은 최근 90일)\n`)
console.log(`가입 계정 ${usersCount}명 · 아기 정보까지 마친 계정 ${onboarded}명\n`)

console.log('일간 활성 가구 (최근 14일)')
for (let i = 13; i >= 0; i--) {
  const d = addDays(today, -i)
  const n = byDay.get(d)?.size ?? 0
  console.log(`  ${d}  ${String(n).padStart(4)}  ${'#'.repeat(Math.min(n, 60))}`)
}

console.log('\n주간 활성 가구 (월~일, 최근 8주)')
const thisMonday = mondayOf(today)
const weeks = []
for (let i = 7; i >= 0; i--) {
  const start = addDays(thisMonday, -7 * i)
  const set = households(start, addDays(start, 6))
  weeks.push({ start, set })
  console.log(`  ${start} 주  ${String(set.size).padStart(4)}${i === 0 ? '  (이번 주, 진행 중)' : ''}`)
}

console.log('\n다음 주 재방문율 (그 주에 처음 연 가구 중, 다음 주에도 연 비율)')
for (let i = 0; i < weeks.length - 1; i++) {
  const { start, set } = weeks[i]
  const newcomers = [...set].filter((h) => mondayOf(first.get(h)) === start)
  if (newcomers.length === 0) continue
  const nextSet = weeks[i + 1].set
  const back = newcomers.filter((h) => nextSet.has(h)).length
  console.log(`  ${start} 주 신규 ${newcomers.length}가구 → 다음 주 ${back}가구 (${Math.round((back / newcomers.length) * 100)}%)${i === weeks.length - 2 ? '  (다음 주가 진행 중이라 낮게 나올 수 있어요)' : ''}`)
}
console.log('\n※ 접속 기록은 이 기능을 켠 날부터 쌓여요. 처음 몇 주는 숫자가 작게 보이는 게 정상이에요.')
