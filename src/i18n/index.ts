import { createI18n } from 'vue-i18n'
import en_US from './locales/en_US.json'
import zh_TW from './locales/zh_TW.json'

/**
 * 支援的語言列表
 * 使用 Kanboard 格式的語言代碼
 */
export const SUPPORTED_LOCALES = ['en_US', 'zh_TW'] as const
export type SupportedLocale = typeof SUPPORTED_LOCALES[number]

/**
 * localStorage 中儲存 Kanpro 語言偏好的 key
 */
const LOCALE_STORAGE_KEY = 'kanpro-locale'

/**
 * 偵測應使用的語言
 * 優先序：
 * 1. localStorage (Kanpro 獨立設定)
 * 2. user.language (Kanboard 使用者設定)
 * 3. navigator.language (瀏覽器語言)
 * 4. 預設 'en_US'
 *
 * @param userLanguage - Kanboard 使用者設定的語言
 * @returns 偵測到的語言代碼
 */
export function detectLocale(userLanguage?: string | null): SupportedLocale {
  // 1. Kanpro localStorage
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
  if (stored && SUPPORTED_LOCALES.includes(stored as SupportedLocale)) {
    return stored as SupportedLocale
  }

  // 2. Kanboard user.language
  if (userLanguage && SUPPORTED_LOCALES.includes(userLanguage as SupportedLocale)) {
    return userLanguage as SupportedLocale
  }

  // 3. Browser language (navigator.language: "zh-TW" → "zh_TW")
  const browserLang = navigator.language.replace('-', '_')
  if (SUPPORTED_LOCALES.includes(browserLang as SupportedLocale)) {
    return browserLang as SupportedLocale
  }

  // 4. Default
  return 'en_US'
}

/**
 * 設定語言
 * 同時更新 i18n locale、localStorage 和 document.documentElement.lang
 *
 * @param locale - 要設定的語言代碼
 */
export function setLocale(locale: SupportedLocale): void {
  i18n.global.locale.value = locale
  localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  document.documentElement.lang = locale.replace('_', '-')
}

/**
 * 清除 Kanpro 的語言覆寫設定
 * 清除後下次載入會使用 Kanboard 使用者設定或瀏覽器語言
 */
export function clearLocaleOverride(): void {
  localStorage.removeItem(LOCALE_STORAGE_KEY)
}

/**
 * vue-i18n 實例
 */
export const i18n = createI18n({
  legacy: false,
  locale: 'en_US',
  fallbackLocale: 'en_US',
  messages: {
    en_US,
    zh_TW
  }
})

export default i18n
