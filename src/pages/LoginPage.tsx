import { useIsDesktop } from '../lib/device'
import { AppLogin } from './login/AppLogin'
import { PcLogin } from './login/PcLogin'

/** 로그인하지 않은 상태에서 보이는 화면: 모바일 폭은 AppLogin, PC 폭(1024px 이상)은 PcLogin */
export function LoginPage() {
  return useIsDesktop() ? <PcLogin /> : <AppLogin />
}
