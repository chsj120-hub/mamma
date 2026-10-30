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
        const { initializeAppCheck, ReCaptchaV3Provider } = await import('firebase/app-check')
        initializeAppCheck(app, { provider: new ReCaptchaV3Provider(appCheckKey), isTokenAutoRefreshEnabled: true })
      } catch {
        // App Check를 못 켜도 앱은 동작한다 (콘솔에서 '시행'을 켠 뒤에는 서버가 거부하므로 키 설정을 확인)
      }
    }
    return app
  })
  return appPromise
}

export async function getFirebaseAuth() {
  const [app, { getAuth }] = await Promise.all([ensureApp(), import('firebase/auth')])
  return getAuth(app)
}

export async function getDb() {
  const [app, { getFirestore }] = await Promise.all([ensureApp(), import('firebase/firestore')])
  return getFirestore(app)
}
