# 카카오 로그인 설정 (중계 Worker 방식)

코드는 모두 들어 있어요(`workers/kakao-auth/`, `src/auth/kakao.ts` 등). 아래 순서로 **설정만 하면** 켜져요. 설정 전에는 로그인 화면에 카카오 버튼이 보이지 않아요(`VITE_ENABLE_KAKAO=true`일 때만 보여요). 가격·메뉴 이름은 바뀔 수 있어 **확인 필요**예요.

## 왜 이 방식인가요 (비용 비교)
| 방식 | 비용 | 메모 |
|---|---|---|
| Firebase **OpenID Connect**(Identity Platform) | 무료 요금제(Spark)에서는 하루 활성 사용자 **2명**까지, 종량제(Blaze)에서는 월 **50명 이상부터 1명당 약 $0.015** (Firebase·Google Cloud 문서 기준, 두 문서의 경계값이 달라 확인 필요) | 코드는 가장 간단하지만, 사용자가 늘면 비용이 생겨요. "적자 없이"라는 방향과 맞지 않아요 |
| **커스텀 토큰 + Cloudflare Worker** (이 방식) | **0원**: Firebase는 무료 요금제 그대로, Worker는 무료 플랜(하루 요청 10만 건, 확인 필요) | 카카오 로그인 → Worker가 확인 → Firebase 커스텀 토큰 발급. 직접 관리할 서버 코드가 생기지만 작고 테스트돼 있어요 |

```
[로그인 버튼] → 카카오 로그인 페이지 → 우리 사이트(/auth/kakao?code=...) 로 복귀
   → 브라우저가 코드를 Worker에 보냄 → Worker가 카카오에 확인(클라이언트 시크릿 사용) → Firebase 커스텀 토큰 발급
   → 브라우저가 토큰으로 Firebase 로그인 (uid = kakao:<카카오 회원번호>)
```
클라이언트 시크릿과 서비스 계정 키는 **Worker에만** 있고 앱(브라우저)에는 없어요. 이메일은 받지 않아요(받으려면 카카오 비즈 앱 전환과 심사가 필요하다고 알고 있어요).

## 1. 카카오 디벨로퍼스 설정 (약 20분)
1. `developers.kakao.com` → 로그인 → **내 애플리케이션 → 애플리케이션 추가하기**. 앱 이름 `맘마`(서비스 이름과 같게), 회사명은 운영자 이름.
2. 앱 설정 화면에서 **REST API 키**를 확인해요(공개돼도 되는 값이에요).
3. **카카오 로그인 → 사용 설정을 ON**으로 해요.
4. **Redirect URI** 등록 (정확히 이 형식, 끝에 슬래시 없이):
   - 지금: `https://mamma-one.vercel.app/auth/kakao`
   - 자체 도메인을 연결하면 `https://내도메인.com/auth/kakao`도 추가해요.
   - 개발 PC에서 시험하려면 `http://localhost:5173/auth/kakao`(카카오가 localhost를 허용하는지는 문서에서 확인하지 못했어요 — 확인 필요).
   - 등록하지 않거나 틀리면 `KOE006` 오류가 나요.
5. **동의항목**: **닉네임**만 쓰면 돼요. **이메일은 요청하지 않아요**(이메일 동의는 비즈 앱 전환과 심사가 필요하다고 알고 있어요). 동의항목 화면에서 닉네임이 선택 가능한지 확인하세요.
6. **클라이언트 시크릿**: 앱 → 플랫폼 키 → REST API 키 → 클라이언트 시크릿. 새 앱은 기본으로 켜져 있고, 이 값이 **비밀번호 같은 값**이에요. 아무에게도 보여 주지 말고 채팅·git에 올리지 마세요.
7. **플랫폼(Web) 사이트 도메인** 등록이 필요한 메뉴가 있으면 사이트 주소(`https://mamma-one.vercel.app`)를 등록해요(이 메뉴가 REST 방식에 필수인지는 문서에서 확인하지 못했어요).
8. **OpenID Connect는 켜지 않아도 돼요**(이 방식은 ID 토큰이 아니라 사용자 정보 조회를 써요).
9. **로고**: 카카오 디자인 가이드의 공식 "카카오 로그인" 버튼 이미지·로고를 받아 `src/assets/social/kakao.svg`(또는 png)로 넣어요. 안 넣으면 로고 없이 노란 버튼만 보여요.
10. **앱 상태·팀원**: 팀원이 아닌 일반 사용자도 로그인할 수 있는지(앱 검수나 공개 설정이 필요한지)는 카카오 앱 설정에서 확인해야 해요. 처음에는 **내 계정(팀원)으로 먼저 시험**하고, 아내분 등 다른 계정이 로그인되는지 확인하세요. 막히면 카카오 앱의 "앱 상태/검수/동의항목" 안내를 보세요.

