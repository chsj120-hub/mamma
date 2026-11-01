# 문의·오류 텔레그램 알림 설정

새 문의·오류 신고가 들어오면 내 텔레그램으로 알려 줘요. **봇 토큰은 앱(브라우저) 코드에 절대 넣지 않고**, 알림을 보내는 쪽(내 PC 또는 GitHub 서버)의 환경변수에만 둬요. 앱 코드에 넣으면 누구나 토큰을 꺼내 스팸을 보낼 수 있어요.

```
앱 → Firestore(feedback·errors) ← 15분마다 확인 ← GitHub Actions(scripts/inbox.mjs) → 텔레그램 봇 → 내 휴대폰
```

## 1. 텔레그램 봇 만들기 (5분)
1. 텔레그램 앱(휴대폰 또는 PC)에서 검색창에 **@BotFather**를 검색해요. 이름 옆에 파란 체크 표시가 있는 공식 계정이에요.
2. 대화를 열고 `/newbot`을 보내요.
3. 봇의 **표시 이름**을 물어요. 예: `맘마 알림`
4. 봇의 **사용자 이름(username)**을 물어요. 영문·숫자·밑줄만 되고 **반드시 `bot`으로 끝나야** 해요. 예: `mamma_alert_bot` (이미 쓰인 이름이면 다른 이름을 시도해요)
5. 성공하면 이런 메시지가 와요.
   ```
   Use this token to access the HTTP API:
   123456789:AAExampleExampleExampleExampleExample
   ```
   이 **긴 문자열이 봇 토큰**이에요. 비밀번호와 같아서 아무에게도 보내지 말고 채팅창·메일·git에 올리지 마세요.
6. 토큰이 유출됐다면 BotFather에게 `/revoke`를 보내 새 토큰을 받고, 아래 설정 값을 바꿔요.

## 2. 내 chat id 찾기 (봇이 나에게 메시지를 보내려면 필요해요)
1. 방금 만든 봇을 검색해서 열고 **Start**를 누른 뒤 아무 말(예: `안녕`)이나 보내요. (먼저 말을 걸지 않으면 봇이 나에게 보낼 수 없어요.)
2. 프로젝트 폴더에서 PowerShell을 열고 토큰을 **이 창에서만** 지정해요(창을 닫으면 사라져요).
   ```bash
   cd "C:\Users\chsj1\OneDrive\바탕 화면\mamma"
   ```
   ```bash
   $env:TELEGRAM_BOT_TOKEN = "여기에 토큰"
   ```
   ```bash
   node scripts/inbox.mjs --find-chat-id
   ```
3. `chat id: 123456789 (private, ...)` 같은 줄이 나와요. 이 숫자가 **chat id**예요.
   - 아무것도 안 나오면 1번의 "봇에게 먼저 메시지 보내기"를 안 한 거예요. 보낸 뒤 다시 실행하세요.
   - 가족·팀과 함께 받고 싶다면 그룹을 만들어 봇을 초대하고, 그룹에 아무 말이나 한 뒤 같은 명령을 실행해요. 그룹의 chat id는 `-100...`처럼 음수예요.
4. PowerShell에서 `npm`이 막히면 `npm.cmd`를 쓰세요. 위 `node` 명령은 그대로 돼요.

## 3. 내 PC에서 먼저 테스트
같은 PowerShell 창에서 이어서 해요.
```bash
$env:TELEGRAM_CHAT_ID = "위에서 찾은 숫자"
```
```bash
node scripts/inbox.mjs --test
```
- 휴대폰 텔레그램에 "맘마 알림 테스트예요"가 오면 봇 설정은 끝이에요.
- 서비스 계정 키(`mamma-admin.json`)로 실제 문의 확인까지 해 보려면:
  ```bash
  node scripts/inbox.mjs --key "C:\Users\chsj1\keys\mamma-admin.json" --dry
  ```
  `--dry`는 보내지도 기록하지도 않고 화면에만 보여 줘요. 문제가 없으면 `--dry`를 빼고 실행해요. 그러면 텔레그램으로 오고, "여기까지 봤다"는 표시(Firestore의 `ops/inboxState`)를 남겨서 이미 보낸 건 다시 안 와요.

