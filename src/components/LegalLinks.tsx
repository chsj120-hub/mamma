/** 이용약관·개인정보 처리방침 링크. 새 탭으로 열어서 가입·동의 화면의 진행 상태가 그대로 남는다 */
export function LegalLinks({ className = '', separator = ' · ' }: { className?: string; separator?: string }) {
  const link = 'inline-flex min-h-11 items-center text-inherit underline'
  return (
    <span className={className}>
      <a href="/terms" target="_blank" rel="noopener noreferrer" className={link}>
        이용약관
      </a>
      {separator}
      <a href="/privacy" target="_blank" rel="noopener noreferrer" className={link}>
        개인정보 처리방침
      </a>
    </span>
  )
}
