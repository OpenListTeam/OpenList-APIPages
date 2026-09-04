import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import zhCN from './locales/zh-CN'
import zhTW from './locales/zh-TW'
import enUS from './locales/en-US'
import jaJP from './locales/ja-JP'
import koKR from './locales/ko-KR'

export const LANGUAGES = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English' },
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'ja-JP', label: '日本語' },
  { value: 'ko-KR', label: '한국어' },
]

export const i18nInitPromise = i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'zh-CN': { translation: zhCN },
      'zh-TW': { translation: zhTW },
      'en-US': { translation: enUS },
      'ja-JP': { translation: jaJP },
      'ko-KR': { translation: koKR },
    },
    fallbackLng: 'zh-CN',
    supportedLngs: ['zh-CN', 'zh-TW', 'en-US', 'ja-JP', 'ko-KR'],
    lng: 'zh-CN',
    defaultNS: 'translation',
    ns: ['translation'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'openlist-lang',
    },
    react: {
      useSuspense: false,
    },
  })

export default i18n
