import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { SUPPORTED_LOCALES, setLocale, clearLocaleOverride, detectLocale, type SupportedLocale } from '@/i18n'

/**
 * 語言選項類型
 * 'auto' 表示跟隨 Kanboard 設定
 */
export type LocaleOption = SupportedLocale | 'auto'

/**
 * 語言選項資訊介面
 */
export interface LocaleInfo {
  id: LocaleOption
  nameKey: string
  icon: string
}

/**
 * 可用語言列表
 */
export const LOCALES: LocaleInfo[] = [
  {
    id: 'auto',
    nameKey: 'settings.followKanboard',
    icon: 'arrows-clockwise'
  },
  {
    id: 'en_US',
    nameKey: 'settings.languageEnUS',
    icon: 'globe'
  },
  {
    id: 'zh_TW',
    nameKey: 'settings.languageZhTW',
    icon: 'globe'
  }
]

const STORAGE_KEY = 'kanpro-locale'

/**
 * 語言管理 composable
 *
 * 提供多語言切換功能
 * - auto: 跟隨 Kanboard 使用者設定或瀏覽器語言
 * - en_US: 英文
 * - zh_TW: 繁體中文
 */
export function useLocale() {
  const { locale } = useI18n()

  /**
   * 當前語言選項
   * 'auto' 表示跟隨 Kanboard 設定，否則為具體語言代碼
   */
  const currentLocaleOption = ref<LocaleOption>('auto')

  /**
   * 當前實際語言
   */
  const currentLocale = computed(() => locale.value as SupportedLocale)

  /**
   * 當前語言選項資訊
   */
  const localeInfo = computed(() =>
    LOCALES.find(l => l.id === currentLocaleOption.value) || LOCALES[0]
  )

  /**
   * 設定語言
   * @param option - 語言選項：'auto' 或具體語言代碼
   * @param userLanguage - Kanboard 使用者設定的語言（用於 auto 模式）
   */
  function selectLocale(option: LocaleOption, userLanguage?: string | null) {
    currentLocaleOption.value = option

    if (option === 'auto') {
      // 清除本地覆寫，使用 Kanboard 設定或瀏覽器語言
      clearLocaleOverride()
      const detected = detectLocale(userLanguage)
      locale.value = detected
      document.documentElement.lang = detected.replace('_', '-')
    } else {
      // 設定具體語言
      setLocale(option)
    }
  }

  /**
   * 初始化語言設定
   * 從 localStorage 讀取已儲存的設定
   * @param userLanguage - Kanboard 使用者設定的語言
   */
  function init(userLanguage?: string | null) {
    const stored = localStorage.getItem(STORAGE_KEY)

    if (stored && SUPPORTED_LOCALES.includes(stored as SupportedLocale)) {
      // 有本地覆寫，使用該語言
      currentLocaleOption.value = stored as SupportedLocale
      setLocale(stored as SupportedLocale)
    } else {
      // 無本地覆寫，使用 auto 模式
      currentLocaleOption.value = 'auto'
      const detected = detectLocale(userLanguage)
      locale.value = detected
      document.documentElement.lang = detected.replace('_', '-')
    }
  }

  return {
    currentLocaleOption,
    currentLocale,
    localeInfo,
    selectLocale,
    init,
    LOCALES
  }
}
