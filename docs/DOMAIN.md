# 자체 도메인 (Cloudflare) — 구매 후 설정 순서

지금은 하지 않고, 시범 운영 뒤 구매할 때 이 순서로 하면 돼요. 가격·메뉴 이름은 바뀔 수 있어요(확인 필요).

## 1. 구매
- Cloudflare 대시보드 → Domain Registration → 도메인 검색·구매(`.com` 권장, 갱신가가 원가 수준). 자동 갱신 켜기.
- 이름은 "맘마" 단독보다 구분되는 이름이 좋아요(검색·상표 겹침 확인).

## 2. 호스팅을 Cloudflare Pages로 옮기기 (권장)
광고를 붙이면 상업 이용이 돼서, Vercel 무료(Hobby)의 약관 제한을 피하려는 목적이에요.
1. Cloudflare → Workers & Pages → Pages → **Git 연결** → `chsj120-hub/mamma` 선택.
2. 빌드 설정: 빌드 명령 `npm run build`, 출력 폴더 `dist`, Node 버전은 기본값(문제가 있으면 환경변수 `NODE_VERSION`을 지정).
3. 환경변수에 Vercel에 넣었던 `VITE_FIREBASE_*` 4개, `VITE_SITE_URL=https://새도메인`, (선택) `VITE_CF_ANALYTICS_TOKEN`을 넣어요.
4. 배포가 끝나면 Pages의 **Custom domains**에서 새 도메인 연결(같은 계정이면 DNS가 자동 설정돼요).
5. SPA라 없는 주소는 `index.html`로 보내야 하는데, Pages는 `404.html`이 없으면 자동으로 그렇게 동작해요(확인 필요). `dist/guide/**/index.html` 같은 정적 파일은 그대로 먼저 서빙돼요.

## 3. 연결 직후 해야 할 일
1. **Firebase → Authentication → 설정 → 승인된 도메인**에 새 도메인 추가 (안 하면 로그인이 막혀요).
2. (App Check를 켰다면) reCAPTCHA 허용 도메인에 추가.
3. `.env`의 `VITE_SITE_URL`을 새 주소로(또는 호스팅 환경변수) → 다시 배포. 공유 이미지·sitemap·canonical이 새 주소로 바뀌어요.
4. Cloudflare Web Analytics 사이트를 새 호스트 이름으로 추가하고 토큰 교체.
5. **옛 주소(`mamma-one.vercel.app`)에서 새 주소로 자동 이동**: Vercel을 남겨 둘 거면 `vercel.json`에 `redirects`로 새 도메인 301 이동을 넣어요. 카페에 퍼진 링크가 계속 돼요.
6. 테스터 안내(`docs/TESTERS.md`): 새 주소에서는 로그인을 다시 해야 하고, 서버 기록은 돌아와요.
7. 운영자 정보와 방침 문구에서 호스팅 업체가 바뀌었다면(Vercel → Cloudflare) 방침의 처리위탁 항목은 이미 "또는 Cloudflare"로 적어 뒀어요. 그래도 한 번 확인해요.

## 4. 이후
- 네이버 서치어드바이저·구글 서치 콘솔에 새 주소와 `https://새도메인/sitemap.xml` 등록(`docs/GUIDE_CONTENT.md`).
