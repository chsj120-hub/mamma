import { Component, type ReactNode } from 'react'
import { reportError } from '../lib/feedback'

/** 화면 그리기 중 오류가 나도 흰 화면 대신 안내를 보여 주고, 오류를 운영자에게 보낸다 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    reportError(error)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div role="alert" className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg px-6 text-center">
        <h1 className="m-0 font-display text-[28px] font-normal">잠깐 문제가 생겼어요</h1>
        <p className="m-0 text-[15px] leading-relaxed text-sub">화면을 새로 불러오면 대부분 해결돼요. 기록은 지워지지 않았어요.</p>
        <button type="button" onClick={() => location.reload()} className="h-12 rounded-3xl border-none bg-ink px-6 text-[15px] font-bold text-white">
          새로 불러오기
        </button>
      </div>
    )
  }
}
