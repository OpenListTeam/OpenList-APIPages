export interface SiteIdResult {
  value: string
  kind: 'ok' | 'error'
}

const GATEWAYS: Record<string, string> = {
  onedrive_go: 'https://graph.microsoft.com/v1.0/sites/',
  onedrive_cn: 'https://microsoftgraph.chinacloudapi.cn/v1.0/sites/',
  onedrive_us: 'https://graph.microsoft.us/v1.0/sites/',
  onedrive_de: 'https://graph.microsoft.de/v1.0/sites/',
}

export const SHAREPOINT_ERRORS = {
  MISSING_CREDENTIALS: '请先填写客户端ID和应用机密',
  MISSING_TOKENS: '请获取Token',
  MISSING_URL: '请填写您的SharePoint URL',
  NOT_SUPPORTED: '仅支持OneDrive相关API',
  NOT_FOUND: '站点不存在',
  BAD_REQUEST: '获取出现问题，请检查权限和站点URL，站点URL示例：https://demo.sharepoint.com/site/demo',
  DEFAULT: '请求发生错误',
} as const

export async function getSiteId(
  siteType: string,
  siteUrl: string,
  accessToken: string,
): Promise<SiteIdResult> {
  if (!siteType.includes('onedrive')) {
    return { value: SHAREPOINT_ERRORS.NOT_SUPPORTED, kind: 'error' }
  }
  if (!accessToken) {
    return { value: SHAREPOINT_ERRORS.MISSING_TOKENS, kind: 'error' }
  }
  if (!siteUrl) {
    return { value: SHAREPOINT_ERRORS.MISSING_URL, kind: 'error' }
  }
  if (!GATEWAYS[siteType]) {
    return { value: SHAREPOINT_ERRORS.DEFAULT, kind: 'error' }
  }

  try {
    const urlParts = siteUrl.replace('https://', '').split('/')
    const siteHostname = urlParts[0]
    const siteSubPath = urlParts[1]
    const siteName = urlParts[2]
    const sitePath = `${siteSubPath}/${siteName}`
    const reqUrl = `${GATEWAYS[siteType]}${siteHostname}:/${sitePath}`

    const res = await fetch(reqUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (res.status === 404) return { value: SHAREPOINT_ERRORS.NOT_FOUND, kind: 'error' }
    if (res.status === 400) return { value: SHAREPOINT_ERRORS.BAD_REQUEST, kind: 'error' }
    if (!res.ok) return { value: `${SHAREPOINT_ERRORS.DEFAULT} (HTTP ${res.status})`, kind: 'error' }

    const result = await res.json()
    if (result.id) return { value: result.id, kind: 'ok' }
    if (result.error?.message) return { value: result.error.message, kind: 'error' }
    return { value: SHAREPOINT_ERRORS.DEFAULT, kind: 'error' }
  } catch (e) {
    return { value: e instanceof Error ? e.message : SHAREPOINT_ERRORS.BAD_REQUEST, kind: 'error' }
  }
}
