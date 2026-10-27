import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { DesktopLayout } from './components/DesktopLayout'
import { CubePage } from './pages/CubePage'
import { DashboardPage } from './pages/desktop/DashboardPage'
import { PcCubePage } from './pages/desktop/PcCubePage'
import { PcMilestonePage } from './pages/desktop/PcMilestonePage'
import { PcReportPage } from './pages/desktop/PcReportPage'
import { HomePage } from './pages/HomePage'
import { MilestonePage } from './pages/MilestonePage'
import { PlannerPage } from './pages/PlannerPage'
import { ReportPage } from './pages/ReportPage'
import { AppDataProvider } from './lib/data'
import { useIsDesktop } from './lib/device'
import { ThemeProvider } from './lib/theme'

export default function App() {
  return (
    <ThemeProvider>
      <AppDataProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppDataProvider>
    </ThemeProvider>
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
