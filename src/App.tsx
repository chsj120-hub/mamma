import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { DesktopLayout } from './components/DesktopLayout'
import { MealReminders, MorningBrief } from './components/MealReminders'
import { CubePage } from './pages/CubePage'
import { DashboardPage } from './pages/desktop/DashboardPage'
import { PcCubePage } from './pages/desktop/PcCubePage'
import { PcMilestonePage } from './pages/desktop/PcMilestonePage'
import { PcReportPage } from './pages/desktop/PcReportPage'
import { HomePage } from './pages/HomePage'
import { ConsentPage } from './pages/ConsentPage'
import { LegalPage } from './pages/LegalPage'
import { LoginPage } from './pages/LoginPage'
import { MilestonePage } from './pages/MilestonePage'
import { OnboardingPage } from './pages/OnboardingPage'
import { PlannerPage } from './pages/PlannerPage'
import { ReportPage } from './pages/ReportPage'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import { AppDataProvider } from './lib/data'
import { useIsDesktop } from './lib/device'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 약관·방침·계정 삭제 안내는 로그인 없이 볼 수 있는 공개 주소 */}
        <Route path="/terms" element={<LegalPage kind="terms" />} />
        <Route path="/privacy" element={<LegalPage kind="privacy" />} />
        <Route path="/delete-account" element={<LegalPage kind="delete-account" />} />
        <Route
          path="*"
          element={
            <AuthProvider>
              <AuthGate />
            </AuthProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

/**
 * 로그인 상태에 따라 보여 줄 화면을 정한다.
 * 로그인 안 됨 → 로그인 화면 / 약관 동의 전 → 동의 화면 / 아기 정보 입력 전 → 아기 정보 화면 / 그 밖에는 앱
 */
function AuthGate() {
  const { user, consented, onboarded } = useAuth()
  if (!user) return <LoginPage />
  if (!consented) return <ConsentPage />
  return (
    <AppDataProvider>
      {onboarded ? (
        <>
          <MealReminders />
          <MorningBrief />
          <AppRoutes />
        </>
      ) : (
        <OnboardingPage />
      )}
    </AppDataProvider>
  )
}

/** 모바일·PC가 같은 주소를 쓰고, 폭 1024px 기준으로 레이아웃만 바꾼다 */
function AppRoutes() {
  const desktop = useIsDesktop()

  return (
    <Routes>
      <Route element={desktop ? <DesktopLayout /> : <AppLayout />}>
        <Route index element={desktop ? <DashboardPage /> : <HomePage />} />
        {/* 모바일 식단 탭. PC에서는 '/'가 식단 플래너 */}
        <Route path="planner" element={desktop ? <Navigate to="/" replace /> : <PlannerPage />} />
        <Route path="cube" element={desktop ? <PcCubePage /> : <CubePage />} />
        <Route path="report" element={desktop ? <PcReportPage /> : <ReportPage />} />
        <Route path="milestone" element={desktop ? <PcMilestonePage /> : <MilestonePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
