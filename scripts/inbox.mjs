// 새 문의·오류를 텔레그램으로 알려 주는 스크립트. 사용법과 준비물은 docs/NOTIFY_SETUP.md
//
// 봇 토큰은 브라우저(앱 코드)에 넣지 않고 이 스크립트가 도는 곳(내 PC 또는 GitHub Actions)의 환경변수에만 둔다.
//
//   node scripts/inbox.mjs --find-chat-id                      내 chat id 찾기 (봇에게 먼저 메시지를 보낸 뒤)
//   node scripts/inbox.mjs --test                              텔레그램 테스트 메시지 보내기
//   node scripts/inbox.mjs --key C:\경로\admin.json --dry      새 문의·오류를 화면에 보여 주기만 (보내지도, 기록하지도 않음)
//   node scripts/inbox.mjs --key C:\경로\admin.json            새 문의·오류를 텔레그램으로 보내고 '여기까지 봄' 표시를 남김
//
// 환경변수: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, (Actions에서는) FIREBASE_SERVICE_ACCOUNT = 서비스 계정 JSON 내용
// 이미 보낸 것은 다시 보내지 않는다 ('여기까지 봄' 시각은 Firestore의 ops/inboxState 문서에 저장. 앱 규칙상 일반 사용자는 읽을 수 없다)
import { readFileSync } from 'node:fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// 오류가 나면 스택 대신 이유만 보여 준다 (토큰이 화면에 남지 않게)
for (const ev of ['uncaughtException', 'unhandledRejection']) {
  process.on(ev, (e) => {
    console.error(e instanceof Error ? e.message : String(e))
    process.exit(1)
  })
}

const args = process.argv.slice(2)
const has = (f) => args.includes(f)
const TOKEN = process.env.TELEGRAM_BOT_TOKEN
const CHAT = process.env.TELEGRAM_CHAT_ID
/** GitHub Actions 로그는 공개될 수 있어서, Actions에서는 내용을 출력하지 않고 개수만 남긴다 */
const quiet = process.env.GITHUB_ACTIONS === 'true'

const MAX_FEEDBACK = 20
const KIND = { bug: '오류 신고', idea: '기능 제안', other: '문의' }
const cut = (s, n) => (s.length > n ? s.slice(0, n) + '…' : s)

async function telegram(method, body) {
  if (!TOKEN) throw new Error('TELEGRAM_BOT_TOKEN 환경변수가 없어요')
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!json.ok) throw new Error(`텔레그램 오류: ${json.description ?? res.status}`)
  return json.result
}

const send = (text) => telegram('sendMessage', { chat_id: CHAT, text: cut(text, 3800), disable_web_page_preview: true })

if (has('--find-chat-id')) {
  const updates = await telegram('getUpdates', {})
  const chats = new Map()
  for (const u of updates) {
    const c = (u.message ?? u.channel_post ?? u.my_chat_member)?.chat
    if (c) chats.set(c.id, c)
  }
  if (chats.size === 0) {
    console.log('아직 메시지가 없어요. 텔레그램에서 내 봇을 열어 Start를 누르고 아무 말이나 보낸 뒤 다시 실행해 주세요.')
  } else {
    for (const c of chats.values()) console.log(`chat id: ${c.id}  (${c.type}${c.username ? ', @' + c.username : ''}${c.first_name ? ', ' + c.first_name : ''}${c.title ? ', ' + c.title : ''})`)
  }
  process.exit(0)
}

if (!CHAT) {
  console.error('TELEGRAM_CHAT_ID 환경변수가 없어요 (--find-chat-id로 찾을 수 있어요)')
  process.exit(1)
}

if (has('--test')) {
  await send('맘마 알림 테스트예요. 이 메시지가 보이면 설정이 끝났어요.')
  console.log('테스트 메시지를 보냈어요.')
  process.exit(0)
}

// ---- 문의·오류 가져오기
const keyPath = args[args.indexOf('--key') + 1]
const json = process.env.FIREBASE_SERVICE_ACCOUNT ?? (keyPath && !keyPath.startsWith('--') ? readFileSync(keyPath, 'utf8') : null)
if (!json) {
  console.error('서비스 계정이 필요해요: --key <파일> 또는 환경변수 FIREBASE_SERVICE_ACCOUNT')
  process.exit(1)
}
initializeApp({ credential: cert(JSON.parse(json)) })
const db = getFirestore()
const stateRef = db.doc('ops/inboxState')
const state = (await stateRef.get()).data() ?? {}
const dry = has('--dry')

const since = (field) => (typeof state[field] === 'string' ? state[field] : '')
const feedbackSnap = await db.collection('feedback').where('at', '>', since('feedbackAt')).orderBy('at').limit(100).get()
const errorSnap = await db.collection('errors').where('at', '>', since('errorsAt')).orderBy('at').limit(300).get()
const feedbacks = feedbackSnap.docs.map((d) => d.data())
const errors = errorSnap.docs.map((d) => d.data())

const out = (text) => (dry ? console.log(text + '\n') : send(text))

if (feedbacks.length === 0 && errors.length === 0) {
  console.log('새 문의·오류가 없어요.')
  process.exit(0)
}

for (const f of feedbacks.slice(0, MAX_FEEDBACK)) {
  await out(`📩 맘마 ${KIND[f.kind] ?? '문의'}\n\n${cut(String(f.message ?? ''), 2500)}\n\n연락처: ${f.contact || '(없음)'}\n화면: ${f.path ?? ''}\n시각: ${f.at ?? ''}`)
}
if (feedbacks.length > MAX_FEEDBACK) await out(`📩 문의가 ${feedbacks.length - MAX_FEEDBACK}건 더 있어요. Firebase 콘솔의 feedback 컬렉션에서 확인해 주세요.`)

if (errors.length > 0) {
  // 같은 오류는 묶어서 한 번만 알린다 (오류 폭주 때 알림이 쏟아지지 않게)
  const groups = new Map()
  for (const e of errors) {
    const key = String(e.message ?? '')
    const g = groups.get(key) ?? { n: 0, path: e.path ?? '', ua: e.ua ?? '' }
    g.n += 1
    groups.set(key, g)
  }
  const lines = [...groups].sort((a, b) => b[1].n - a[1].n).slice(0, 8).map(([m, g]) => `• (${g.n}번) ${cut(m, 200)}\n   화면: ${g.path}`)
  await out(`⚠️ 맘마 오류 ${errors.length}건 (${groups.size}종)\n\n${lines.join('\n')}`)
}

if (dry) {
  console.log('(--dry라서 보내지도 않았고, 여기까지 봤다는 표시도 남기지 않았어요)')
} else {
  // 보낸 것까지만 '봤다'고 표시한다. 문의가 20건을 넘으면 보낸 20건까지만 표시해서 나머지는 다음에 이어서 보낸다
  const lastFeedback = feedbacks.length > 0 ? feedbacks[Math.min(feedbacks.length, MAX_FEEDBACK) - 1].at : since('feedbackAt')
  const lastError = errors.length > 0 ? errors[errors.length - 1].at : since('errorsAt')
  await stateRef.set({ feedbackAt: lastFeedback, errorsAt: lastError, updatedAt: new Date().toISOString() })
}
console.log(quiet ? `알림: 문의 ${Math.min(feedbacks.length, MAX_FEEDBACK)}건, 오류 ${errors.length}건` : `완료: 문의 ${feedbacks.length}건, 오류 ${errors.length}건`)
