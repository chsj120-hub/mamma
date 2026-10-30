// 서버(Firestore) 저장. 사용자 한 명당 users/{uid}/data/{키} 문서 하나씩, 값은 JSON 문자열로 넣는다.
// (JSON 문자열로 두면 undefined·중첩 배열 같은 Firestore 제약에 걸리지 않는다)
import { getDb } from './firebase'

/**
 * 서버에 올리는 키. 실행취소 기록(snapshots)은 식단 전체의 사본이 최대 20개라 문서 한도(1MB)를 넘을 수 있어
 * 이 기기에만 둔다. 화면 보기 설정(보기 방식·기간 등)도 기기별로 둔다.
 */
export const SYNC_KEYS = ['profile', 'mealPlans', 'cubes', 'reactions', 'milestones', 'growth'] as const
export type SyncKey = (typeof SYNC_KEYS)[number]

export const isSyncKey = (key: string): key is SyncKey => (SYNC_KEYS as readonly string[]).includes(key)

/** 서버에 저장된 이 사용자의 데이터를 모두 가져온다 (키 → JSON 문자열) */
export async function pullAll(uid: string) {
  const [db, { collection, getDocs }] = await Promise.all([getDb(), import('firebase/firestore')])
  const snap = await getDocs(collection(db, 'users', uid, 'data'))
  const out: Record<string, string> = {}
  snap.forEach((d) => {
    const json = d.data().json
    if (typeof json === 'string' && isSyncKey(d.id)) out[d.id] = json
  })
  return out
}

/**
 * 서버의 데이터가 바뀔 때마다 (키, JSON)을 알려 준다. 이 기기가 아직 서버에 확정하지 않은 쓰기(hasPendingWrites)는 건너뛴다.
 * 동기 함수로 구독 해제 함수를 돌려주기 위해, SDK는 안에서 불러온다.
 */
export function subscribe(uid: string, onChange: (key: string, json: string) => void): () => void {
  let off: (() => void) | null = null
  let stopped = false
  void (async () => {
    try {
      const [db, { collection, onSnapshot }] = await Promise.all([getDb(), import('firebase/firestore')])
      if (stopped) return
      off = onSnapshot(
        collection(db, 'users', uid, 'data'),
        (snap) => {
          snap.docChanges().forEach((ch) => {
            if (ch.type === 'removed' || ch.doc.metadata.hasPendingWrites) return
            const json = ch.doc.data().json
            if (typeof json === 'string' && isSyncKey(ch.doc.id)) onChange(ch.doc.id, json)
          })
        },
        () => {
          // 권한·네트워크 오류: 다음 로그인 때 다시 가져온다
        },
      )
    } catch {
      // SDK를 못 불러오면 실시간 반영만 빠진다
    }
  })()
  return () => {
    stopped = true
    off?.()
  }
}

export async function push(uid: string, key: SyncKey, value: unknown) {
  const [db, { doc, serverTimestamp, setDoc }] = await Promise.all([getDb(), import('firebase/firestore')])
  await setDoc(doc(db, 'users', uid, 'data', key), { json: JSON.stringify(value), updatedAt: serverTimestamp() })
}
