// 문의·오류 신고를 운영자에게 보낸다. 서버(Firestore)가 있으면 feedback/·errors/ 컬렉션에 새 글로 쌓이고(읽기 금지),
// 설정이 없는 개발 환경에서는 이 기기에만 남긴다. 아기 정보·계정 식별자는 보내지 않는다.
// 비밀 키가 필요한 알림(이메일·텔레그램)은 서버 함수에서 한다 — docs/OPERATIONS.md
import { cloudEnabled, getDb } from './firebase'
import { load, save } from './storage'

export type FeedbackKind = 'bug' | 'idea' | 'other'

const ua = () => navigator.userAgent.slice(0, 300)
const path = () => location.pathname.slice(0, 200)

async function add(collectionName: 'feedback' | 'errors', data: Record<string, string>) {
  if (!cloudEnabled) {
    // 개발 환경: 보낸 것처럼 이 기기에 남겨 흐름을 확인할 수 있게 한다
    const key = `dev-${collectionName}`
    save(key, [...load<unknown[]>(key, []), data].slice(-20))
    return
  }
  const [db, { addDoc, collection }] = await Promise.all([getDb(), import('firebase/firestore')])
  await addDoc(collection(db, collectionName), data)
}

export async function sendFeedback(kind: FeedbackKind, message: string, contact: string) {
  await add('feedback', {
    kind,
    message: message.trim().slice(0, 2000),
    contact: contact.trim().slice(0, 200),
    path: path(),
    ua: ua(),
    at: new Date().toISOString(),
  })
}

const sent = new Set<string>()
const MAX_REPORTS = 5

/** 처리하지 못한 오류를 한 번씩, 세션당 최대 5건만 보낸다 (실패해도 조용히 넘어간다) */
export function reportError(error: unknown) {
  try {
    const e = error instanceof Error ? error : new Error(String(error))
    const message = e.message.slice(0, 500)
    if (sent.size >= MAX_REPORTS || sent.has(message)) return
    sent.add(message)
    void add('errors', {
      message,
      stack: (e.stack ?? '').slice(0, 3000),
      path: path(),
      ua: ua(),
      mode: import.meta.env.MODE,
      at: new Date().toISOString(),
    }).catch(() => {})
  } catch {
    // 오류 보고가 앱을 더 깨뜨리면 안 된다
  }
}

export function installErrorReporting() {
  window.addEventListener('error', (e) => reportError(e.error ?? e.message))
  window.addEventListener('unhandledrejection', (e) => reportError(e.reason))
}
