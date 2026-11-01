# 공개 가이드(`/guide`) 만들기와 정적 HTML

> 식단 예시·경험담·재료별 후기처럼 **직접 쓰는 글**은 `docs/GUIDE_WRITING.md`와 `docs/guide-templates/`를 보세요.

## 글 하나 추가하는 법
1. `src/content/guide/새글주소.json` 파일을 만들어요(주소는 영문 소문자·하이픈). 기존 파일을 복사해 고치면 돼요.
2. 필드: `slug`(파일 이름과 같게), `title`, `description`(검색 결과에 보이는 한두 문장), `category`, `order`(작을수록 앞), `updated`(마지막 확인일), `draft`, `sections`(소제목 `h` + 문단 `p` 또는 목록 `ul`), `sources`(출처 `label`·`url`), `faq`(선택).
3. `npm run dev`에서 `/guide/새글주소`로 확인해요. 목록(`/guide`)에는 자동으로 올라가요.
4. `npm run build`를 하면 `dist/guide/새글주소/index.html`이 만들어지고 sitemap에 반영돼요.

## 초안 → 공개
- 모든 글은 `"draft": true`로 시작해요. 초안은 검색에 노출되지 않고(noindex) sitemap에서 빠지고, 화면에 "초안이에요" 안내가 보여요.
- 공개하려면 ① `[작성 필요]` 자리를 모두 채우고 ② 숫자(횟수·양·기간)마다 **출처**(질병관리청·식약처·대한소아청소년과학회 같은 원문)를 `sources`에 넣고 ③ `updated`를 확인한 날로 고친 뒤 ④ `draft` 줄을 지워요.
- 출처 없이 숫자를 쓰지 않아요(CLAUDE.md 건강 수치 규칙). 확신이 없으면 "소아청소년과와 상담해 주세요"로 둬요.
- 첫 글이 공개되면 `/guide` 목록도 자동으로 검색에 노출돼요.

## 정적 HTML은 무엇이고 왜 만드나
맘마는 **SPA**예요. 서버가 보내 주는 HTML에는 `<div id="root"></div>`만 있고, 글 내용은 브라우저가 JS를 실행해야 나타나요. 사람은 문제없지만 **검색 로봇·광고 심사 로봇은 JS를 못 읽거나 늦게 읽을 수 있어요.** 그래서 빌드할 때 글을 **미리 HTML로 그려 파일로 저장**해 둬요.

```
npm run build
 1) vite build                 → 앱 화면 (JS 번들)
 2) vite build --ssr ...       → 글을 HTML 글자로 바꿔 주는 임시 번들(.ssr/)
 3) scripts/prerender.mjs      → 글마다 dist/guide/<글>/index.html 저장
                                  + sitemap.xml, robots.txt 생성
```
- 로봇이 `/guide/allergen-start`를 요청하면 **내용이 이미 들어 있는 HTML**을 받아요(제목·설명·canonical·공유 정보도 글마다 달라요).
- 사람이 열면 같은 내용이 먼저 보이고, JS가 켜지면 React가 똑같은 화면으로 이어받아요(겉모습은 같아요).
- 가이드·약관·방침·계정 삭제 안내가 대상이고, 로그인 뒤 화면은 대상이 아니에요(원래 로봇이 볼 수 없어요).
- 같은 컴포넌트(`src/pages/GuidePages.tsx`)를 브라우저와 빌드가 함께 써서 두 군데를 따로 고칠 일이 없어요.

## 사이트 주소
공유 이미지·sitemap·canonical에 쓰는 주소는 `.env`의 `VITE_SITE_URL`이에요. 자체 도메인을 연결하면 그 값을 바꾸고(또는 호스팅 환경변수로 덮어쓰기) 다시 배포하세요.

## 노출(나중에)
네이버 서치어드바이저와 구글 서치 콘솔에 사이트·sitemap 등록. 광고 신청은 글이 충분히 쌓이고 도메인을 산 뒤에(`docs/MONETIZATION.md`).