## 2. Firebase 서비스 계정 만들기 (Worker가 커스텀 토큰에 서명할 열쇠)
1. Google Cloud 콘솔(맘마 프로젝트) → IAM 및 관리자 → **서비스 계정 → 서비스 계정 만들기**. 이름 `mamma-kakao-auth`. **역할은 부여하지 않아도** 돼요(확인 필요).
2. 만든 계정 → **키 → 키 추가 → 새 키 만들기 → JSON**. 파일이 내려받아져요(프로젝트 폴더 밖에 보관, git 제외).
3. JSON 안의 두 값을 쓸 거예요: `client_email`(이메일), `private_key`(`-----BEGIN PRIVATE KEY-----` 로 시작하는 긴 값).
4. 만약 나중에 로그인할 때 "invalid custom token" 오류가 나면, 이 계정에 역할이 필요한 경우일 수 있어요. 그때는 Firebase가 기본으로 만든 `firebase-adminsdk-...` 계정의 키를 써 보세요(더 강한 권한이라 가능하면 피하세요).

## 3. Cloudflare Worker 배포 (약 20분)
1. `cloudflare.com`에서 계정을 만들어요(무료). 도메인은 아직 없어도 돼요.
2. PowerShell에서 Worker 폴더로 이동해요.
   ```bash
   cd "C:\Users\chsj1\OneDrive\바탕 화면\mamma\workers\kakao-auth"
   ```
3. 로그인하고 비밀 값을 하나씩 넣어요. 명령을 실행하면 값을 붙여넣으라고 물어요(화면에 안 보여요).
   ```bash
   npx wrangler login
   ```
   ```bash
   npx wrangler secret put KAKAO_REST_API_KEY
   ```
   ```bash
   npx wrangler secret put KAKAO_CLIENT_SECRET
   ```
   ```bash
   npx wrangler secret put FIREBASE_SA_EMAIL
   ```
   ```bash
   npx wrangler secret put FIREBASE_SA_PRIVATE_KEY
   ```
   (`FIREBASE_SA_PRIVATE_KEY`는 JSON의 `private_key` 값 전체. `\n`이 글자로 들어 있어도 Worker가 처리해요.) 처음 `secret put`을 하면 Worker를 만들겠냐고 물을 수 있어요. `y`로 답하세요.
4. `wrangler.toml`의 `ALLOWED_ORIGINS`를 확인해요. 지금 사이트 주소(`https://mamma-one.vercel.app`)가 들어 있어요. 자체 도메인을 쓰면 쉼표로 이어서 추가해요(예: `"https://mamma-one.vercel.app,https://내도메인.com"`).
5. 배포해요.
   ```bash
   npx wrangler deploy
   ```
   끝나면 `https://mamma-kakao-auth.<내서브도메인>.workers.dev` 주소가 나와요. **이 주소를 복사**하세요.
6. 동작 확인: 브라우저로 그 주소를 열면 `{"error":"not_found"}`가 보여야 해요(정상이에요).

## 4. 사이트 설정 (Vercel 환경변수)
Vercel → Settings → Environment Variables에 3개를 추가하고 **재배포**해요(내 PC에서 시험하려면 `.env.local`에도 넣어요).
| 이름 | 값 |
|---|---|
| `VITE_KAKAO_REST_KEY` | 1-2의 REST API 키 |
| `VITE_KAKAO_AUTH_URL` | 3-5의 Worker 주소(끝에 슬래시 없이) |
| `VITE_ENABLE_KAKAO` | `true` |

- 보안 헤더(CSP)는 `*.workers.dev` 연결을 이미 허용해 뒀어요. 나중에 Worker에 자체 도메인을 붙이면 `vercel.json`의 `connect-src`에 그 주소를 더해요.

