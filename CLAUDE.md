# 맘마 이유식 식단 플래너

아기 월령에 맞춰 이유식 식단·홈큐브(냉동 큐브) 재고·성장 리포트를 관리하는 모바일 우선 웹앱.

## 참고 문서 (작업 전에 관련 부분을 읽을 것)

- `PRD.md` — 기능 명세 (D-Day 계산, 플래너, 홈큐브 알림, 스냅샷/실행취소, 성장 리포트)
- `GUIDE.md` — 로그인·보안·데이터 수집·알림·출시 체크리스트 (아직 대부분 미구현 단계)
- `design/README.md` — 디자인 토큰, 화면 목록, 아이콘 이름
- `design/screens/*.dc.html` — 화면 시안. 화면을 만들 땐 `/port-screen` 스킬 절차를 따른다

## 명령

- `npm run dev` — 개발 서버 (http://localhost:5173). GUIDE.md의 "포트 3000"은 이 프로젝트에 해당하지 않음
- `npm run build` — `tsc --noEmit` + 프로덕션 빌드. 작업이 끝나면 반드시 통과시킬 것
- `npm test` — 추천 규칙 안전 불변조건 테스트(vitest). `lib/recommender.ts`·`lib/allergenPlan.ts`·`data/stageGuide.ts`를 고치면 반드시 통과시킬 것

## 스택과 구조

React 19 + Vite + Tailwind CSS 4 + TypeScript, react-router. GitHub: chsj120-hub/mamma, Vercel로 배포.

**웹앱 전용**: 스토어 앱·설치형(Capacitor 등)은 만들지 않는다. 링크·도메인으로 PC·모바일 모두 접속한다. 수익화·운영 방향은 `docs/MONETIZATION.md`, `docs/OPERATIONS.md`

- `src/index.css` — 색상 토큰 (`@theme inline`). 색 테마는 **웜 톤 하나**뿐이다(전환 기능 없음). 새 색은 여기에 토큰으로 추가하고 컴포넌트에 hex를 흩뿌리지 않는다
- `src/lib/storage.ts` — localStorage 접근은 이 파일을 통해서만 (키 접두어 `mamma:`, 로그인하면 `mamma:u:<uid>:`로 사용자별 분리)
- `src/lib/data.tsx` — 앱 데이터(아기 프로필·식단·홈큐브) 상태. 화면은 `useAppData()`로만 읽고 쓴다
- `src/lib/types.ts` / `ingredients.ts` / `date.ts` / `cube.ts` / `stage.ts` — 도메인 타입과 순수 계산 로직
- `src/components/` — 공용 UI, `src/pages/` — 탭별 화면

### 모바일 / PC

- 폭 1024px 이상이면 PC (`useIsDesktop()`, `src/lib/device.ts`). `App.tsx`가 같은 라우트에 레이아웃만 바꿔 끼운다
  - 모바일: `AppLayout` (하단 탭 4개: `/`, `/planner`, `/cube`, `/report`)
  - PC: `DesktopLayout` (사이드 메뉴 240px + 본문 최대 1200px·여백 32px. 메뉴: `/` 식단 플래너, `/cube`, `/report`, `/milestone`)
  - PC에서 `/planner`는 `/`로 보낸다. `/milestone`은 모바일에서도 열림 (리포트의 '전체 단계' 링크)
- 모든 라우트가 모바일 페이지(`src/pages/`)와 PC 페이지(`src/pages/desktop/`)를 따로 가진다. PC 전용 조각은 `src/components/desktop/`
- 마일스톤은 3묶음(초기/중기/후기·완료기, `src/lib/milestones.ts`), 지금 묶음은 월령으로 자동. 가이드의 하루 횟수·1회 권장량은 `src/data/stageGuide.ts` (사용자가 관리 — 임의로 값을 넣거나 바꾸지 말 것)
- PC 화면도 데이터(`useAppData`)·아이콘·배지·카드 컴포넌트는 모바일 것을 재사용하고 배치만 다르게. 넓은 표·캘린더는 가로 스크롤 박스 안에

### 로그인·동기화 (`src/auth/`)

- 화면 코드는 `useAuth()`(`src/auth/AuthProvider.tsx`)와 `AuthService` 인터페이스(`src/auth/types.ts`)만 안다. 구현은 `src/auth/index.ts`에서 고른다
  - Firebase 설정(`VITE_FIREBASE_*`)이 있으면 `firebaseAuthService`(Google 로그인 + Firestore), 없으면 `mockAuthService`(가짜 로그인, 개발용)
  - 지금은 **Google만** 노출 (`ENABLED_PROVIDERS`). 카카오·네이버는 서버 함수가 필요해 다음 단계
- 가족 공유: 초대 코드로 참여하면 `AuthUser.dataUid`(기록 주인 uid)가 초대한 사람의 uid가 된다. 서버 호출(pullAll·push·subscribe)은 `dataUid`, 로그인·동의·탈퇴는 `uid`. 규칙·구조는 `docs/OPERATIONS.md` §4
- 사용자 데이터는 uid별로 분리되고, 로그인하면 서버(`users/{uid}/data/{키}`)와 동기화된다 (불러오기 + 저장 + 실시간 구독). 서버에 올리는 키는 `src/lib/cloud.ts`의 `SYNC_KEYS`
- 웹앱 전용(스토어 앱·설치 없음, 링크·도메인으로 접속). 모바일·PC 모두 로그인 화면에서 바로 가입된다. 보안 규칙은 `firestore.rules` (규칙을 바꾸면 Firebase 콘솔에도 게시해야 한다)
- 설정 방법과 동작 설명: `docs/FIREBASE_SETUP.md`
- 오프라인 캐시: `src/sw.ts`(Workbox, vite-plugin-pwa injectManifest). 앱 파일만 캐시하고 Firebase·구글 주소는 캐시하지 않는다. 새 버전은 `UpdateBanner`로 안내(`lib/pwa.ts`). 오프라인 로그인 복원은 `auth/firebaseAuthService.ts`의 `rememberRegistry`
- 보안 헤더는 `vercel.json`이 단일 원본(CSP는 Report-Only 단계). 현황·켜는 순서는 `docs/SECURITY.md`. `.env`는 비밀이 없는 공개 설정(VITE_SITE_URL)이라 저장소에 올리고, 비밀은 `.env.local`에만
- 문의·오류 텔레그램 알림: `scripts/inbox.mjs` + `.github/workflows/inbox.yml`. 봇 토큰은 서버(Actions Secrets/내 PC 환경변수)에만, 앱 코드에는 절대 넣지 않는다. `docs/NOTIFY_SETUP.md`
- 가족 초대 링크: `/join/<코드>`로 들어오면 `lib/invite.ts`가 코드를 기억하고, 로그인·동의 뒤 `JoinInvitePage`가 참여를 확인한다(새 가입자는 아기 정보 입력을 건너뜀)
- 확인이 필요한 건강 수치·출처 불일치는 `docs/OPEN_ISSUES.md`, 방침 점검은 `docs/PRIVACY_CHECKLIST.md`, 법률 검토 절차·비용은 `docs/LEGAL_REVIEW.md`
- 활성 가구 측정: 하루 한 번 `activity/{날짜}_{가구}` 기록(`lib/activity.ts`), 집계는 `npm run stats -- --key <관리자키>`. 방문 분석은 `lib/analytics.ts`. `docs/ANALYTICS.md`
- 공개 가이드 `/guide`: 글은 `src/content/guide/*.json`(draft로 시작), 빌드 때 `scripts/prerender.mjs`가 정적 HTML·sitemap·robots를 만든다. 건강 수치는 출처 확인 뒤에만, `docs/GUIDE_CONTENT.md`
- 약관·동의·탈퇴: 흐름은 로그인 → 동의(`pages/ConsentPage.tsx`) → 아기 정보 → 앱. 공개 페이지 `/terms` `/privacy` `/delete-account`는 `App.tsx`에서 인증 밖에 있다. 문서 버전·운영자 정보는 `src/data/legal.ts`, 본문은 `src/data/legalText.ts`. 약관을 고치면 `LEGAL_VERSIONS`를 올려 다시 동의를 받는다. 자세한 건 `docs/LEGAL.md`

## 디자인 규칙

- 글자색은 테마 `text-ink`(또는 `text-text`/`text-sub`/`text-muted`). `accent`는 장식·진행 바에만 — 글자에 쓰면 대비가 부족함
- 상태 색(완료·임박·재고 부족·알레르기)은 테마와 무관하게 고정 토큰 사용. 색만으로 구분하지 말고 아이콘·문구를 함께
- 제목·숫자는 `font-display`(Jua), 본문은 기본(IBM Plex Sans KR)
- 터치 영역 최소 44px (`min-h-11`), 카드 모서리 18–22px, 기준 폭 390px
- 식재료 그림은 항상 `<IngredientIcon id=... />` (design/icons 34종, 목록은 `design/ICONS.md` ↔ `src/lib/ingredients.ts`). 이모지로 대체하지 않는다
- UI 문구는 한국어, 부드러운 존댓말("~해요")

## 도메인 규칙 (PRD 기준)

- 생후 일수: `Date.UTC`로 날짜만 비교 (`src/lib/date.ts`). `new Date()` 차이를 직접 나누지 말 것
- 재고 부족: 큐브 2개 미만 / 유통기한 임박: 남은 기한 3일 이내 또는 만료
- 소진 기한: 직접 만든 큐브는 제조일 + 7일(재료 구분 없음, 질병관리청 '식이영양(영유아)': 조리한 이유식은 냉동 1주일 이내) / 시판 큐브는 포장에 적힌 소비기한(`Cube.source`, `Cube.expiresOn`)
- 알레르기 테스트는 같은 재료 3일 연속. 알레르기 재료 목록은 `ALLERGENS` (달걀·우유·밀·대두·땅콩·견과·참깨·생선·갑각류)
- 단계 기준(월령·횟수·1회량·한 끼 재료 수)은 `src/data/stageGuide.ts`, 재료별 도입 단계·순서는 `src/data/ingredientIntro.ts`. 숫자·순서는 여기서만 바꾼다 (자동 채우기 `lib/recommender.ts`와 화면 안내가 함께 따름)
- 자동 채우기: 새 재료는 한 번에 하나·3일 연속·첫 끼에, 섞는 재료는 3일 통과한 것만, 반응 있었던 재료 제외
- 알레르기 재료는 자동 채우기가 **새로 시작하지 않는다**. 대신 '알레르기 재료를 시작할 시기예요' 안내(`lib/allergenNotice.ts`)로 부모가 고르게 한다. 부모가 넣은 테스트는 3일까지 이어 준다
- 식단 수정·삭제·자동 추천·일괄 대체 시에는 스냅샷을 남긴다 (완료 토글은 제외)
- 먹는 시간은 프로필 설정(`BabyProfile.mealsPerDay`, `mealTimes`)이 정하고, 식단을 새로 만들거나 AI가 채우거나 CSV로 넣을 때 기본 시간이 된다 (`mealSlots()` in `lib/meal.ts`)
- 하루 메뉴 AI 추천 3가지: `suggestDayMenus()`(`lib/recommender.ts`) → 식단 편집 창(`DayMenuSuggestions`). 그날 이미 먹은 끼니는 건드리지 않고, 부모가 넣어 둔 알레르기 테스트는 이어 간다
- 알레르기 테스트는 AI 채우기의 **별도 단계**(`AiFillSheet`)에서 주별로 추천·선택한다 (`lib/allergenPlan.ts`): 기본 월·화·수 3일, 첫 끼, 이미 확인했거나 반응 있었던 재료 제외, 한 주에 한 가지. 부모가 확인(버튼)해야 들어간다
- 식사 10분 전 알림은 앱이 열려 있는 동안만 동작한다 (`lib/notify.ts`, `docs/NOTIFICATIONS.md`). 닫힌 앱 푸시는 서버가 필요해 다음 단계

## 건강 관련 수치·문구

- 권장량·횟수·기간처럼 아기 건강에 관한 **숫자는 출처(학회 원문, 공공기관 자료) 또는 담당 소아과 전문의 확인 후에만** 넣는다. 확인 전이면 값을 비워 두고 화면에 '입력 전'으로 보여 준다
- 숫자를 새로 넣을 땐 파일 주석에 출처를 적는다. 육아 사이트·블로그의 '공통값'은 출처로 충분하지 않다
- 현재 앱의 수치: 보관 7일(질병관리청)·재고 2개·임박 3일(PRD), 3일 테스트(PRD), 새 음식 8~10번 재시도(사용자 제공 안내 문구), 채소 다양성 막대 10종(화면 눈금일 뿐 권장치 아님), `stageGuide.ts`(사용자 관리)
- 의료적 판단처럼 들리는 문구엔 '소아청소년과와 상의' 안내를 함께 둔다

## 지금은 하지 않는 것

- 카카오·네이버 로그인, 닫힌 앱 푸시 알림 — 다음 단계
- 로그인 토큰은 localStorage에 직접 저장하지 않는다 (Firebase SDK가 관리)
- GUIDE.md의 텔레그램 예시처럼 **봇 토큰·비밀 키를 클라이언트 코드에 넣지 않는다**. 반드시 서버나 Cloud Function을 거친다
- 아기 이름·생년월일·보호자 이메일 외 민감 정보는 수집하지 않는다

## 확인

빌드 통과 후 브라우저(390px 폭)에서 해당 화면을 열어 동작·테마 3종을 직접 확인하고 결과를 그대로 보고한다.
