// 함께 쓰는 사람(기록 주인 + 참여한 보호자)을 불러온다. 프로필 카드와 가족 공유 영역이 같이 쓴다.
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import type { FamilyInfo } from '../auth/types'

export type SharedPerson = { uid: string; name: string; role: 'owner' | 'member'; me: boolean; joinedAt?: string }

export function useHousehold() {
  const { household, familyEnabled, user } = useAuth()
  const [info, setInfo] = useState<FamilyInfo | null>(null)
  const uid = user?.uid
  const dataUid = user?.dataUid

  const refresh = useCallback(async () => {
    if (!familyEnabled || !uid) return setInfo(null)
    setInfo(await household())
  }, [familyEnabled, uid, household])

  // 내 기록 주인이 바뀌면(참여·나가기) 다시 불러온다
  useEffect(() => {
    void refresh()
  }, [refresh, dataUid])

  const people: SharedPerson[] = info
    ? [
        { uid: info.ownerUid, name: info.ownerName || '기록 주인', role: 'owner', me: info.ownerUid === uid },
        ...info.members.map((m) => ({ uid: m.uid, name: m.name || '가족', role: 'member' as const, me: m.uid === uid, joinedAt: m.joinedAt })),
      ]
    : []
  /** 나를 뺀 함께 쓰는 사람. 없으면 혼자 쓰는 중 */
  const others = people.filter((p) => !p.me)
  return { info, people, others, refresh }
}
