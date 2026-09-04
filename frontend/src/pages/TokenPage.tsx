import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { App, Button, Card, Col, Divider, Input, Modal, Row, Select, Space, Switch, Typography } from 'antd'
import { EyeInvisibleOutlined, EyeOutlined, KeyOutlined, LoginOutlined, ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons'
import Header from '../components/Header'
import Footer from '../components/Footer'
import CopyableField from '../components/CopyableField'
import QRLoginModal, { type QRType, type QRSuccessResult } from '../components/QRLoginModal'
import GoogleConsentModal from '../components/GoogleConsentModal'
import { useTheme } from '../theme/ThemeContext'
import { DRIVERS, DEFAULT_DRIVER, isBaidu, isCredentialHidden, isOnedrive, isPds, isServerUseForcedOff, isServerUseForcedOn, PDS_DEFAULT_CLIENT_ID, PDS_DEFAULT_DEVICE_NAME } from '../lib/drivers'
import {
  requestLogin,
  requestRefresh,
  parseCallbackHash,
  HttpError,
  pdsDeviceAuthorization,
  pdsDeviceToken,
  pdsRefreshToken,
  pdsListDrives,
  pdsMessage,
  type CallbackData,
  type PdsDrive,
  type PdsTokenResult,
} from '../lib/api'
import { getSiteId } from '../lib/sharepoint'
import { copyText } from '../lib/clipboard'

function formatPdsSize(value: unknown): string {
  const size = Number(value || 0)
  if (!size) return ''
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  let index = 0
  let current = size
  while (current >= 1024 && index < units.length - 1) {
    current /= 1024
    index += 1
  }
  return `${current.toFixed(index === 0 ? 0 : 2)} ${units[index]}`
}

export default function TokenPage() {
  const { t } = useTranslation()
  const { message } = App.useApp()
  const { mode } = useTheme()

  // 表单状态
  const [driver, setDriver] = useState(DEFAULT_DRIVER)
  const [serverUse, setServerUse] = useState(false)
  const [clientUid, setClientUid] = useState('')
  const [clientKey, setClientKey] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [refreshToken, setRefreshToken] = useState('')
  const [sharepointUrl, setSharepointUrl] = useState('')
  const [sharepointId, setSharepointId] = useState('')

  // UI 状态
  const [loginLoading, setLoginLoading] = useState(false)
  const [refreshLoading, setRefreshLoading] = useState(false)
  const [siteLoading, setSiteLoading] = useState(false)
  const [qrType, setQrType] = useState<QRType | null>(null)
  const [consentOpen, setConsentOpen] = useState(false)
  const [legacyOpen, setLegacyOpen] = useState(false)
  const [legacyQr, setLegacyQr] = useState('')
  const [legacySid, setLegacySid] = useState('')
  const [oobOpen, setOobOpen] = useState(false)
  const [oobCode, setOobCode] = useState('')
  const [oobUrl, setOobUrl] = useState('')

  const consentShownRef = useRef(false)
  const callbackFlagRef = useRef(false)

  // PDS 状态
  const [pdsDeviceName, setPdsDeviceName] = useState(PDS_DEFAULT_DEVICE_NAME)
  const [pdsUserCode, setPdsUserCode] = useState('')
  const [pdsAuthUrl, setPdsAuthUrl] = useState('')
  const [pdsStatus, setPdsStatus] = useState('')
  const [pdsTokenType, setPdsTokenType] = useState('Bearer')
  const [pdsRootFolderId, setPdsRootFolderId] = useState('root')
  const [pdsDriveId, setPdsDriveId] = useState('')
  const [pdsDrives, setPdsDrives] = useState<PdsDrive[]>([])
  const [pdsConfig, setPdsConfig] = useState('')
  const [hideTokens, setHideTokens] = useState(false)
  const pdsPollTimerRef = useRef<number | null>(null)
  const pdsPollingRef = useRef(false)
  const pdsPollExpiresAtRef = useRef(0)
  const pdsDeviceCodeRef = useRef('')

  const driverBase = useMemo(() => driver.split('_')[0], [driver])
  const callbackUrl = useMemo(() => {
    const host = `${window.location.protocol}//${window.location.host}`
    return `${host}/${driverBase}/callback`
  }, [driverBase])

  const credentialHidden = isCredentialHidden(driver)
  const baidu = isBaidu(driver)
  const onedrive = isOnedrive(driver)
  const pds = isPds(driver)
  const serverUseForcedOff = isServerUseForcedOff(driver)
  const serverUseForcedOn = isServerUseForcedOn(driver)
  const serverUseDisabled = serverUseForcedOff || serverUseForcedOn
  const credentialsDisabled = serverUse

  // 驱动切换时的规则
  const handleDriverChange = useCallback(
    (value: string) => {
      setDriver(value)
      setClientUid('')
      setClientKey('')
      setSecretKey('')

      let nextServerUse = false
      if (isCredentialHidden(value)) nextServerUse = true
      if (isServerUseForcedOff(value)) nextServerUse = false
      if (isServerUseForcedOn(value)) nextServerUse = true
      setServerUse(nextServerUse)

      // 百度网盘手动登录（OOB）自动填充参数
      if (value === 'baiduyun_ob') {
        setClientKey('NqOMXF6XGhGRIGemsQ9nG0Na')
        setSecretKey('SVT6xpMdLcx6v4aCR4wT8BBOTbzFO8LM')
      }

      // 阿里云 PDS 初始化默认值（Client ID 留空，后端自动使用默认值）
      if (value === 'pds_go') {
        setPdsDeviceName(PDS_DEFAULT_DEVICE_NAME)
        setPdsTokenType('Bearer')
        setPdsRootFolderId('root')
        setPdsStatus('')
        setPdsUserCode('')
        setPdsAuthUrl('')
        setPdsDriveId('')
        setPdsDrives([])
        setPdsConfig('')
      }
    },
    [],
  )

  // 使用官方参数切换
  const handleServerUseChange = useCallback((checked: boolean) => {
    setServerUse(checked)
    if (checked) {
      setClientUid('')
      setClientKey('')
      setSecretKey('')
    }
  }, [])

  // 应用回调数据（来自 URL hash）
  const applyCallbackData = useCallback(
    (data: CallbackData) => {
      if (data.driver_txt && data.driver_txt !== 'undefined') setDriver(data.driver_txt)
      if (data.client_key && data.client_key !== 'undefined') setClientKey(data.client_key)
      if (data.client_uid && data.client_uid !== 'undefined') setClientUid(data.client_uid)
      if (data.secret_key && data.secret_key !== 'undefined') setSecretKey(data.secret_key)
      if (data.access_token && data.access_token !== 'undefined') setAccessToken(data.access_token)
      if (data.refresh_token && data.refresh_token !== 'undefined') setRefreshToken(data.refresh_token)
      if (data.server_use === 'true') setServerUse(true)
      if (!data.driver_txt || data.driver_txt === '') setDriver(DEFAULT_DRIVER)
      if (data.message_err) {
        Modal.error({ title: t('msg.authFailed'), content: data.message_err })
      }
    },
    [t],
  )

  // 页面加载时解析回调 hash
  useEffect(() => {
    const hash = window.location.hash.substring(1)
    const data = parseCallbackHash(hash)
    if (data) {
      callbackFlagRef.current = true
      applyCallbackData(data)
      window.location.replace('#')
    }
  }, [applyCallbackData])

  // Google 授权弹窗触发条件：选择 Google Drive 驱动时即弹出（不再要求勾选「使用官方参数」），回调返回时不弹
  useEffect(() => {
    if (driver === 'googleui_go' && !consentShownRef.current && !callbackFlagRef.current) {
      consentShownRef.current = true
      setConsentOpen(true)
    }
  }, [driver])

  const buildPayload = useCallback(
    () => ({
      driver,
      serverUse,
      clientUid,
      clientKey,
      secretKey,
      refreshUi: refreshToken,
    }),
    [driver, serverUse, clientUid, clientKey, secretKey, refreshToken],
  )

  const handleError = useCallback(
    (e: unknown) => {
      if (e instanceof HttpError && e.status === 429) {
        message.error(t('msg.tooFrequent'))
      } else if (e instanceof Error) {
        message.error(`${t('msg.authFailed')}: ${e.message}`)
      } else {
        message.error(t('msg.authFailed'))
      }
    },
    [message, t],
  )

  // 扫码成功回调
  const handleQrSuccess = useCallback(
    (result: QRSuccessResult) => {
      setQrType(null)
      if (result.accessToken) setAccessToken(result.accessToken)
      if (result.refreshToken) setRefreshToken(result.refreshToken)
      if (result.uid) {
        setAccessToken(result.uid)
        message.success(`${t('msg.loginSuccess')}${result.uid ? ` - ${result.uid}` : ''}`)
      } else {
        message.success(t('msg.loginSuccess'))
      }
    },
    [message, t],
  )

  // 阿里云盘旧版扫码确认
  const handleLegacyConfirm = useCallback(async () => {
    setLegacyOpen(false)
    const url =
      `/alicloud/callback?client_id=${encodeURIComponent(clientUid)}` +
      `&client_secret=${encodeURIComponent(clientKey)}` +
      `&server_use=${serverUse}` +
      `&grant_type=authorization_code` +
      `&code=${encodeURIComponent(legacySid)}` +
      `&sid=${encodeURIComponent(legacySid)}`
    try {
      const res = await fetch(url, { method: 'GET' })
      const data = await res.json()
      if (res.status === 200) {
        setAccessToken(data.access_token || '')
        setRefreshToken(data.refresh_token || '')
        message.success(t('msg.loginSuccess'))
      } else {
        message.error(`${t('msg.authFailed')}: ${data.text || res.statusText}`)
      }
    } catch (e) {
      handleError(e)
    }
  }, [clientUid, clientKey, serverUse, legacySid, message, t, handleError])

  // 百度网盘 OOB 手动回调确认
  const handleOobConfirm = useCallback(() => {
    setOobOpen(false)
    const url =
      `/baiduyun/callback?server_oob=true` +
      `&secret_key=${encodeURIComponent(secretKey)}` +
      `&client_key=${encodeURIComponent(clientKey)}` +
      `&code=${encodeURIComponent(oobCode)}`
    window.location.href = url
  }, [secretKey, clientKey, oobCode])

  // ===== 阿里云 PDS 流程 =====
  const pdsClientId = useMemo(() => clientKey || PDS_DEFAULT_CLIENT_ID, [clientKey])

  const stopPdsPolling = useCallback(() => {
    if (pdsPollTimerRef.current) {
      window.clearInterval(pdsPollTimerRef.current)
      pdsPollTimerRef.current = null
    }
    pdsPollingRef.current = false
  }, [])

  const fillPdsToken = useCallback((data: PdsTokenResult) => {
    if (data.access_token) setAccessToken(data.access_token)
    if (data.refresh_token) setRefreshToken(data.refresh_token)
    if (data.token_type) setPdsTokenType(data.token_type)
  }, [])

  const loadPdsDrives = useCallback(async () => {
    if (!accessToken) {
      message.error(t('pds.needAccessToken'))
      return
    }
    setPdsStatus(t('pds.listingDrives'))
    const result = await pdsListDrives(clientUid, pdsClientId, accessToken, pdsTokenType)
    if (!result.ok) {
      setPdsStatus(t('pds.listDrivesFailed'))
      message.error(pdsMessage(result.data))
      return
    }
    const drives = Array.isArray(result.data.drives) ? result.data.drives : []
    setPdsDrives(drives)
    setPdsStatus(t('pds.drivesFound', { count: drives.length }))
    if (drives.length === 0) message.warning(t('pds.noDrives'))
    if (drives.length > 0 && !pdsDriveId) setPdsDriveId(drives[0].drive_id || '')
  }, [accessToken, clientUid, pdsClientId, pdsTokenType, pdsDriveId, message, t])

  const pollPdsToken = useCallback(async () => {
    if (pdsPollingRef.current) return
    if (pdsPollExpiresAtRef.current > 0 && Date.now() > pdsPollExpiresAtRef.current) {
      stopPdsPolling()
      setPdsStatus(t('pds.codeExpired'))
      return
    }
    pdsPollingRef.current = true
    try {
      const result = await pdsDeviceToken(clientUid, pdsClientId, pdsDeviceCodeRef.current)
      if (result.status === 202 || result.data.status === 'pending') {
        setPdsStatus(t('pds.waitingConfirmDots'))
        return
      }
      if (!result.ok) {
        stopPdsPolling()
        setPdsStatus(t('pds.authFailed'))
        message.error(pdsMessage(result.data))
        return
      }
      fillPdsToken(result.data)
      stopPdsPolling()
      setPdsStatus(t('pds.authSuccess'))
      message.success(t('pds.authSuccess'))
      await loadPdsDrives()
    } finally {
      pdsPollingRef.current = false
    }
  }, [clientUid, pdsClientId, stopPdsPolling, fillPdsToken, loadPdsDrives, message, t])

  const startPdsLogin = useCallback(async () => {
    if (!clientUid) {
      message.error(t('pds.needDomainId'))
      return
    }
    stopPdsPolling()
    setPdsStatus(t('pds.gettingAuthUrl'))
    const result = await pdsDeviceAuthorization(clientUid, pdsClientId, pdsDeviceName || PDS_DEFAULT_DEVICE_NAME)
    if (!result.ok || !result.data.device_code) {
      setPdsStatus(t('pds.getAuthUrlFailed'))
      message.error(pdsMessage(result.data))
      return
    }
    const d = result.data
    pdsDeviceCodeRef.current = d.device_code || ''
    pdsPollExpiresAtRef.current = Date.now() + Number(d.expires_in || 0) * 1000
    const authUrl =
      d.verification_uri_complete ||
      (d.verification_uri && d.user_code
        ? `${d.verification_uri}?user_code=${encodeURIComponent(d.user_code)}`
        : d.verification_uri) ||
      ''
    setPdsAuthUrl(authUrl)
    setPdsUserCode(d.user_code || '')
    setPdsStatus(t('pds.waitingConfirm'))
    const intervalSeconds = Math.max(3, Number(d.interval || 5))
    pdsPollTimerRef.current = window.setInterval(() => {
      void pollPdsToken()
    }, intervalSeconds * 1000)
    await pollPdsToken()
  }, [clientUid, pdsClientId, pdsDeviceName, stopPdsPolling, pollPdsToken, message, t])

  const refreshPdsToken = useCallback(async () => {
    if (!refreshToken) {
      message.error(t('pds.needRefreshToken'))
      return
    }
    setPdsStatus(t('pds.refreshing'))
    const result = await pdsRefreshToken(clientUid, pdsClientId, refreshToken)
    if (!result.ok) {
      setPdsStatus(t('pds.refreshFailed'))
      message.error(pdsMessage(result.data))
      return
    }
    fillPdsToken(result.data)
    setPdsStatus(t('pds.refreshed'))
    message.success(t('pds.refreshed'))
  }, [clientUid, pdsClientId, refreshToken, fillPdsToken, message, t])

  const handleGetToken = useCallback(
    async (refresh = false) => {
      // 阿里云 PDS 设备授权登录
      if (pds) {
        if (refresh) await refreshPdsToken()
        else await startPdsLogin()
        return
      }

      // 阿里云盘 v2 扫码 & 115 扫码走专用弹窗
      if (driver === 'alicloud_cs' && !refresh) {
        setQrType('alicloud')
        return
      }
      if (driver === '115cloud_qr') {
        setQrType('115')
        return
      }

      // 凭据校验
      if (!serverUse) {
        let ok = true
        if (!['alicloud_cs', 'alicloud_tv'].includes(driver) && !baidu) {
          if (!clientUid || !clientKey) ok = false
        }
        if (baidu) {
          if (!secretKey || !clientKey) ok = false
        }
        if (!ok) {
          message.error(t('msg.fillCredentials'))
          return
        }
      }
      if (refresh && !refreshToken) {
        message.error(t('msg.fillRefreshToken'))
        return
      }

      const payload = buildPayload()

      if (refresh) {
        setRefreshLoading(true)
        try {
          const pair = await requestRefresh(payload)
          setAccessToken(pair.accessToken)
          setRefreshToken(pair.refreshToken)
          message.success(t('msg.refreshSuccess'))
        } catch (e) {
          handleError(e)
        } finally {
          setRefreshLoading(false)
        }
        return
      }

      setLoginLoading(true)
      try {
        const result = await requestLogin(payload)

        if (result.redirect) {
          if (driver === 'baiduyun_ob') {
            setOobUrl(result.redirect)
            setOobCode('')
            setOobOpen(true)
          } else {
            window.location.href = result.redirect
          }
          return
        }

        if (result.raw !== undefined) {
          setAccessToken(result.raw)
          return
        }

        // 阿里云盘旧版扫码（alicloud_qr / alicloud_tv）
        if (result.sid && result.qr) {
          setLegacyQr(result.qr)
          setLegacySid(result.sid)
          setLegacyOpen(true)
        }
      } catch (e) {
        handleError(e)
      } finally {
        setLoginLoading(false)
      }
    },
    [driver, pds, serverUse, baidu, clientUid, clientKey, secretKey, refreshToken, buildPayload, message, t, handleError, refreshPdsToken, startPdsLogin],
  )

  const openPdsAuthUrl = useCallback(() => {
    if (pdsAuthUrl) window.open(pdsAuthUrl, '_blank', 'noopener,noreferrer')
  }, [pdsAuthUrl])

  const buildPdsConfig = useCallback(() => {
    const config = {
      root_folder_id: pdsRootFolderId || 'root',
      domain_id: clientUid,
      drive_id: pdsDriveId,
      client_id: pdsClientId,
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: pdsTokenType || 'Bearer',
      expires_at: 0,
    }
    setPdsConfig(JSON.stringify(config, null, 2))
  }, [pdsRootFolderId, clientUid, pdsDriveId, pdsClientId, accessToken, refreshToken, pdsTokenType])

  // 卸载时清理轮询
  useEffect(() => () => stopPdsPolling(), [stopPdsPolling])

  // 获取 SharePoint 站点 ID
  const handleGetSiteId = useCallback(async () => {
    setSiteLoading(true)
    try {
      const result = await getSiteId(driver, sharepointUrl, accessToken)
      setSharepointId(result.value)
      if (result.kind === 'error') message.warning(result.value)
    } finally {
      setSiteLoading(false)
    }
  }, [driver, sharepointUrl, accessToken, message])

  const copyCallbackUrl = useCallback(async () => {
    if (!callbackUrl) return
    const ok = await copyText(callbackUrl)
    if (ok) message.success(t('msg.copied'))
  }, [callbackUrl, message, t])

  const driverOptions = useMemo(
    () => DRIVERS.map((d) => ({ value: d.value, label: t(d.i18nKey) })),
    [t],
  )

  return (
    <div className={`page page--${mode}`}>
      <Header />

      <main className="page__main">
        <section className="hero">
          <div className="hero__badge">
            <ThunderboltOutlined /> {t('app.tagline')}
          </div>
          <Typography.Title className="hero__title">{t('app.title')}</Typography.Title>
          <Typography.Paragraph className="hero__subtitle">{t('app.subtitle')}</Typography.Paragraph>
        </section>

        <section className="workspace">
          <Row gutter={[20, 20]}>
            <Col xs={24} lg={14}>
              <Card className="glass-card config-card" variant="borderless">
                <div className="card-heading">
                  <KeyOutlined className="card-heading__icon" />
                  <Typography.Title level={4} className="card-heading__title">
                    {t('credential.title')}
                  </Typography.Title>
                </div>

                <label className="field-label">{t('driver.label')}</label>
                <Select
                  value={driver}
                  onChange={handleDriverChange}
                  options={driverOptions}
                  size="large"
                  showSearch
                  optionFilterProp="label"
                  className="driver-select"
                />

                {!pds && (
                  <div className="field-row">
                    <div className="field-row__label">
                      <span>{t('credential.serverUse')}</span>
                    </div>
                    <Switch checked={serverUse} onChange={handleServerUseChange} disabled={serverUseDisabled} />
                  </div>
                )}

                {!credentialHidden && (
                  <>
                    {!baidu && (
                      <div className="field">
                        <label className="field-label">{t(pds ? 'pds.domainId' : 'credential.clientUid')}</label>
                        <Input
                          value={clientUid}
                          onChange={(e) => setClientUid(e.target.value)}
                          disabled={credentialsDisabled}
                          placeholder={t(pds ? 'pds.domainIdPlaceholder' : 'credential.clientUidPlaceholder')}
                          className="mono-input"
                          size="large"
                        />
                      </div>
                    )}

                    <div className="field">
                      <label className="field-label">{t(pds ? 'pds.clientId' : 'credential.clientKey')}</label>
                      <Input
                        value={clientKey}
                        onChange={(e) => setClientKey(e.target.value)}
                        disabled={credentialsDisabled}
                        placeholder={t(pds ? 'pds.clientIdPlaceholder' : 'credential.clientKeyPlaceholder')}
                        className="mono-input"
                        size="large"
                      />
                    </div>

                    {baidu && (
                      <div className="field">
                        <label className="field-label">{t('credential.secretKey')}</label>
                        <Input
                          value={secretKey}
                          onChange={(e) => setSecretKey(e.target.value)}
                          disabled={credentialsDisabled}
                          placeholder={t('credential.secretKeyPlaceholder')}
                          className="mono-input"
                          size="large"
                        />
                      </div>
                    )}

                    <div className="field">
                      <label className="field-label">
                        {pds ? t('pds.authUrl') : t('credential.callbackUrl')}
                        {!pds && <span className="field-label__hint"> · {t('credential.callbackHint')}</span>}
                      </label>
                      <Input
                        value={pds ? pdsAuthUrl : callbackUrl}
                        readOnly
                        onClick={pds ? openPdsAuthUrl : copyCallbackUrl}
                        className="mono-input"
                        size="large"
                      />
                    </div>
                  </>
                )}

                <Divider />

                <div className="field">
                  <label className="field-label">{t('credential.actionTitle')}</label>
                  <Space size={12} wrap>
                    <Button
                      type="primary"
                      size="large"
                      icon={<LoginOutlined />}
                      loading={loginLoading}
                      onClick={() => handleGetToken(false)}
                      className="action-btn"
                    >
                      {t('credential.getToken')}
                    </Button>
                    <Button
                      size="large"
                      icon={<ReloadOutlined />}
                      loading={refreshLoading}
                      onClick={() => handleGetToken(true)}
                      className="action-btn"
                    >
                      {t('credential.refreshToken')}
                    </Button>
                  </Space>
                </div>

              </Card>
            </Col>

            <Col xs={24} lg={10}>
              <Card className="glass-card token-card" variant="borderless">
                <div className="card-heading">
                  <KeyOutlined className="card-heading__icon" />
                  <Typography.Title level={4} className="card-heading__title">
                    {t('credential.tokenTitle')}
                  </Typography.Title>
                  {pds && (
                    <Button
                      type="text"
                      size="small"
                      icon={hideTokens ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                      onClick={() => setHideTokens((v) => !v)}
                      title={hideTokens ? t('credential.showTokens') : t('credential.hideTokens')}
                      style={{ marginLeft: 'auto' }}
                    />
                  )}
                </div>

                <div className="field">
                  <label className="field-label">{t('credential.accessToken')}</label>
                  <CopyableField
                    value={accessToken}
                    placeholder={t('credential.empty')}
                    readOnly={!pds}
                    onChange={pds ? setAccessToken : undefined}
                    masked={pds && hideTokens}
                  />
                </div>

                <div className="field">
                  <label className="field-label">{t('credential.refreshTokenLabel')}</label>
                  <CopyableField
                    value={refreshToken}
                    placeholder={t('credential.empty')}
                    readOnly={!pds}
                    onChange={pds ? setRefreshToken : undefined}
                    masked={pds && hideTokens}
                  />
                </div>

                {pds && (
                  <>
                    <Divider />
                    <div className="card-heading">
                      <Typography.Title level={5} className="card-heading__title">
                        {t('pds.title')}
                      </Typography.Title>
                    </div>

                    <Row gutter={12}>
                      <Col span={12}>
                        <div className="field">
                          <label className="field-label">{t('pds.deviceName')}</label>
                          <Input
                            value={pdsDeviceName}
                            onChange={(e) => setPdsDeviceName(e.target.value)}
                            className="mono-input"
                            size="large"
                          />
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="field">
                          <label className="field-label">{t('pds.userCode')}</label>
                          <CopyableField value={pdsUserCode} placeholder="—" rows={1} size="large" />
                        </div>
                      </Col>
                    </Row>

                    <Row gutter={12}>
                      <Col span={12}>
                        <div className="field">
                          <label className="field-label">{t('pds.status')}</label>
                          <CopyableField value={pdsStatus} placeholder={t('pds.statusPlaceholder')} rows={1} size="large" />
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="field">
                          <label className="field-label">{t('pds.tokenType')}</label>
                          <Input
                            value={pdsTokenType}
                            onChange={(e) => setPdsTokenType(e.target.value)}
                            className="mono-input"
                            size="large"
                          />
                        </div>
                      </Col>
                    </Row>

                    <Row gutter={12}>
                      <Col span={12}>
                        <div className="field">
                          <Button block size="large" disabled={!pdsAuthUrl} onClick={openPdsAuthUrl}>
                            {t('pds.openAuth')}
                          </Button>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="field">
                          <Button block size="large" onClick={loadPdsDrives}>
                            {t('pds.listDrives')}
                          </Button>
                        </div>
                      </Col>
                    </Row>

                    <Row gutter={12}>
                      <Col span={12}>
                        <div className="field">
                          <label className="field-label">{t('pds.drive')}</label>
                          <Select
                            value={pdsDriveId || undefined}
                            onChange={(v) => setPdsDriveId(v ?? '')}
                            options={pdsDrives.map((d) => ({
                              value: d.drive_id,
                              label: `${d.drive_name || d.drive_id}${d.owner_type ? ` / ${d.owner_type}` : ''}${
                                d.total_size ? ` / ${formatPdsSize(d.used_size)} / ${formatPdsSize(d.total_size)}` : ''
                              }`,
                            }))}
                            size="large"
                            style={{ width: '100%' }}
                            allowClear
                            placeholder={t('pds.drivePlaceholder')}
                          />
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="field">
                          <label className="field-label">{t('pds.driveId')}</label>
                          <Input
                            value={pdsDriveId}
                            onChange={(e) => setPdsDriveId(e.target.value)}
                            className="mono-input"
                            size="large"
                          />
                        </div>
                      </Col>
                    </Row>

                    <Row gutter={12}>
                      <Col span={12}>
                        <div className="field">
                          <label className="field-label">{t('pds.rootFolderId')}</label>
                          <Input
                            value={pdsRootFolderId}
                            onChange={(e) => setPdsRootFolderId(e.target.value)}
                            className="mono-input"
                            size="large"
                          />
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="field">
                          <label className="field-label">&nbsp;</label>
                          <Button block size="large" onClick={buildPdsConfig}>
                            {t('pds.generateConfig')}
                          </Button>
                        </div>
                      </Col>
                    </Row>

                    <div className="field">
                      <label className="field-label">{t('pds.configOutput')}</label>
                      <CopyableField value={pdsConfig} placeholder={t('credential.empty')} rows={4} size="large" />
                    </div>
                  </>
                )}

                {onedrive && (
                  <>
                    <Divider />
                    <div className="card-heading">
                      <Typography.Title level={5} className="card-heading__title">
                        {t('sharepoint.title')}
                      </Typography.Title>
                    </div>
                    <div className="field">
                      <label className="field-label">{t('sharepoint.siteUrl')}</label>
                      <Input
                        value={sharepointUrl}
                        onChange={(e) => setSharepointUrl(e.target.value)}
                        placeholder={t('sharepoint.siteUrlPlaceholder')}
                        className="mono-input"
                      />
                    </div>
                    <Button block size="middle" loading={siteLoading} onClick={handleGetSiteId} style={{ marginTop: 12 }}>
                      {t('sharepoint.getSiteId')}
                    </Button>
                    <div className="field" style={{ marginTop: 12 }}>
                      <label className="field-label">{t('sharepoint.siteId')}</label>
                      <CopyableField value={sharepointId} rows={2} />
                    </div>
                  </>
                )}
              </Card>
            </Col>
          </Row>
        </section>
      </main>

      <Footer />

      {/* 扫码登录弹窗 */}
      <QRLoginModal type={qrType ?? 'alicloud'} open={qrType !== null} onClose={() => setQrType(null)} onSuccess={handleQrSuccess} />

      {/* 阿里云盘旧版扫码 */}
      <Modal
        open={legacyOpen}
        onCancel={() => setLegacyOpen(false)}
        onOk={handleLegacyConfirm}
        okText={t('common.ok')}
        title={t('qr.title')}
        width={440}
        centered
      >
        <div className="legacy-qr">
          <Typography.Paragraph>{t('qr.scanAlicloud')}</Typography.Paragraph>
          <img src={legacyQr} alt="QR Code" className="legacy-qr__img" />
        </div>
      </Modal>

      {/* 百度网盘 OOB 授权码输入 */}
      <Modal
        open={oobOpen}
        onCancel={() => setOobOpen(false)}
        onOk={handleOobConfirm}
        okText={t('common.ok')}
        title={t('oob.title')}
        width={440}
        centered
      >
        <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
          {t('oob.intro')}
        </Typography.Paragraph>
        <div className="field">
          <label className="field-label">{t('oob.codeLabel')}</label>
          <Input value={oobCode} onChange={(e) => setOobCode(e.target.value)} placeholder="Authorization Code" className="mono-input" />
        </div>
        {oobUrl && (
          <Typography.Paragraph type="secondary" style={{ marginTop: 12 }} ellipsis>
            <a href={oobUrl} target="_blank" rel="noreferrer">
              {oobUrl}
            </a>
          </Typography.Paragraph>
        )}
      </Modal>

      {/* Google 隐私授权 */}
      <GoogleConsentModal
        open={consentOpen}
        onAgree={() => setConsentOpen(false)}
        onDecline={() => {
          setConsentOpen(false)
          window.open('/', '_self')
        }}
      />
    </div>
  )
}
