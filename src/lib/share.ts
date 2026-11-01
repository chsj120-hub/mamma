// 앱 추천하기(공유) 링크와 공유 동작.
// 링크는 /r/<출처> 모양이라, 방문 분석(Cloudflare Web Analytics)의 '경로' 표에서 출처별 방문 수를 볼 수 있다 (docs/ANALYTICS.md).
// 출처 이름에는 사람을 알아볼 수 있는 값을 넣지 않는다. 아래 정해진 이름만 쓴다.
export type ShareSource = 'share-guide' | 'share-settings' | 'share-login' | 'qr'

export const shareLink = (src: ShareSource) => `${location.origin}/r/${src}`

export const SHARE_TEXT = '아기 월령에 맞춰 이유식 식단과 홈큐브를 관리해요. 설치 없이 링크로 바로 열려요.'

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed'

/** 휴대폰은 공유 창(카카오톡·메시지 등)으로 바로 보내고, 그 밖에는 링크를 복사한다 */
export async function shareApp(src: ShareSource): Promise<ShareResult> {
  const url = shareLink(src)
  if (typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches) {
    try {
      await navigator.share({ title: '맘마 이유식 식단 플래너', text: SHARE_TEXT, url })
      return 'shared'
    } catch (e) {
      if ((e as { name?: string }).name === 'AbortError') return 'cancelled'
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    return 'failed'
  }
}

/** 링크를 QR 코드 그림(data URL)으로 만든다. 처음 쓸 때만 라이브러리를 불러온다 */
export async function qrDataUrl(text: string): Promise<string> {
  const { default: qrcode } = await import('qrcode-generator')
  const qr = qrcode(0, 'M')
  qr.addData(text)
  qr.make()
  return qr.createDataURL(6, 8)
}
