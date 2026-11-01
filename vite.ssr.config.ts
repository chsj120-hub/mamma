// 정적 HTML 미리 만들기(scripts/prerender.mjs)용 번들 설정. 화면용 빌드(vite.config.ts)와 달리 PWA 플러그인을 쓰지 않는다.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: { ssr: true, emptyOutDir: true },
  ssr: { noExternal: true },
})
