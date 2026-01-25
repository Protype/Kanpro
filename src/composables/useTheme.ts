import { ref, computed, watch } from 'vue'

/**
 * 主題名稱類型
 */
export type ThemeName = 'twenty-crm' | 'github-dark' | 'dracula'

/**
 * 主題資訊介面
 */
export interface ThemeInfo {
  id: ThemeName
  nameKey: string
  descriptionKey: string
  isDark: boolean
}

/**
 * 可用主題列表
 */
export const THEMES: ThemeInfo[] = [
  {
    id: 'twenty-crm',
    nameKey: 'theme.twentyCrm',
    descriptionKey: 'theme.twentyCrmDesc',
    isDark: false
  },
  {
    id: 'github-dark',
    nameKey: 'theme.githubDark',
    descriptionKey: 'theme.githubDarkDesc',
    isDark: true
  },
  {
    id: 'dracula',
    nameKey: 'theme.dracula',
    descriptionKey: 'theme.draculaDesc',
    isDark: true
  }
]

const STORAGE_KEY = 'kanpro-theme'
const OLD_STORAGE_KEY = 'theme-mode'
const DEFAULT_THEME: ThemeName = 'twenty-crm'

/**
 * 主題管理 composable
 *
 * 提供多主題切換功能，每個主題是獨立的配色方案
 */
export function useTheme() {
  const currentTheme = ref<ThemeName>(DEFAULT_THEME)

  /**
   * 當前主題資訊
   */
  const themeInfo = computed(() =>
    THEMES.find(t => t.id === currentTheme.value) || THEMES[0]
  )

  /**
   * 當前主題是否為暗色主題
   */
  const isDark = computed(() => themeInfo.value.isDark)

  /**
   * 套用主題到 DOM
   */
  function applyTheme(theme: ThemeName) {
    // 移除所有主題 class
    THEMES.forEach(t => {
      document.documentElement.classList.remove(`theme-${t.id}`)
    })
    // 移除舊的 dark/light class（相容性清理）
    document.documentElement.classList.remove('dark', 'light')

    // 套用新主題
    document.documentElement.classList.add(`theme-${theme}`)
  }

  /**
   * 設定主題
   */
  function setTheme(theme: ThemeName) {
    if (!THEMES.some(t => t.id === theme)) {
      console.warn(`Unknown theme: ${theme}, falling back to ${DEFAULT_THEME}`)
      theme = DEFAULT_THEME
    }

    currentTheme.value = theme
    localStorage.setItem(STORAGE_KEY, theme)
    applyTheme(theme)
  }

  /**
   * 初始化主題
   * 從 localStorage 讀取已儲存的主題設定
   */
  function init() {
    let saved = localStorage.getItem(STORAGE_KEY) as string | null

    // 檢查舊的儲存鍵（遷移）
    if (!saved) {
      const oldSaved = localStorage.getItem(OLD_STORAGE_KEY)
      if (oldSaved) {
        saved = oldSaved
        // 清除舊鍵
        localStorage.removeItem(OLD_STORAGE_KEY)
      }
    }

    // 相容性處理：舊的 light/dark/system 模式
    if (saved === 'light' || saved === 'system') {
      setTheme('twenty-crm')
      return
    }
    if (saved === 'dark') {
      setTheme('github-dark')
      return
    }

    if (saved && THEMES.some(t => t.id === saved)) {
      setTheme(saved as ThemeName)
    } else {
      setTheme(DEFAULT_THEME)
    }
  }

  // 監聽主題變更
  watch(currentTheme, (newTheme) => {
    applyTheme(newTheme)
  })

  return {
    currentTheme,
    themeInfo,
    isDark,
    setTheme,
    init,
    THEMES
  }
}

// 相容性導出（保持舊 API 可用）
export type ThemeMode = ThemeName
