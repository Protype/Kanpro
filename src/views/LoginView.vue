<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import { useAppConfig } from '@/composables/useAppConfig'
import ThemeToggle from '@/components/ThemeToggle.vue'

const router = useRouter()
const authStore = useAuthStore()
const theme = useTheme()
const appConfig = useAppConfig()

const REMEMBER_ME_KEY = 'kanpro_remember_me'

const apiUrl = ref('')
const username = ref('')
const password = ref('')
const rememberMe = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const configLoading = ref(true)

// 是否有 config.json 預設值（有值時鎖定不可編輯）
const hasConfigFileUrl = computed(() => !!appConfig.configFileApiUrl.value)

// 顯示的 API URL（用於純文字模式，移除 jsonrpc.php）
const displayApiUrl = computed(() => {
  if (!apiUrl.value) return '未設定'
  // 移除結尾的 /jsonrpc.php 或 jsonrpc.php
  return apiUrl.value.replace(/\/?jsonrpc\.php$/, '')
})

onMounted(async () => {
  // 初始化主題
  theme.init()

  // 載入「記住我」設定
  const savedRememberMe = localStorage.getItem(REMEMBER_ME_KEY)
  if (savedRememberMe) {
    try {
      const parsed = JSON.parse(savedRememberMe)
      if (parsed.rememberMe) {
        rememberMe.value = true
        username.value = parsed.username || ''
      }
    } catch {
      // 忽略解析錯誤
    }
  }

  // 載入配置
  await appConfig.loadConfig()

  // 優先從 config 載入 API URL
  const configuredUrl = appConfig.getApiUrl()
  if (configuredUrl) {
    apiUrl.value = configuredUrl
  }

  configLoading.value = false
})

/**
 * 驗證 API URL 格式
 * 支援相對路徑（以 / 開頭）和完整 URL（http:// 或 https://）
 */
