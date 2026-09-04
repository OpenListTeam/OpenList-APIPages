export interface LoginPayload {
  driver: string
  serverUse: boolean
  clientUid: string
  clientKey: string
  secretKey: string
  refreshUi: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

/**
 * 请求登录 / 刷新令牌。
 * 返回：
 *  - { redirect: string } 需要跳转到第三方授权页
 *  - { token: TokenPair } 已拿到令牌
 *  - { sid, qr }: 阿里云盘旧版扫码（返回 sid 与二维码）
 *  - { raw }: 123 网盘直接返回文本令牌
 */
export interface LoginResult {
  redirect?: string
  token?: TokenPair
  sid?: string
  qr?: string
  raw?: string
}

async function buildLoginUrl(payload: LoginPayload, refresh: boolean): Promise<string> {
  const prefix = payload.driver.split('_')[0] === 'alicloud_cs' ? 'alicloud2' : payload.driver.split('_')[0]
  let url = `/${prefix}${refresh ? '/renewapi' : '/requests'}?client_uid=${encodeURIComponent(payload.clientUid)}`
  url += `&client_key=${encodeURIComponent(payload.clientKey)}`
  url += `&driver_txt=${encodeURIComponent(payload.driver)}`
  url += `&server_use=${payload.serverUse}`
  if (refresh) url += `&refresh_ui=${encodeURIComponent(payload.refreshUi)}`
  if (payload.driver.split('_')[0] === 'baiduyun') url += `&secret_key=${encodeURIComponent(payload.secretKey)}`
  return url
}

export async function requestLogin(payload: LoginPayload): Promise<LoginResult> {
  const url = await buildLoginUrl(payload, false)
  const res = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } })
  if (res.status !== 200) throw new HttpError(res.statusText, res.status)

  const data = await res.json()
  const driver = payload.driver

  // 阿里云盘旧版扫码（返回二维码 + sid）
  if (driver === 'alicloud_qr' || driver === 'alicloud_tv') {
    return { sid: data.sid, qr: data.text }
  }

  // 123 网盘直接返回令牌文本
  if (driver === '123cloud_go') {
    return { raw: data.text }
  }

  // 其余跳转型驱动
  return { redirect: data.text }
}

export async function requestRefresh(payload: LoginPayload): Promise<TokenPair> {
  const url = await buildLoginUrl(payload, true)
  const res = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } })
  if (res.status !== 200) throw new HttpError(res.statusText, res.status)
  const data = await res.json()
  return { accessToken: data.access_token, refreshToken: data.refresh_token }
}

export class HttpError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

/** 解析 URL hash 中的回调数据（Base64 编码的 JSON） */
export interface CallbackData {
  access_token?: string
  refresh_token?: string
  client_uid?: string
  client_key?: string
  secret_key?: string
  driver_txt?: string
  server_use?: string
  message_err?: string
}

export function parseCallbackHash(hash: string): CallbackData | null {
  if (!hash) return null
  try {
    const jsonBytes = Uint8Array.from(atob(hash), (c) => c.charCodeAt(0))
    const jsonText = new TextDecoder().decode(jsonBytes)
    return JSON.parse(jsonText) as CallbackData
  } catch {
    return null
  }
}

export function encodeCallbackData(data: Record<string, unknown>): string {
  return btoa(JSON.stringify(data))
}

// ===== 阿里云 PDS 设备授权 =====

export interface PdsDrive {
  drive_id: string
  drive_name: string
  owner_type?: string
  total_size?: number
  used_size?: number
}

export interface PdsDeviceAuthorization {
  device_code?: string
  user_code?: string
  verification_uri?: string
  verification_uri_complete?: string
  expires_in?: number
  interval?: number
  client_id?: string
  text?: string
  raw?: unknown
}

export interface PdsTokenResult {
  access_token?: string
  refresh_token?: string
  token_type?: string
  expires_at?: number
  status?: string
  text?: string
  raw?: unknown
}

export interface PdsDrivesResult {
  domain?: unknown
  drives?: PdsDrive[]
  my_drives?: unknown
  group_drives?: unknown
  text?: string
  raw?: unknown
}

export interface PdsResponse<T> {
  ok: boolean
  status: number
  data: T
}

async function pdsPost<T>(path: string, body: Record<string, unknown>): Promise<PdsResponse<T>> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let data: unknown = {}
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { text }
    }
  }
  return { ok: res.ok, status: res.status, data: data as T }
}

export function pdsMessage(data: unknown): string {
  if (!data || typeof data !== 'object') return '请求失败'
  const d = data as Record<string, unknown>
  return String(d.text || d.message || d.error_description || d.error || d.code || '请求失败')
}

export function pdsDeviceAuthorization(domainId: string, clientId: string, deviceName: string) {
  return pdsPost<PdsDeviceAuthorization>('/pds/device_authorization', {
    domain_id: domainId,
    client_id: clientId,
    device_name: deviceName,
  })
}

export function pdsDeviceToken(domainId: string, clientId: string, deviceCode: string) {
  return pdsPost<PdsTokenResult>('/pds/device_token', {
    domain_id: domainId,
    client_id: clientId,
    device_code: deviceCode,
  })
}

export function pdsRefreshToken(domainId: string, clientId: string, refreshToken: string) {
  return pdsPost<PdsTokenResult>('/pds/refresh', {
    domain_id: domainId,
    client_id: clientId,
    refresh_token: refreshToken,
  })
}

export function pdsListDrives(domainId: string, clientId: string, accessToken: string, tokenType: string) {
  return pdsPost<PdsDrivesResult>('/pds/drives', {
    domain_id: domainId,
    client_id: clientId,
    access_token: accessToken,
    token_type: tokenType || 'Bearer',
  })
}
