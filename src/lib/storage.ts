// localStorage 래퍼. 나중에 Firebase로 옮길 때 이 파일만 바꾸면 되도록 한 곳에 모아 둔다.
import { useEffect, useRef, useState } from 'react'

const PREFIX = 'mamma:'

type Fallback<T> = T | (() => T)
const resolve = <T,>(f: Fallback<T>) => (typeof f === 'function' ? (f as () => T)() : f)

export function load<T>(key: string, fallback: Fallback<T>): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw !== null) return JSON.parse(raw) as T
  } catch {
    // 깨진 값이면 기본값 사용
  }
  return resolve(fallback)
}

export function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // 저장 공간 부족·사생활 보호 모드 등은 조용히 무시
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
      if (e.key === PREFIX + key) setValue(load(key, fallbackRef.current))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key])

  return [value, setValue] as const
}
