export interface DriverOption {
  value: string
  i18nKey: string
}

/** 阿里云 PDS 默认参数 */
export const PDS_DEFAULT_CLIENT_ID = 'lMNVp25Sd1MfqZDQ'
export const PDS_DEFAULT_DEVICE_NAME = 'OpenList PDS'

/** 所有支持的网盘驱动 */
export const DRIVERS: DriverOption[] = [
  { value: 'onedrive_go', i18nKey: 'driver.options.onedrive_go' },
  { value: 'onedrive_pr', i18nKey: 'driver.options.onedrive_pr' },
  { value: 'onedrive_cn', i18nKey: 'driver.options.onedrive_cn' },
  { value: 'onedrive_us', i18nKey: 'driver.options.onedrive_us' },
  { value: 'onedrive_de', i18nKey: 'driver.options.onedrive_de' },
  { value: 'alicloud_go', i18nKey: 'driver.options.alicloud_go' },
  { value: 'alicloud_qr', i18nKey: 'driver.options.alicloud_qr' },
  { value: 'alicloud_tv', i18nKey: 'driver.options.alicloud_tv' },
  { value: 'alicloud_cs', i18nKey: 'driver.options.alicloud_cs' },
  { value: 'baiduyun_go', i18nKey: 'driver.options.baiduyun_go' },
  { value: 'baiduyun_ob', i18nKey: 'driver.options.baiduyun_ob' },
  { value: 'quarkyun_fn', i18nKey: 'driver.options.quarkyun_fn' },
  { value: '115cloud_go', i18nKey: 'driver.options.115cloud_go' },
  { value: '115cloud_qr', i18nKey: 'driver.options.115cloud_qr' },
  { value: '123cloud_go', i18nKey: 'driver.options.123cloud_go' },
  { value: '123cloud_oa', i18nKey: 'driver.options.123cloud_oa' },
  { value: 'dropboxs_go', i18nKey: 'driver.options.dropboxs_go' },
  { value: 'googleui_go', i18nKey: 'driver.options.googleui_go' },
  { value: 'yandexui_go', i18nKey: 'driver.options.yandexui_go' },
  { value: 'pds_go', i18nKey: 'driver.options.pds_go' },
]

export const DEFAULT_DRIVER = 'onedrive_go'

/** 取驱动前缀（用于 API 路由） */
export function driverPrefix(driver: string): string {
  const pre = driver.split('_')[0]
  // 阿里云盘「直接登录」实际走 alicloud2 专用扫码 API
  return driver === 'alicloud_cs' ? 'alicloud2' : pre
}

/** 这些驱动隐藏凭据字段，强制使用服务端配置 */
export function isCredentialHidden(driver: string): boolean {
  return ['alicloud_cs', 'alicloud_tv', '115cloud_qr'].includes(driver)
}

export function isBaidu(driver: string): boolean {
  return driverPrefix(driver) === 'baiduyun'
}

export function isOnedrive(driver: string): boolean {
  return driverPrefix(driver) === 'onedrive'
}

/** 这些驱动禁用「使用官方参数」开关并取消勾选 */
export function isServerUseForcedOff(driver: string): boolean {
  return [
    'baiduyun_ob',
    'onedrive_cn',
    'onedrive_us',
    'onedrive_de',
    'alicloud_cs',
    '123cloud_go',
    'dropboxs_go',
  ].includes(driver)
}

/** 这些驱动强制勾选并锁定「使用官方参数」 */
export function isServerUseForcedOn(driver: string): boolean {
  return driver === '123cloud_oa'
}

/** 阿里云 PDS 设备授权登录 */
export function isPds(driver: string): boolean {
  return driver === 'pds_go'
}