const isValidApiUrl = (url: string): boolean => {
  const trimmedUrl = url.trim()

  // 允許相對路徑（以 / 開頭）
  if (trimmedUrl.startsWith('/')) {
    return true
  }

  // 允許完整 URL（http:// 或 https://）
  try {
    const parsed = new URL(trimmedUrl)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * 檢查 URL 是否為跨域
 */
const isCrossOrigin = (url: string): boolean => {
  if (url.startsWith('/')) return false
  try {
    const targetUrl = new URL(url)
    return targetUrl.origin !== window.location.origin
  } catch {
    return false
  }
}

/**
 * 開發模式下轉換為代理路徑
 */
const getProxiedUrl = (url: string): string => {
  // 開發模式下，跨域 URL 轉換為 /api 代理
  if (import.meta.env.DEV && isCrossOrigin(url)) {
    // 直接使用 /api/jsonrpc.php，由 vite 代理轉發到正確的伺服器
    return '/api/jsonrpc.php'
  }
  return url
}

const handleLogin = async () => {
  errorMessage.value = ''

  // 記錄使用者輸入的原始 URL（不含 jsonrpc.php，用於儲存和顯示）
  const userInputUrl = apiUrl.value.trim()

  // 驗證 API URL 格式
  if (!isValidApiUrl(userInputUrl)) {
    errorMessage.value = '請輸入有效的伺服器網址（如 /kanboard/ 或 http://...）'
    return
  }

  // 正規化 API URL（自動補上 jsonrpc.php，用於實際呼叫）
  let callUrl = appConfig.normalizeApiUrl(userInputUrl)
  const wasCrossOrigin = isCrossOrigin(callUrl)

  // 開發模式下使用代理
  callUrl = getProxiedUrl(callUrl)

  isLoading.value = true

  try {
    await authStore.login({
      apiUrl: callUrl,
      username: username.value,
      password: password.value,
      rememberMe: rememberMe.value
    })

    // 登入成功後儲存原始 URL（不含 jsonrpc.php）
    appConfig.setApiUrl(userInputUrl)

    // 保存或清除「記住我」設定
    if (rememberMe.value) {
      localStorage.setItem(REMEMBER_ME_KEY, JSON.stringify({
        rememberMe: true,
        username: username.value
      }))
    } else {
      localStorage.removeItem(REMEMBER_ME_KEY)
    }

    router.push('/')
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        // 使用者登入問題
        errorMessage.value = '登入失敗，帳號或密碼錯誤'
      } else if (error.message.includes('Unexpected token') || error.message.includes('not valid JSON')) {
        // 主機連線問題：API 路徑錯誤
        errorMessage.value = '伺服器連線錯誤，API 端點返回非 JSON 格式（請確認網址是否正確）'
      } else if (error.message.includes('Network') || error.message.includes('fetch') || error.message.includes('Failed')) {
        // 主機連線問題：網路錯誤
        if (wasCrossOrigin && !import.meta.env.DEV) {
          errorMessage.value = '伺服器連線錯誤，可能是 CORS 未設定（請確認伺服器已啟用跨域存取）'
        } else {
          errorMessage.value = '伺服器連線錯誤，無法連線到伺服器'
        }
      } else {
        // 其他登入問題
        errorMessage.value = '登入失敗，' + (error.message || '請稍後再試')
      }
    } else {
      errorMessage.value = '登入失敗，請稍後再試'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-surface-secondary">
    <!-- Theme Toggle -->
    <div class="absolute top-4 right-4">
      <ThemeToggle />
    </div>

    <div class="max-w-md w-full card p-8 mx-4 relative">
      <!-- 標題列 -->
      <div class="flex items-center justify-center mb-8">
        <h2 class="text-2xl font-bold text-content">Kanpro</h2>
      </div>

      <!-- 伺服器連結 icon（僅在 config 有設定時顯示，右下角） -->
      <a
        v-if="hasConfigFileUrl && !configLoading"
        :href="displayApiUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="absolute bottom-3 right-3 p-1 text-content-tertiary hover:text-content-secondary transition-colors"
        title="開啟 Kanboard 伺服器"
      >
        <font-awesome-icon icon="server" class="w-5 h-5" />
      </a>

      <!-- 錯誤訊息 -->
      <div v-if="errorMessage" class="alert-error mb-4">
        <p class="text-sm">{{ errorMessage }}</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <!-- 伺服器網址（僅在 config 無設定時顯示） -->
        <div v-if="!hasConfigFileUrl">
          <label for="apiUrl" class="block text-sm font-medium text-content-secondary mb-1">
            伺服器網址
          </label>
          <!-- 載入中 -->
          <div v-if="configLoading" class="input bg-surface-tertiary animate-pulse">
            載入中...
          </div>
          <!-- config.json 無值時：顯示輸入框 -->
          <input
            v-else
            id="apiUrl"
            v-model="apiUrl"
            type="text"
            required
            placeholder="/kanboard/ 或 http://your-kanboard-server/"
            class="input"
          />
        </div>

        <!-- 帳號 -->
        <div>
          <label for="username" class="block text-sm font-medium text-content-secondary mb-1">
            帳號
          </label>
          <input
            id="username"
            v-model="username"
            type="text"
            required
            autocomplete="username"
            class="input"
          />
        </div>

        <!-- 密碼 -->
        <div>
          <label for="password" class="block text-sm font-medium text-content-secondary mb-1">
            密碼
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            class="input"
          />
        </div>

        <!-- 記住我 -->
        <div class="flex items-center">
          <input
            id="rememberMe"
            v-model="rememberMe"
            type="checkbox"
            class="h-4 w-4 text-accent focus:ring-accent border-edge rounded"
          />
          <label for="rememberMe" class="ml-2 block text-sm text-content-secondary">
            記住我
          </label>
        </div>

        <!-- 登入按鈕 -->
        <button
          type="submit"
          :disabled="isLoading"
          class="btn-primary w-full"
        >
          <span v-if="isLoading" class="flex items-center justify-center">
            <font-awesome-icon icon="spinner" class="animate-spin -ml-1 mr-2 h-4 w-4" />
            登入中...
          </span>
          <span v-else>登入</span>
        </button>
      </form>
    </div>
  </div>
</template>
