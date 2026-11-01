// '활성 가구' 측정용 접속일 기록. 앱을 연 가구(기록 주인 uid)마다 하루에 한 번, 이 기기에서 한 번만 `activity/{날짜}_{가구}`에 날짜를 남긴다.
// - 식단·큐브 같은 내용은 읽지 않는다. 날짜와 가구 식별자뿐이고, 90일 뒤 자동 삭제(TTL)된다 (docs/ANALYTICS.md)
// - 집계는 운영자가 scripts/stats.mjs로 한다. 사용자 화면에는 아무 영향이 없다
import { cloudEnabled, getDb } from './firebase'
import { todayKey } from './date'
import { guestPrefix, readRaw, writeRaw } from './storage'

const TTL_DAYS = 90

export async function recordActivity(uid: string, dataUid: string) {
  if (!cloudEnabled) return
  const today = todayKey()
  const marker = `activeOn:${uid}`
  if (readRaw(guestPrefix(), marker) === today) return
  // 실패해도 오늘은 다시 시도하지 않는다 (같은 날 같은 문서가 이미 있으면 규칙이 거부하는 것도 정상이다)
  writeRaw(guestPrefix(), marker, today)
  try {
    const [db, { doc, setDoc, Timestamp }] = await Promise.all([getDb(), import('firebase/firestore')])
    await setDoc(doc(db, 'activity', `${today}_${dataUid}`), {
      d: today,
      h: dataUid,
      expireAt: Timestamp.fromDate(new Date(Date.now() + TTL_DAYS * 86_400_000)),
    })
  } catch {
    // 측정이 앱을 방해하면 안 된다
  }
}
