// 약관·방침·동의 문서의 버전과 운영자 정보.
//
// ★ 공개(스토어 제출·광고 신청) 전에 반드시 아래 OPERATOR 값을 채워 주세요.
//    비어 있으면 문서 맨 위에 '운영자 정보 입력 필요' 안내가 보이고, 빈 칸은 [ ... 입력 필요]로 표시돼요.
// ★ 문서 내용(src/data/legalText.ts)은 일반적인 구조의 초안이에요. 공개 전에 법률 전문가나
//    개인정보보호위원회의 '개인정보 처리방침 작성지침'으로 한 번 검토해 주세요.
//
// 문서를 고쳐서 이용자에게 다시 동의를 받아야 하면 아래 날짜(버전)를 새 날짜로 바꾸세요.
// 로그인할 때 저장된 동의 버전과 다르면 동의 화면이 다시 나와요.

export const LEGAL_VERSIONS = {
  terms: '2026-11-01',
  privacy: '2026-11-01',
  /** 민감정보(건강정보) 수집·이용 동의 */
  sensitive: '2026-11-01',
} as const

export const OPERATOR = {
  /** 서비스 운영자 이름(개인 또는 사업자명) */
  name: '맘마앱 개발팀',
  /** 문의·권리 행사·계정 삭제 요청을 받을 이메일 */
  email: 'chsj120@gmail.com',
  /** 개인정보 보호책임자 이름 (운영자 본인이어도 적어요) */
  privacyOfficer: '전호선',
  /** Firestore 데이터 위치(리전). 예: 서울(asia-northeast3) */
  dataRegion: '서울(asia-northeast3)',
}

/** 필수 운영자 정보가 모두 채워졌는지 */
export const legalReady = Boolean(OPERATOR.name && OPERATOR.email && OPERATOR.privacyOfficer && OPERATOR.dataRegion)

/** 비어 있으면 '[라벨 입력 필요]' */
export const fill = (value: string, label: string) => value || `[${label} 입력 필요]`
