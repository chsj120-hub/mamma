import { Outlet } from 'react-router-dom'
import { BottomTabBar } from './BottomTabBar'

export function AppLayout() {
  return (
    <div className="mx-auto min-h-dvh max-w-[480px] bg-bg pb-[104px]">
      <Outlet />
      <BottomTabBar />
    </div>
  )
}
