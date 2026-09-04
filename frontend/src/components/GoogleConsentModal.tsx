import { useTranslation } from 'react-i18next'
import { Button, Modal, Space, Typography } from 'antd'
import { CheckOutlined } from '@ant-design/icons'

interface Props {
  open: boolean
  onAgree: () => void
  onDecline: () => void
}

export default function GoogleConsentModal({ open, onAgree, onDecline }: Props) {
  const { t } = useTranslation()

  return (
    <Modal open={open} onCancel={onDecline} footer={null} width={480} centered closable={false}>
      <div className="consent-body">
        <Typography.Title level={4} className="consent-body__title">
          {t('consent.title')}
        </Typography.Title>
        <Typography.Paragraph className="consent-body__intro">{t('consent.intro')}</Typography.Paragraph>
        <ul className="consent-body__list">
          <li>{t('consent.drivePermission')}</li>
          <li>{t('consent.photoPermission')}</li>
        </ul>
        <div className="consent-body__links">
          <a href="https://docs.oplist.org/privacy" target="_blank" rel="noreferrer">
            {t('consent.privacy')}
          </a>
          <a href="https://docs.oplist.org/terms" target="_blank" rel="noreferrer">
            {t('consent.terms')}
          </a>
        </div>
        <Space className="consent-body__actions">
          <Button type="primary" icon={<CheckOutlined />} onClick={onAgree}>
            {t('consent.agree')}
          </Button>
          <Button danger onClick={onDecline}>
            {t('consent.decline')}
          </Button>
        </Space>
      </div>
    </Modal>
  )
}
