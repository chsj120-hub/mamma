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

## 스택과 구조

React 19 + Vite + Tailwind CSS 4 + TypeScript, react-router. 아직 git 저장소 아님.

- `src/index.css` — 테마·색상 토큰 (`@theme inline`). 새 색은 여기에 토큰으로 추가하고 컴포넌트에 hex를 흩뿌리지 않는다
- `src/lib/storage.ts` — localStorage 접근은 이 파일을 통해서만 (키 접두어 `mamma:`)
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
- 소진 기한: 직접 만든 큐브는 제조일 + 고기·생선 21일, 그 외 14일 / 시판 큐브는 포장에 적힌 소비기한(`Cube.source`, `Cube.expiresOn`)
- 알레르기 테스트는 같은 재료 3일 연속. 알레르기 재료 목록은 `ALLERGENS` (달걀·우유·밀·대두·땅콩·견과·참깨·생선·갑각류)
- 단계 기준(월령·횟수·1회량·한 끼 재료 수)은 `src/data/stageGuide.ts`, 재료별 도입 단계·순서는 `src/data/ingredientIntro.ts`. 숫자·순서는 여기서만 바꾼다 (자동 채우기 `lib/recommender.ts`와 화면 안내가 함께 따름)
- 자동 채우기: 새 재료는 한 번에 하나·3일 연속·첫 끼에, 섞는 재료는 3일 통과한 것만, 반응 있었던 재료 제외
- 알레르기 재료는 자동 채우기가 **새로 시작하지 않는다**. 대신 '알레르기 재료를 시작할 시기예요' 안내(`lib/allergenNotice.ts`)로 부모가 고르게 한다. 부모가 넣은 테스트는 3일까지 이어 준다
- 식단 수정·삭제·자동 추천·일괄 대체 시에는 스냅샷을 남긴다 (완료 토글은 제외)

## 건강 관련 수치·문구

- 권장량·횟수·기간처럼 아기 건강에 관한 **숫자는 출처(학회 원문, 공공기관 자료) 또는 담당 소아과 전문의 확인 후에만** 넣는다. 확인 전이면 값을 비워 두고 화면에 '입력 전'으로 보여 준다
- 숫자를 새로 넣을 땐 파일 주석에 출처를 적는다. 육아 사이트·블로그의 '공통값'은 출처로 충분하지 않다
- 현재 앱의 수치: 보관 21/14일·재고 2개·임박 3일(PRD), 3일 테스트(PRD), 새 음식 8~10번 재시도(사용자 제공 안내 문구), 채소 다양성 막대 10종(화면 눈금일 뿐 권장치 아님), `stageGuide.ts`(사용자 관리)
- 의료적 판단처럼 들리는 문구엔 '소아청소년과와 상의' 안내를 함께 둔다

## 지금은 하지 않는 것

- 로그인·Firebase·서버 — 나중 단계. 데이터는 localStorage
- 로그인을 붙일 때: 토큰은 localStorage가 아니라 HttpOnly 쿠키(또는 Firebase SDK 관리)에 둔다
- GUIDE.md의 텔레그램 예시처럼 **봇 토큰·비밀 키를 클라이언트 코드에 넣지 않는다**. 반드시 서버나 Cloud Function을 거친다
- 아기 이름·생년월일·보호자 이메일 외 민감 정보는 수집하지 않는다

## 확인

빌드 통과 후 브라우저(390px 폭)에서 해당 화면을 열어 동작·테마 3종을 직접 확인하고 결과를 그대로 보고한다.
