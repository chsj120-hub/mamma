# 맘마 이유식 플래너 — 디자인 전달 패키지 (v2: PC 화면 포함)

이 폴더는 디자인 캔버스에서 만든 화면을 실제 앱(React + Vite + Tailwind)으로 옮기기 위한 참고 자료입니다.
프로젝트 폴더 안에 `design/`으로 넣고 Claude Code에게 참고하라고 알려주세요.
(v1 `design/` 폴더가 이미 있다면 통째로 이 폴더로 교체하세요. 모바일 화면 파일도 최신 버전입니다.)

## 구성

| 경로 | 내용 |
|---|---|
| `MASTER_PLAN.md` | 기획서 원본 (기능 명세, 테마 정의) |
| `PROMPTS.md` | Claude Code에 붙여 넣을 단계별 요청문 (모바일 + PC) |
| `ICONS.md` | 재료 아이콘 파일명 ↔ 한글 이름표 (34종) |
| **로그인** | |
| `screens/AppLogin.dc.html` | 00 앱 로그인·가입 (모바일, 카카오·네이버·Google) |
| `screens/PcLogin.dc.html` | 00 PC 로그인 (가입은 앱에서만, 미가입 계정 안내) |
| **모바일 (390×844)** | |
| `screens/Main.dc.html` | 01 홈 · 오늘의 식단 |
| `screens/Planner.dc.html` | 02 주간 식단 플래너 |
| `screens/Cube.dc.html` | 03 홈큐브 보관함 |
| `screens/Theme.dc.html` | 04 디자인 시스템 (테마·글꼴·상태 컬러) |
| `screens/Calendar.dc.html` | 05 월간 캘린더 |
| `screens/Report.dc.html` | 06 성장 리포트 |
| **PC (반응형, 기준 폭 1440)** | |
| `screens/Desktop.dc.html` | 07 PC 대시보드 (월간 캘린더 + 오늘의 식단) |
| `screens/PcCube.dc.html` | 08 PC 홈큐브 보관함 (재고 표, 수량 ±, 장보기 목록) |
| `screens/PcReport.dc.html` | 09 PC 성장 리포트 (주간/월간, 막대그래프, 알레르기 기록) |
| `screens/PcMilestone.dc.html` | 10 PC 마일스톤 (단계 탭, 체크리스트, 가이드) |
| `screens/PcPrint.dc.html` | 11 PC 출력 모달 (출력 종류·옵션, A4 미리보기) |
| `icons/*.svg` | 식재료·알레르기 미니 아이콘 34종 (24×24) |

`.dc.html` 파일은 디자인 툴 전용 형식입니다. 브라우저에서 바로 열리지는 않지만,
마크업의 inline style(색상·간격·크기)과 `<script>` 안의 샘플 데이터·상태 로직을 그대로 참고하면 됩니다.
(`{{...}}` 는 템플릿 값, `<sc-for>` 는 반복, `<sc-if>` 는 조건부 표시, `this.state` 는 화면 상태입니다.)

## 디자인 토큰

- 배경 `#FFFBF5` · 카드 `#FFFFFF` · 테두리 `#EFE4D6` · 구분선 `#F3EBE0` · 본문 `#2B2118` · 보조 글자 `#5C4A3A` / `#6B5A4A`
- 글꼴: 제목·숫자 **Jua**, 본문 **IBM Plex Sans KR** (Google Fonts)
- 테마 (accent / soft / ink — 글자색은 반드시 ink 사용)
  - Warm Amber(기본): `#F59E0B` / `#FEF3C7` / `#92400E`
  - Soft Blue: `#3B82F6` / `#DBEAFE` / `#1E40AF`
  - Nature Green: `#10B981` / `#D1FAE5` / `#065F46`
- 상태 컬러(테마 무관): 완료 `#15803D` · 기한 임박 `#B91C1C` · 재고 부족 `#9A3412` on `#FFF7ED` · 알레르기 `#6B21A8` on `#F3E8FF`
- 모서리: 카드 18–22px, 버튼 14–22px, 모달 26px · 터치/클릭 영역 최소 44px

## PC 레이아웃 규칙

- 왼쪽 사이드 메뉴(약 240px: 로고, 메뉴 4개, 테마 선택, 프로필) + 오른쪽 본문(최대 폭 1200px, 여백 32px)
- 창이 좁아지면 사이드 메뉴가 위로, 카드들은 세로로 쌓임 (flex-wrap)
- 넓은 표·캘린더는 가로 스크롤 박스 안에 둠
- 모바일과 PC는 같은 컴포넌트(재료 아이콘, 상태 배지, 카드)를 공유하고 배치만 다름

## 아이콘 이름

rice 쌀 · beef 소고기 · chicken 닭고기 · cod 대구살 · zucchini 애호박 · onion 양파 · broccoli 브로콜리 ·
pumpkin 단호박 · spinach 시금치 · potato 감자 · radish 무 · carrot 당근 · bokchoy 청경채 · sweetpotato 고구마 ·
pear 배 · apple 사과 · banana 바나나 · yolk 계란노른자 · wheat 밀가루

화면 속 아기 이름·재료·수치는 모두 예시 데이터입니다.
마일스톤의 '하루 횟수·1회 권장량'은 [가이드 기준 입력] 자리로, 확인한 기준으로 채워야 합니다.
