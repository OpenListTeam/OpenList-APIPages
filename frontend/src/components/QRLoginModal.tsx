import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Button, Modal, Space, Spin } from 'antd'
import { ReloadOutlined, SyncOutlined } from '@ant-design/icons'
import {
  generateAlicloudQR,
  checkAlicloudStatus,
  getAlicloudUserInfo,
  logoutAlicloud,
  generateCloud115QR,
  checkCloud115Status,
  qrImageUrl,
  type Cloud115QRResponse,
} from '../lib/qr'

export type QRType = 'alicloud' | '115'

export interface QRSuccessResult {
  accessToken?: string
  refreshToken?: string
  uid?: string
}

interface Props {
  type: QRType
  open: boolean
  onClose: () => void
  onSuccess: (result: QRSuccessResult) => void
}

type StatusKind = 'waiting' | 'scaned' | 'success' | 'error' | 'info'

const ALERT_TYPE: Record<StatusKind, 'success' | 'info' | 'warning' | 'error'> = {
  waiting: 'warning',
  scaned: 'info',
  success: 'success',
  error: 'error',
  info: 'info',
}

export default function QRLoginModal({ type, open, onClose, onSuccess }: Props) {
  const { t } = useTranslation()
  const [qrUrl, setQrUrl] = useState<string>('')
  const [statusText, setStatusText] = useState<string>('')
  const [statusKind, setStatusKind] = useState<StatusKind>('info')
  const [generating, setGenerating] = useState(false)
  const [showRefresh, setShowRefresh] = useState(false)
  const [hasQr, setHasQr] = useState(false)

  const sessionIdRef = useRef<string | null>(null)
  const intervalRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const body115Ref = useRef<Cloud115QRResponse | null>(null)
  const closedRef = useRef(false)

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const setStatus = useCallback((text: string, kind: StatusKind) => {
    setStatusText(text)
    setStatusKind(kind)
  }, [])

  const startAlicloud = useCallback(async () => {
    setGenerating(true)
    setHasQr(false)
    setShowRefresh(false)
    setStatus(t('qr.generating'), 'info')
    try {
      const result = await generateAlicloudQR()
      if (result.success && result.qr_code_url) {
        sessionIdRef.current = result.session_id ?? null
        startTimeRef.current = Date.now()
        setQrUrl(qrImageUrl(result.qr_code_url))
        setHasQr(true)
        setStatus(t('qr.scanAlicloud'), 'waiting')
        startAlicloudPolling()
      } else {
        setStatus(result.error || t('qr.generating'), 'error')
        setShowRefresh(true)
      }
    } catch {
      setStatus(t('qr.networkError'), 'error')
      setShowRefresh(true)
    } finally {
      setGenerating(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t])

  const startAlicloudPolling = useCallback(() => {
    stopPolling()
    intervalRef.current = window.setInterval(async () => {
      const sessionId = sessionIdRef.current
      if (!sessionId || closedRef.current) return

      const elapsed = Date.now() - startTimeRef.current
      if (elapsed > 180000) {
        setStatus(t('qr.expiredHint'), 'error')
        setShowRefresh(true)
        stopPolling()
        return
      }

      try {
        const result = await checkAlicloudStatus(sessionId)
        if (!result.success) {
          setStatus(t('qr.sessionInvalid'), 'error')
          setShowRefresh(true)
          stopPolling()
          return
        }
        switch (result.status) {
          case 'WAITING': {
            const waitTime = Math.floor(elapsed / 1000)
            setStatus(`${t('qr.waiting')} (${waitTime}s)`, 'waiting')
            break
          }
          case 'SCANED':
            setStatus(t('qr.scaned'), 'scaned')
            break
          case 'CONFIRMED': {
            setStatus(t('qr.confirmed'), 'success')
            stopPolling()
            const info = await getAlicloudUserInfo(sessionId)
            if (info.success) {
              onSuccess({
                accessToken: info.access_token,
                refreshToken: info.refresh_token,
                uid: info.user_info?.nick_name || info.user_info?.user_id,
              })
              await logoutAlicloud(sessionId)
              sessionIdRef.current = null
            }
            break
          }
          case 'EXPIRED':
            setStatus(t('qr.expired'), 'error')
            setShowRefresh(true)
            stopPolling()
            break
        }
      } catch {
        setStatus(t('qr.networkError'), 'error')
        setShowRefresh(true)
      }
    }, 2000)
  }, [onSuccess, stopPolling, t])

  const start115 = useCallback(async () => {
    setGenerating(true)
    setHasQr(false)
    setShowRefresh(false)
    setStatus(t('qr.generating'), 'info')
    try {
      const result = await generateCloud115QR()
      body115Ref.current = result
      setQrUrl(qrImageUrl(result.qrcode))
      setHasQr(true)
      setStatus(t('qr.scan115'), 'waiting')
    } catch {
      setStatus(t('qr.networkError'), 'error')
      setShowRefresh(true)
    } finally {
      setGenerating(false)
    }
  }, [t])

  const check115 = useCallback(async () => {
    const body = body115Ref.current
    if (!body) return
    try {
      const status = await checkCloud115Status(body)
      switch (status) {
        case '0':
          setStatus(t('qr.waiting'), 'waiting')
          break
        case '1':
          setStatus(t('qr.scaned'), 'waiting')
          break
        case '2':
          setStatus(t('qr.success'), 'success')
          onSuccess({ uid: body.uid })
          break
        case '-1':
          setStatus(t('qr.expired'), 'error')
          setShowRefresh(true)
          break
        case '-2':
          setStatus(t('qr.cancelled'), 'error')
          setShowRefresh(true)
          break
        default:
          setStatus(`${t('qr.checkStatus')}: ${status}`, 'info')
      }
    } catch {
      setStatus(t('qr.networkError'), 'error')
    }
  }, [onSuccess, t])

  const start = useCallback(() => {
    closedRef.current = false
    if (type === 'alicloud') void startAlicloud()
    else void start115()
  }, [type, startAlicloud, start115])

  const cleanup = useCallback(async () => {
    closedRef.current = true
    stopPolling()
    if (type === 'alicloud' && sessionIdRef.current) {
      await logoutAlicloud(sessionIdRef.current)
      sessionIdRef.current = null
    }
    body115Ref.current = null
  }, [stopPolling, type])

  useEffect(() => {
    if (open) {
      start()
    } else {
      void cleanup()
    }
    return () => {
      void cleanup()
    }
  }, [open, start, cleanup])

  const handleRefresh = useCallback(() => {
    setQrUrl('')
    setHasQr(false)
    setShowRefresh(false)
    if (type === 'alicloud') void startAlicloud()
    else void start115()
  }, [type, startAlicloud, start115])

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={420}
      centered
      title={type === 'alicloud' ? t('qr.alicloudTitle') : t('qr.title115')}
      destroyOnHidden={false}
    >
      <div className="qr-modal-body">
        <Spin spinning={generating}>
          <div className="qr-modal-body__qr">
            {hasQr ? (
              <img src={qrUrl} alt="QR Code" className="qr-modal-body__img" />
            ) : (
              <div className="qr-modal-body__placeholder" />
            )}
          </div>
        </Spin>

        {statusText && <Alert message={statusText} type={ALERT_TYPE[statusKind]} showIcon className="qr-modal-body__status" />}

        <Space className="qr-modal-body__actions">
          {showRefresh && (
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              {t('qr.refreshQr')}
            </Button>
          )}
          {type === '115' && hasQr && (
            <Button icon={<SyncOutlined />} onClick={() => void check115()}>
              {t('qr.checkStatus')}
            </Button>
          )}
          <Button onClick={onClose}>{t('qr.close')}</Button>
        </Space>
      </div>
    </Modal>
  )
}
