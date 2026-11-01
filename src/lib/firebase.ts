// Firebase 연결. 설정값(VITE_FIREBASE_*)이 없으면 cloudEnabled=false라서 로그인·서버 저장이 꺼지고
// 앱은 지금처럼 이 기기(localStorage)에만 저장한다. 설정 방법: docs/FIREBASE_SETUP.md
// SDK는 설정이 있을 때만 동적으로 불러온다(설정이 없으면 번들·네트워크 비용 0).
import type { FirebaseApp } from 'firebase/app'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
}

const appCheckKey = import.meta.env.VITE_FIREBASE_APPCHECK_KEY as string | undefined
/** 'enterprise'(기본, Firebase 권장) 또는 'v3'. 키를 발급받은 종류와 맞춰야 한다 */
const appCheckProvider = (import.meta.env.VITE_FIREBASE_APPCHECK_PROVIDER as string | undefined) === 'v3' ? 'v3' : 'enterprise'

export const cloudEnabled = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId)

let appPromise: Promise<FirebaseApp> | null = null

function ensureApp() {
  if (!cloudEnabled) return Promise.reject(new Error('Firebase 설정이 없어요 (docs/FIREBASE_SETUP.md)'))
  appPromise ??= import('firebase/app').then(async (m) => {
    const app = m.initializeApp(config)
    // App Check: 내 사이트가 아닌 곳에서 서버를 마음대로 쓰지 못하게 한다 (reCAPTCHA v3 키가 있을 때만 켠다)
    if (appCheckKey) {
      try {
        if (import.meta.env.DEV) (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true
        const { initializeAppCheck, ReCaptchaEnterpriseProvider, ReCaptchaV3Provider } = await import('firebase/app-check')
        const provider = appCheckProvider === 'v3' ? new ReCaptchaV3Provider(appCheckKey) : new ReCaptchaEnterpriseProvider(appCheckKey)
        initializeAppCheck(app, { provider, isTokenAutoRefreshEnabled: true })
      } catch (e) {
        console.warn('[맘마] App Check를 시작하지 못했어요', e)
        // App Check를 못 켜도 앱은 동작한다 (콘솔에서 '시행'을 켠 뒤에는 서버가 거부하므로 키 설정을 확인)
      }
    }
    return app
  })
  return appPromise
}

/** Firestore 오류를 콘솔에 남기고(원인 파악용), 규칙 문제면 그렇다고 알려 주는 문구를 돌려준다 */
export function describeFirestoreError(e: unknown, fallback: string) {
  const code = (e as { code?: string })?.code ?? ''
  console.warn('[맘마] 서버 오류', code, e)
  if (code === 'permission-denied') return `${fallback} (서버 규칙이 이 기능을 아직 허용하지 않아요. 운영자가 Firebase 규칙을 게시해야 해요)`
  if (code === 'unavailable' || code === 'failed-precondition') return `${fallback} (인터넷 연결을 확인해 주세요)`
  return fallback
}

export async function getFirebaseAuth() {
  const [app, { getAuth }] = await Promise.all([ensureApp(), import('firebase/auth')])
  return getAuth(app)
}

export async function getDb() {
  const [app, { getFirestore }] = await Promise.all([ensureApp(), import('firebase/firestore')])
  return getFirestore(app)
}
