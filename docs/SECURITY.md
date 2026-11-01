# 보안 현황과 점검 (GUIDE.md 1.2 대응)

| GUIDE 항목 | 상태 | 어떻게 |
|---|---|---|
| HTTPS | ✅ | Vercel·Cloudflare가 기본 제공. `Strict-Transport-Security` 헤더도 추가 |
| 비밀번호 미저장 | ✅ | Google 로그인(OAuth)만 사용 |
| 토큰 보관 | ✅ (방식 다름) | 토큰은 Firebase SDK가 IndexedDB에 보관, localStorage에는 없음. HttpOnly 쿠키는 서버가 있어야 해서 서버 없는 구조에서는 불가 → **XSS를 막는 쪽**으로 방어 |
| XSS 방어 | ✅ | 코드에 `innerHTML`·`eval` 없음 + 보안 헤더(CSP Report-Only 포함) |
| 개인정보 최소화 | ✅ | 주민번호·위치 미수집. 건강정보(알레르기·섭취)는 별도 동의 |
| API 키·남용 방지 | 🟡 | 웹 키는 공개값, 보호는 보안 규칙 + 승인 도메인 + **App Check(키를 넣고 '시행'을 켜야 완성)** |
| Rate limiting | 🟡 | Firestore에는 없음 → App Check + 규칙의 크기 제한 + Spark 무료 한도(초과 시 차단) |

## 보안 헤더 (`vercel.json`이 단일 원본)
- `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: DENY`, `Permissions-Policy`, `Strict-Transport-Security`는 **바로 적용**돼요.
- `Content-Security-Policy-Report-Only`는 **차단하지 않고 위반만 브라우저 콘솔에 기록**해요. 로그인·Firestore 같은 외부 연결이 허용 목록에 빠져 앱이 깨지는 일을 막으려고 먼저 이 모드로 켰어요.
- Cloudflare Pages로 옮기면 빌드 때 `dist/_headers`가 같은 값으로 자동 생성돼요(`scripts/prerender.mjs`).

### CSP를 실제로 켜는 순서
1. 배포 후 **로그인한 상태**에서 모든 화면을 한 번씩 써 봐요: 로그인(구글 팝업), 식단 저장, 가족 초대, 문의 보내기, 이미지 공유, 출력, `/guide`.
2. 개발자 도구(F12) → Console에서 `[Report Only] Refused to ...` 줄을 찾아요. 빨간 줄이 없으면 허용 목록이 충분한 거예요.
3. 있으면 그 줄(어느 주소가 막혔는지)을 알려 주세요. `vercel.json`의 해당 `-src`에 그 주소를 더해요.
4. 며칠 써 봐서 위반이 없으면 `vercel.json`에서 키 이름을 `Content-Security-Policy-Report-Only` → `Content-Security-Policy`로 바꿔 **차단 모드**로 올려요.
5. 광고를 붙이게 되면 광고 회사의 스크립트·이미지 주소를 허용 목록에 더해야 해요.

> 로그인한 상태의 위반 여부는 이 개발 환경에서 확인하지 못했어요(구글 로그인 팝업을 열 수 없어요). 비로그인 화면(`/`, `/guide`, `/terms`)에서는 위반이 없었어요.

## App Check 켜기 (순서 중요)
`docs/OPERATIONS.md` §3. 요약: ① reCAPTCHA v3 키 발급 ② `VITE_FIREBASE_APPCHECK_KEY`를 Vercel에 넣고 재배포 ③ 앱이 정상인지 확인(콘솔 App Check 화면에 "확인된 요청" 비율이 뜸) ④ 그다음에 Firestore **시행**. 키 없이 시행부터 켜면 모두가 막혀요.
