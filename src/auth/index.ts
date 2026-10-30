// 앱이 쓰는 인증 서비스를 고르는 곳.
// - Firebase 설정(VITE_FIREBASE_*)이 있으면 진짜 Google 로그인 + 서버 저장 (firebaseAuthService)
// - 없으면 가짜(mock) 로그인 — 개발·화면 확인용. 데이터는 이 브라우저에만 있다
import { cloudEnabled } from '../lib/firebase'
import { firebaseAuthService } from './firebaseAuthService'
import { mockAuthService } from './mockAuthService'
import type { AuthService, Provider } from './types'

export const authService: AuthService = cloudEnabled ? firebaseAuthService : mockAuthService

/** 로그인 화면에 보여 줄 소셜. 지금은 Google만 (카카오·네이버는 서버 작업이 필요해서 다음 단계) */
export const ENABLED_PROVIDERS: Provider[] = ['google']

export { PROVIDERS, PROVIDER_NAME } from './types'
export type { AuthService, AuthUser, Provider, SignInOptions, SignInResult } from './types'