## 5. 규칙 게시와 방침 갱신 (켜기 전에 꼭)
1. **`firestore.rules`를 다시 게시**해요(가입 기록의 `provider`에 `kakao`를 허용하도록 바뀌었어요). 안 하면 카카오로 처음 가입할 때 "서버 접근이 거부됐어요"가 떠요.
2. **개인정보 처리방침과 동의 버전을 갱신**해요. 카카오를 켜면 수집·처리가 달라져요. 이건 `PRIVACY_CHECKLIST.md` 개정안과 같이 한 번에 하는 걸 권해요.
   - 수집 항목에 추가: 카카오 로그인 시 **카카오 회원번호, 닉네임**(이메일은 받지 않음).
   - 처리 위탁에 추가: **Kakao Corp.**(로그인), **Cloudflare, Inc.**(카카오 로그인 중계 Worker, 개인정보를 저장하지 않고 로그인 확인만 중계).
   - 국외 이전: Cloudflare Worker는 전 세계 서버에서 실행돼요(저장은 없음). 어떻게 표기할지는 `LEGAL_REVIEW.md`의 상담에서 물어보세요.
   - 수정 뒤 `src/data/legal.ts`의 `LEGAL_VERSIONS`를 올리면 모두에게 재동의 화면이 떠요.

## 6. 테스트 순서
1. **내 카카오 계정**으로 모바일에서 "카카오로 시작하기" → 카카오 로그인 → 맘마로 돌아옴 → 약관 동의 → 아기 정보 → 홈.
2. Firebase 콘솔 → Authentication 사용자에 `kakao:숫자` 사용자가 생기고, Firestore `users/kakao:숫자`에 가입 기록이 생겨야 해요.
3. 로그아웃 후 다시 카카오로 로그인 → 같은 기록이 보여요.
4. PC에서도 같은 카카오 계정으로 로그인 → 기록이 이어져요.
5. 아내분 등 **다른 카카오 계정**으로 로그인 → 새로 가입(기록이 안 섞임). 안 되면 1-10을 보세요.
6. 가족 초대 링크를 카카오 계정끼리도 시험해요.

### 문제가 생기면
| 증상 | 원인 |
|---|---|
| 카카오 페이지에서 `KOE006` | Redirect URI가 등록한 값과 다름 (끝 슬래시, http/https, 도메인 확인) |
| `KOE004` | 카카오 로그인 사용 설정이 OFF |
| 돌아온 뒤 "카카오 로그인에 실패했어요" | Worker 설정 문제. 브라우저 F12 콘솔의 `[맘마] 카카오 로그인 오류`와 네트워크 탭의 `/kakao/exchange` 응답 코드를 봐요: 403 → `ALLOWED_ORIGINS`에 사이트 주소가 없음, 400 → 주소·코드 문제, 401 → 클라이언트 시크릿·REST 키가 틀림, 500 → 서비스 계정 키 문제 |
| "카카오 로그인 확인에 실패했어요" | 10분이 지났거나 다른 탭에서 시작한 로그인 (다시 시도) |
| "서버 접근이 거부됐어요" | `firestore.rules` 미게시 |
| 로그인 화면에 카카오 버튼이 없음 | `VITE_ENABLE_KAKAO=true` 미설정 또는 재배포 안 함 |

## 알아 둘 것
- **구글과 카카오 계정은 별개예요.** 같은 사람이 둘 다 쓰면 기록이 따로 생겨요(카카오에서 이메일을 받지 않아 자동으로 합칠 수 없어요). 한 사람이 한 가지 방법만 쓰도록 안내하거나, 필요하면 나중에 "계정 연결" 기능을 만들 수 있어요.
- **회원 탈퇴**: 로그인한 지 5분이 지났다면 "다시 로그인한 뒤 탈퇴"를 안내해요(구글처럼 팝업 재확인이 안 되기 때문이에요).
- **카카오 쪽 연결 끊기**를 해도(사용자가 카카오 계정 설정에서) 맘마의 기록은 자동으로 지워지지 않아요. 탈퇴는 앱에서 해야 해요. (카카오 연결 끊기 알림 수신은 아직 만들지 않았어요.)
- **보안**: Worker는 허용한 사이트(`ALLOWED_ORIGINS`)와 정해진 주소(`/auth/kakao`)에서 온 요청만 처리하고, 카카오 코드를 시크릿으로 확인한 경우에만 토큰을 만들어요. 로그에는 사용자 정보를 남기지 않아요. 서비스 계정 키가 유출되면 콘솔에서 키를 삭제하고 `wrangler secret put`으로 새 키를 넣어요.
- **네이버 로그인**도 같은 방식(중계 Worker + 커스텀 토큰)으로 만들 수 있어요. 원하면 이 Worker를 확장해요.
- 테스트: `npm test`에 Worker(토큰 서명·검증, 잘못된 요청 거부)와 브라우저 쪽(state 확인) 테스트가 들어 있어요.
