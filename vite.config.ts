import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // 오프라인 캐시(방식 B): 내가 쓴 src/sw.ts에 빌드된 파일 목록만 끼워 넣는다. 매니페스트는 public/manifest.webmanifest를 그대로 쓴다
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'prompt',
      injectRegister: false,
      manifest: false,
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,webp,png,svg}'],
        maximumFileSizeToCacheInBytes: 3_000_000,
      },
    }),
  ],
})
