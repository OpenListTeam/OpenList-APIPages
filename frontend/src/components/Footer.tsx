import { useTranslation } from 'react-i18next'
import { Typography, Divider } from 'antd'

export default function Footer() {
  const { t } = useTranslation()
  const isCn = typeof window !== 'undefined' && window.location.host === 'api.oplist.org.cn'
  const year = new Date().getFullYear()

  return (
    <footer className="app-footer">
      <div className="app-footer__nav">
        <a href="https://docs.oplist.org/privacy" target="_blank" rel="noreferrer">
          {t('consent.privacy')}
        </a>
        <span className="app-footer__dot">·</span>
        <a href="https://docs.oplist.org/terms" target="_blank" rel="noreferrer">
          {t('consent.terms')}
        </a>
        <span className="app-footer__dot">·</span>
        <a href="https://github.com/OpenListTeam/OpenList-OnlineAPI" target="_blank" rel="noreferrer">
          {t('footer.opensource')}
        </a>
      </div>

      <Typography.Text type="secondary" className="app-footer__note">
        {t('footer.privacyNote')}
      </Typography.Text>

      <Typography.Text type="secondary" className="app-footer__links">
        {t('footer.opensource')}{' '}
        <a href="https://github.com/OpenListTeam/OpenList-OnlineAPI" target="_blank" rel="noreferrer">
          GitHub
        </a>{' '}
        {t('footer.by')}{' '}
        <a href="https://github.com/OpenListTeam" target="_blank" rel="noreferrer">
          OpenListTeam
        </a>
      </Typography.Text>

      {isCn && (
        <Typography.Text type="secondary" className="app-footer__sponsor">
          {t('footer.sponsoredBy')}{' '}
          <a href="https://edgeone.ai/zh?from=github" target="_blank" rel="noreferrer">
            {t('footer.sponsor')}
          </a>{' '}
          {t('footer.sponsored')}
          <img
            src="https://edgeone.ai/media/34fe3a45-492d-4ea4-ae5d-ea1087ca7b4b.png"
            alt="Tencent EdgeOne"
            className="app-footer__sponsor-logo"
          />
        </Typography.Text>
      )}

      <Divider className="app-footer__divider" />

      <Typography.Text type="secondary" className="app-footer__copyright">
        © {year} OpenListTeam · {t('footer.rights')}
      </Typography.Text>
    </footer>
  )
}