## 4. GitHub Actions에 올려서 PC 없이 자동으로 돌리기
1. GitHub 저장소(`chsj120-hub/mamma`) → **Settings → Secrets and variables → Actions → New repository secret**로 3개를 만들어요. 이름은 정확히 아래와 같아야 해요.

| 이름 | 값 |
|---|---|
| `TELEGRAM_BOT_TOKEN` | 1번에서 받은 봇 토큰 |
| `TELEGRAM_CHAT_ID` | 2번에서 찾은 숫자 |
| `FIREBASE_SERVICE_ACCOUNT` | 서비스 계정 키 JSON 파일을 메모장으로 열어 **내용 전체**를 복사해 붙여넣기 |

2. 저장소의 **Actions** 탭 → 왼쪽 "문의·오류 텔레그램 알림" → **Run workflow**로 한 번 실행해요. 초록색 체크가 뜨고 새 문의가 있으면 텔레그램으로 와요.
3. 이후에는 **15분마다 자동**으로 확인해요(GitHub 사정으로 몇 분 늦을 수 있어요).

### 서비스 계정 권한 (보안)
- 이 키는 **Firestore 전체를 읽고 쓸 수 있어요**(사용자 기록 포함). GitHub Secrets에 암호화돼 저장되고 로그에 찍히지 않지만, 유출되면 영향이 커요.
- 가능하면 알림 전용 서비스 계정을 따로 만드세요: Google Cloud 콘솔 → IAM 및 관리자 → 서비스 계정 → 만들기 → 역할 **Cloud Datastore 사용자** → 키(JSON) 생성. 이 경우에도 Firestore 전체 접근이라는 점은 같지만, 관리자 키와 분리해서 필요할 때 따로 폐기할 수 있어요.
- 키가 유출됐거나 필요 없어지면 콘솔의 서비스 계정 화면에서 키를 삭제하고 Secrets를 갱신해요.
- 저장소가 **공개(public)**여도 Secrets는 안전하지만 Actions 실행 로그는 공개돼요. 그래서 스크립트는 Actions에서는 문의 내용을 출력하지 않고 개수만 남겨요.
- 공개 저장소는 60일 동안 저장소 활동이 없으면 예약 실행이 자동으로 꺼져요. 꺼지면 Actions 탭에서 다시 켜세요.

## 5. 이렇게 동작해요
- 새 **문의**는 한 건씩 메시지로, 새 **오류**는 같은 것끼리 묶어 한 번에 와요(오류가 폭주해도 알림이 쏟아지지 않아요). 문의가 한 번에 20건을 넘으면 나머지는 다음 실행에서 이어서 와요.
- 보낸 뒤 `ops/inboxState`에 마지막 시각을 저장해요. 앱 규칙은 이 컬렉션을 일반 사용자가 읽지 못하게 막고 있어요.
- 문의에 적힌 답받을 이메일은 메시지에 같이 와요. 답장은 직접 보내세요.

## 문제가 생기면
| 증상 | 원인 |
|---|---|
| `Unauthorized: invalid token` | 토큰을 잘못 붙여넣었거나 `/revoke`로 바뀌었어요 |
| `chat not found` | 봇에게 먼저 Start를 보내지 않았거나 chat id가 틀렸어요 |
| `서비스 계정이 필요해요` | `--key` 경로가 틀렸거나 Actions Secret 이름이 달라요 |
| Actions가 빨간색 | 해당 실행을 열어 마지막 줄의 한국어 오류 문구를 확인해요 |
| 알림이 안 오는데 초록색 | 새 문의·오류가 없는 거예요(`새 문의·오류가 없어요`) |
