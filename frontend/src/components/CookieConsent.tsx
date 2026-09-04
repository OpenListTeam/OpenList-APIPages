import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Typography } from 'antd'
import { CheckOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { useTheme } from '../theme/ThemeContext'

const STORAGE_KEY = 'openlist-cookie-consent'

export default function CookieConsent() {
  const { t } = useTranslation()
  const { mode } = useTheme()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== '1') setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  const accept = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // ignore
    }
    setVisible(false)
  }, [])

  if (!visible) return null

  return (
    <div className={`cookie-banner cookie-banner--${mode}`} role="dialog" aria-label="Cookie">
      <span className="cookie-banner__icon">
        <SafetyCertificateOutlined />
      </span>
      <Typography.Text className="cookie-banner__text">
        {t('cookie.message')}{' '}
        <a href="https://docs.oplist.org/privacy" target="_blank" rel="noreferrer">
          {t('consent.privacy')}
        </a>
      </Typography.Text>
      <Button
        type="primary"
        className="cookie-banner__btn"
        icon={<CheckOutlined />}
        onClick={accept}
      >
        {t('cookie.accept')}
      </Button>
    </div>
  )
}
