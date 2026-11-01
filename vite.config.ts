import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import vercel from './vercel.json'

// 보안 헤더는 vercel.json 한 곳에서 관리한다. 빌드 결과 미리보기(vite preview)에도 같은 헤더를 걸어 브라우저 콘솔에서 확인할 수 있게 하고,
// Cloudflare Pages용 _headers 파일은 빌드 때 이 값으로 만든다(scripts/prerender.mjs)
const securityHeaders = Object.fromEntries(vercel.headers[0].headers.map((h) => [h.key, h.value]))

export default defineConfig({
  preview: { headers: securityHeaders },
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
