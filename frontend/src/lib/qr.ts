import { fetchWithFingerprint } from './fingerprint'

export interface AlicloudQRResponse {
  success: boolean
  session_id?: string
  qr_code_url?: string
  expires_in?: number
  error?: string
}

export interface AlicloudStatusResponse {
  success: boolean
  status?: 'WAITING' | 'SCANED' | 'CONFIRMED' | 'EXPIRED'
  error?: string
}

export interface AlicloudUserInfoResponse {
  success: boolean
  user_info?: { nick_name?: string; user_id?: string }
  access_token?: string
  refresh_token?: string
  error?: string
}

export interface Cloud115QRResponse {
  qrcode: string
  uid: string
  [key: string]: unknown
}

export const QR_IMAGE_API = 'https://api.qrserver.com/v1/create-qr-code/'

export function qrImageUrl(data: string, size = 240): string {
  return `${QR_IMAGE_API}?size=${size}x${size}&data=${encodeURIComponent(data)}`
}

export async function generateAlicloudQR(): Promise<AlicloudQRResponse> {
  const res = await fetchWithFingerprint('/alicloud2/generate_qr')
  return res.json()
}

export async function checkAlicloudStatus(sessionId: string): Promise<AlicloudStatusResponse> {
  const res = await fetchWithFingerprint(`/alicloud2/check_login?session_id=${sessionId}`)
  return res.json()
}

export async function getAlicloudUserInfo(sessionId: string): Promise<AlicloudUserInfoResponse> {
  const res = await fetchWithFingerprint(`/alicloud2/get_user_info?session_id=${sessionId}`)
  return res.json()
}

export async function logoutAlicloud(sessionId: string): Promise<void> {
  try {
    await fetchWithFingerprint(`/alicloud2/logout?session_id=${sessionId}`)
  } catch {
    /* 忽略清理会话失败 */
  }
}

export async function generateCloud115QR(): Promise<Cloud115QRResponse> {
  const res = await fetch('/115cloud_qr/get_qr')
  if (!res.ok) throw new Error(res.statusText)
  return res.json()
}

export async function checkCloud115Status(body: Cloud115QRResponse): Promise<string> {
  const res = await fetch('/115cloud_qr/check_status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(res.statusText)
  return res.text()
}
