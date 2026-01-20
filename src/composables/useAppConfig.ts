import { ref, computed } from 'vue'

const STORAGE_KEY = 'kanpro-api-url'

interface AppConfig {
  apiUrl: string
}

const configFromFile = ref<AppConfig | null>(null)
const configLoaded = ref(false)

/**
 * 重置配置狀態（僅供測試使用）
 */
export function resetAppConfig(): void {
  configFromFile.value = null
  configLoaded.value = false
}

/**
 * 應用程式配置管理
 * 優先級：localStorage > config.json
 */
export function useAppConfig() {
  /**
   * 從 config.json 載入配置
   */
  async function loadConfig(): Promise<void> {
    if (configLoaded.value) return

    try {
      const response = await fetch(`${import.meta.env.BASE_URL}config.json`)
      if (response.ok) {
        configFromFile.value = await response.json()
      }
    } catch {
      // config.json 不存在或無法讀取，忽略錯誤
    } finally {
      configLoaded.value = true
    }
  }

  /**
   * 從 localStorage 取得 API URL
   */
  function getStoredApiUrl(): string {
    try {
      return localStorage.getItem(STORAGE_KEY) || ''
    } catch {
      return ''
    }
  }

  /**
   * 儲存 API URL 到 localStorage
   */
  function setApiUrl(url: string): void {
    try {
      if (url) {
        localStorage.setItem(STORAGE_KEY, url)
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // 忽略儲存錯誤
    }
  }

  /**
   * 清除 localStorage 中的 API URL
   */
  function clearApiUrl(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // 忽略錯誤
    }
  }

  /**
   * 依優先級取得 API URL
   * 優先級：localStorage > config.json > 空字串
   */
  function getApiUrl(): string {
    const stored = getStoredApiUrl()
    if (stored) return stored

    if (configFromFile.value?.apiUrl) {
      return configFromFile.value.apiUrl
    }

    return ''
  }

  /**
   * 是否有預設的 API URL（來自 localStorage 或 config.json）
   */
  const hasConfiguredUrl = computed(() => {
    return !!(getStoredApiUrl() || configFromFile.value?.apiUrl)
  })

  /**
   * 取得 config.json 中的 API URL
   */
  const configFileApiUrl = computed(() => {
    return configFromFile.value?.apiUrl || ''
  })

  /**
   * 正規化 API URL
   * 非 .php 結尾時自動補上 jsonrpc.php
   */
  function normalizeApiUrl(url: string): string {
    let normalized = url.trim()
    if (!normalized) return ''

    if (!normalized.endsWith('.php')) {
      normalized = normalized.replace(/\/$/, '') + '/jsonrpc.php'
    }
    return normalized
  }

  return {
    loadConfig,
    getApiUrl,
    setApiUrl,
    clearApiUrl,
    getStoredApiUrl,
    hasConfiguredUrl,
    configFileApiUrl,
    normalizeApiUrl,
    configLoaded
  }
}
