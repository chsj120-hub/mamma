---
name: port-screen
description: design/screens/*.dc.html 시안을 이 프로젝트의 React 화면으로 옮길 때 쓰는 절차. "OO 화면 만들어줘", "Planner/Cube/Calendar/Report/Desktop 화면" 요청에 사용.
---

# 시안 → React 화면 옮기기

1. **시안 읽기**: `design/screens/<Name>.dc.html` 전체를 읽는다.
   - `{{...}}` 템플릿 값, `<sc-for>` 반복, `<sc-if>` 조건부. 맨 아래 `<script>`의 `renderVals()`에 샘플 데이터와 상태 로직이 있다.
   - `{{accent}}` → `bg-accent`, `{{accentSoft}}` → `bg-soft`, `{{accentInk}}` → `text-ink`.
2. **PRD 확인**: `PRD.md`에서 이 화면의 기능 명세를 찾아 시안에 없는 동작(알림 조건, 계산 규칙)을 보충한다.
3. **데이터**: 샘플 값을 화면에 하드코딩하지 않는다. 필요한 타입은 `src/lib/types.ts`, 계산은 `src/lib/*.ts` 순수 함수로, 저장은 `useAppData()`(`src/lib/data.tsx`)를 통해서. 새 샘플이 필요하면 `src/lib/seed.ts`에 추가.
4. **스타일**: inline style 수치를 Tailwind 클래스로 옮기되 색은 `src/index.css` 토큰만 사용 (`CLAUDE.md` 디자인 규칙). 공통 조각(카드, 칩, 버튼)은 `src/components/`에 이미 있으면 재사용.
5. **라우트**: 하단 탭 화면은 `src/App.tsx`의 `Placeholder`를 실제 페이지로 교체.
6. **확인**: `npm run build` 통과 → 브라우저 390px 폭에서 열어 상호작용과 테마 3종을 확인 → 새로고침 후 저장 유지 확인.
