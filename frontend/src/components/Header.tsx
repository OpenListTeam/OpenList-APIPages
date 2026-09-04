import { useTranslation } from 'react-i18next'
import { Dropdown, Button, Space, Tooltip, theme as antdTheme } from 'antd'
import {
  GlobalOutlined,
  MoonOutlined,
  SunOutlined,
  GithubOutlined,
  ReadOutlined,
  CloudOutlined,
} from '@ant-design/icons'
import { useTheme } from '../theme/ThemeContext'
import { LANGUAGES } from '../i18n'

export default function Header() {
  const { t, i18n } = useTranslation()
  const { mode, toggle } = useTheme()
  const { token } = antdTheme.useToken()

  const languageItems = LANGUAGES.map((lang) => ({
    key: lang.value,
    label: lang.label,
  }))

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <a className="brand" href="/">
          <span className="brand__mark">
            <CloudOutlined />
          </span>
          <span className="brand__text">
            <span className="brand__name">{t('app.title')}</span>
            <span className="brand__sub">Token Generator</span>
          </span>
        </a>

        <Space size={4} className="app-header__actions">
          <Tooltip title={t('nav.github')}>
            <Button
              type="text"
              shape="circle"
              aria-label={t('nav.github')}
              icon={<GithubOutlined />}
              href="https://github.com/OpenListTeam/OpenList-OnlineAPI"
              target="_blank"
            />
          </Tooltip>
          <Tooltip title={t('nav.docs')}>
            <Button
              type="text"
              shape="circle"
              aria-label={t('nav.docs')}
              icon={<ReadOutlined />}
              href="https://docs.oplist.org"
              target="_blank"
            />
          </Tooltip>

          <Dropdown
            menu={{
              items: languageItems,
              selectedKeys: [i18n.resolvedLanguage || 'zh-CN'],
              onClick: ({ key }) => i18n.changeLanguage(key),
            }}
            placement="bottomRight"
          >
            <Button type="text" icon={<GlobalOutlined />}>
              {LANGUAGES.find((l) => l.value === (i18n.resolvedLanguage || 'zh-CN'))?.label ?? 'Language'}
            </Button>
          </Dropdown>

          <Tooltip title={t('theme.toggle')}>
            <Button
              type="text"
              shape="circle"
              aria-label={t('theme.toggle')}
              onClick={toggle}
              icon={mode === 'dark' ? <SunOutlined style={{ color: token.colorWarning }} /> : <MoonOutlined />}
            />
          </Tooltip>
        </Space>
      </div>
    </header>
  )
}
