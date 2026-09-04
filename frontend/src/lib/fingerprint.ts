let clientFingerprint: string | null = null

/** 生成客户端指纹（用于阿里云盘扫码会话校验） */
export function generateClientFingerprint(): string {
  if (clientFingerprint) return clientFingerprint

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillText('Client fingerprint', 2, 2)
  }

  const parts = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}`,
    new Date().getTimezoneOffset().toString(),
    canvas.toDataURL(),
    (navigator.hardwareConcurrency || 'unknown').toString(),
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory?.toString() || 'unknown',
  ]

  const raw = parts.join('|')
  let hash = 0
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }

  clientFingerprint = Math.abs(hash).toString(36)
  return clientFingerprint
}

/** 携带客户端指纹发送请求 */
export async function fetchWithFingerprint(url: string, options: RequestInit = {}): Promise<Response> {
  const fingerprint = generateClientFingerprint()
  return fetch(url, {
    ...options,
    headers: {
      'X-Client-Fingerprint': fingerprint,
      ...(options.headers || {}),
    },
  })
}
