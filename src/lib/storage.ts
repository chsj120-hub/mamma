// localStorage 래퍼. 앱 데이터는 모두 여기를 거친다.
// 로그인하면 키 접두어가 사용자별로 바뀌고(setStoragePrefix), 저장할 때마다 서버 동기화 리스너가 불린다(setSaveListener).
import { useEffect, useRef, useState } from 'react'

const GUEST_PREFIX = 'mamma:'
let prefix = GUEST_PREFIX

type Fallback<T> = T | (() => T)
const resolve = <T,>(f: Fallback<T>) => (typeof f === 'function' ? (f as () => T)() : f)

type SaveListener = (key: string, value: unknown) => void
let onSave: SaveListener | null = null

export const guestPrefix = () => GUEST_PREFIX
export const userPrefix = (uid: string) => `${GUEST_PREFIX}u:${uid}:`

/** 이후 모든 읽기·쓰기가 이 접두어를 쓴다 (비로그인: 'mamma:', 로그인: 'mamma:u:<uid>:') */
export function setStoragePrefix(p: string) {
  prefix = p
}

/** 저장될 때마다 (key, value)로 불린다. 서버 동기화용. null이면 해제 */
export function setSaveListener(fn: SaveListener | null) {
  onSave = fn
}

const REMOTE_EVENT = 'mamma:remote'

/** 다른 기기에서 바뀐 값을 저장소에 써 넣은 뒤 부르면, 그 키를 쓰는 화면이 새 값을 다시 읽는다 */
export function notifyRemoteChange(key: string) {
  window.dispatchEvent(new CustomEvent(REMOTE_EVENT, { detail: key }))
}

export function load<T>(key: string, fallback: Fallback<T>): T {
  try {
    const raw = localStorage.getItem(prefix + key)
    if (raw !== null) return JSON.parse(raw) as T
  } catch {
    // 깨진 값이면 기본값 사용
  }
  return resolve(fallback)
}

export function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(prefix + key, JSON.stringify(value))
  } catch {
    // 저장 공간 부족·사생활 보호 모드 등은 조용히 무시
  }
  onSave?.(key, value)
}

/** 접두어를 지정해 raw 값을 읽고 쓰는 도구 (로그인 전후 데이터 옮길 때만 사용) */
export function readRaw(p: string, key: string): string | null {
  try {
    return localStorage.getItem(p + key)
  } catch {
    return null
  }
}

export function writeRaw(p: string, key: string, json: string) {
  try {
    localStorage.setItem(p + key, json)
  } catch {
    // 무시
  }
}

export function removeRaw(p: string, key: string) {
  try {
    localStorage.removeItem(p + key)
  } catch {
    // 무시
  }
}

/**
 * 로그인 없이(비로그인) 쓰던 데이터를 새 계정으로 옮기고 원래 자리에서는 지운다.
 * 계정 정보(auth:)·다른 계정의 데이터(u:)·로그인 화면 설정은 건드리지 않는다.
 */
export function adoptGuestData(toPrefix: string) {
  const skip = [GUEST_PREFIX + 'u:', GUEST_PREFIX + 'auth:', GUEST_PREFIX + 'mockcloud:', GUEST_PREFIX + 'lastLoginProvider']
  try {
    for (const k of Object.keys(localStorage)) {
      if (!k.startsWith(GUEST_PREFIX) || skip.some((x) => k.startsWith(x))) continue
      const v = localStorage.getItem(k)
      if (v === null) continue
      localStorage.setItem(toPrefix + k.slice(GUEST_PREFIX.length), v)
      localStorage.removeItem(k)
    }
  } catch {
    // 무시
  }
}

/** 해당 접두어로 저장된 키를 모두 지운다 (로그아웃 시 공용 PC에 사용자 데이터를 남기지 않기 위해) */
export function clearPrefix(p: string) {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(p))
      .forEach((k) => localStorage.removeItem(k))
  } catch {
    // 무시
  }
}

/** localStorage에 저장되는 useState. fallback이 함수면 저장된 값이 없을 때만 호출된다 */
export function useStoredState<T>(key: string, fallback: Fallback<T>) {
  const [value, setValue] = useState<T>(() => load(key, fallback))
  const fallbackRef = useRef(fallback)

  useEffect(() => {
    save(key, value)
  }, [key, value])

  // 다른 탭에서 바뀐 값도 반영
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === prefix + key) setValue(load(key, fallbackRef.current))
    }
    const onRemote = (e: Event) => {
      if ((e as CustomEvent<string>).detail === key) setValue(load(key, fallbackRef.current))
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener(REMOTE_EVENT, onRemote)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(REMOTE_EVENT, onRemote)
    }
  }, [key])

  return [value, setValue] as const
}
