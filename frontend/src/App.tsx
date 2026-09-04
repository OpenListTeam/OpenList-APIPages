import { I18nextProvider, useTranslation } from 'react-i18next'
import { App as AntdApp, ConfigProvider, theme as antdTheme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import zhTW from 'antd/locale/zh_TW'
import enUS from 'antd/locale/en_US'
import jaJP from 'antd/locale/ja_JP'
import koKR from 'antd/locale/ko_KR'
import { ThemeProvider, useTheme } from './theme/ThemeContext'
import TokenPage from './pages/TokenPage'
import i18n from './i18n'

const ANT_LOCALES: Record<string, typeof zhCN> = {
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'en-US': enUS,
  'ja-JP': jaJP,
  'ko-KR': koKR,
}

function AppInner() {
  const { i18n } = useTranslation()
  const { mode } = useTheme()

  const locale = ANT_LOCALES[i18n.language || 'zh-CN'] ?? zhCN

  return (
    <ConfigProvider
      locale={locale}
      theme={{
        algorithm: mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#0ea5e9',
          colorInfo: '#0ea5e9',
          borderRadius: 12,
          fontFamily:
            "'MapleMono', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif",
        },
        components: {
          Card: {
            borderRadiusLG: 20,
          },
          Button: {
            borderRadius: 10,
            controlHeightLG: 44,
          },
          Input: {
            borderRadius: 10,
            controlHeightLG: 44,
          },
          Select: {
            borderRadius: 10,
            controlHeightLG: 44,
          },
          Modal: {
            borderRadiusLG: 20,
          },
        },
      }}
    >
      <AntdApp>
        <TokenPage />
      </AntdApp>
    </ConfigProvider>
  )
}

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <AppInner />
      </ThemeProvider>
    </I18nextProvider>
  )
}
