// 내 기록 내려받기(백업)와 가져오기(복원). 서버에 올라가는 키와 같은 데이터를 JSON 파일 하나로 다룬다.
// 가져오기는 형태를 확인한 뒤 같은 종류의 지금 기록을 통째로 바꾼다 (실행취소 기록은 이 기기 전용이라 포함하지 않는다).
import { SYNC_KEYS, type SyncKey } from './cloud'
import { load, notifyRemoteChange, save } from './storage'

const APP = 'mamma-backup'
const VERSION = 1

export type BackupFile = { app: typeof APP; version: number; exportedAt: string; data: Partial<Record<SyncKey, unknown>> }

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** 키별로 기대하는 모양 (깨진 파일로 앱이 망가지지 않게 최소한만 확인) */
const SHAPE: Record<SyncKey, (v: unknown) => boolean> = {
  profile: (v) => isObj(v) && typeof v.name === 'string' && typeof v.birthDate === 'string' && typeof v.stage === 'string',
  mealPlans: (v) => isObj(v) && Object.values(v).every((d) => isObj(d) && Array.isArray(d.meals)),
  cubes: Array.isArray,
  reactions: Array.isArray,
  milestones: isObj,
  growth: Array.isArray,
}

export function buildBackup(): BackupFile {
  const data: BackupFile['data'] = {}
  for (const key of SYNC_KEYS) {
    const v = load<unknown>(key, null)
    if (v !== null) data[key] = v
  }
  return { app: APP, version: VERSION, exportedAt: new Date().toISOString(), data }
}

export function backupFileName(now = new Date()) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `mamma-backup-${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}.json`
}

export function downloadBackup() {
  const blob = new Blob([JSON.stringify(buildBackup(), null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = backupFileName()
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export type ParsedBackup = { ok: true; backup: BackupFile; keys: SyncKey[] } | { ok: false; message: string }

export function parseBackup(text: string): ParsedBackup {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, message: '파일을 읽지 못했어요. 맘마에서 내려받은 .json 파일이 맞는지 확인해 주세요.' }
  }
  if (!isObj(raw) || raw.app !== APP || !isObj(raw.data)) return { ok: false, message: '맘마 백업 파일이 아니에요.' }
  if (typeof raw.version === 'number' && raw.version > VERSION) return { ok: false, message: '더 새로운 버전에서 만든 파일이라 가져올 수 없어요. 맘마를 새로고침한 뒤 다시 시도해 주세요.' }
  const keys: SyncKey[] = []
  for (const key of SYNC_KEYS) {
    if (!(key in raw.data)) continue
    if (!SHAPE[key](raw.data[key])) return { ok: false, message: `파일의 '${key}' 내용이 올바르지 않아요.` }
    keys.push(key)
  }
  if (keys.length === 0) return { ok: false, message: '가져올 기록이 파일에 없어요.' }
  return { ok: true, backup: raw as BackupFile, keys }
}

/** 파일에 있는 키만 지금 기록 위에 덮어쓴다 (서버 동기화는 save()가 알아서 한다) */
export function applyBackup(backup: BackupFile, keys: SyncKey[]) {
  for (const key of keys) {
    save(key, backup.data[key])
    notifyRemoteChange(key)
  }
}
