<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import { useAppConfig } from '@/composables/useAppConfig'
import ThemeToggle from '@/components/ThemeToggle.vue'

const router = useRouter()
const authStore = useAuthStore()
const theme = useTheme()
const appConfig = useAppConfig()
const { t } = useI18n()

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
  if (!apiUrl.value) return t('common.none')
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
    errorMessage.value = t('auth.invalidServerUrl')
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
      const msg = error.message

      // 認證失敗：帳號或密碼錯誤
      if (msg.includes('認證失敗')) {
        errorMessage.value = t('auth.invalidCredentials')
      }
      // 認證格式錯誤（通常是程式問題）
      else if (msg.includes('認證格式錯誤')) {
        errorMessage.value = t('auth.authFormatError')
      }
      // 外掛未安裝或 JWT 未啟用
      else if (msg.includes('KanproBridge') || msg.includes('外掛未安裝') || msg.includes('JWT')) {
        errorMessage.value = t('auth.pluginNotInstalled')
      }
      // API 路徑錯誤（返回非 JSON）
      else if (msg.includes('Unexpected token') || msg.includes('not valid JSON')) {
        errorMessage.value = t('auth.invalidApiResponse')
      }
      // 網路連線問題
      else if (msg.includes('Network') || msg.includes('fetch') || msg.includes('Failed')) {
        if (wasCrossOrigin && !import.meta.env.DEV) {
          errorMessage.value = t('auth.corsError')
        } else {
          errorMessage.value = t('auth.connectionError')
        }
      }
      // 其他錯誤
      else {
        errorMessage.value = t('auth.loginFailed') + (msg ? ': ' + msg : '')
      }
    } else {
      errorMessage.value = t('auth.loginFailed')
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
      <!-- 伺服器連結 icon（僅在 config 有設定時顯示，卡片右側跨線） -->
      <a
        v-if="hasConfigFileUrl && !configLoading"
        :href="displayApiUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="absolute top-[37px] -right-3.5 w-7 h-7 rounded-full bg-surface border border-edge flex items-center justify-center text-content-tertiary/50 hover:text-content-tertiary hover:border-content-tertiary/30 transition-colors"
        :title="t('auth.openKanboard')"
      >
        <ph-icon icon="hard-drives" class="w-4 h-4" />
      </a>

      <!-- 標題列 -->
      <div class="flex items-center justify-center mb-8">
        <h2 class="text-2xl font-bold text-content">Kanpro</h2>
      </div>

      <!-- 錯誤訊息 -->
      <div v-if="errorMessage" class="alert-error mb-4">
        <p class="text-sm">{{ errorMessage }}</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <!-- 伺服器網址（載入完成且 config 無設定時顯示） -->
        <div v-if="!configLoading && !hasConfigFileUrl">
          <label for="apiUrl" class="block text-sm font-medium text-content-secondary mb-1">
            {{ t('auth.serverUrl') }}
          </label>
          <input
            id="apiUrl"
            v-model="apiUrl"
            type="text"
            required
            :placeholder="t('auth.serverUrlPlaceholder')"
            class="input"
          />
        </div>

        <!-- 帳號 -->
        <div>
          <label for="username" class="block text-sm font-medium text-content-secondary mb-1">
            {{ t('auth.username') }}
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
            {{ t('auth.password') }}
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
            {{ t('auth.rememberMe') }}
          </label>
        </div>

        <!-- 登入按鈕 -->
        <button
          type="submit"
          :disabled="isLoading"
          class="btn-primary w-full"
        >
          <span v-if="isLoading" class="flex items-center justify-center">
            <ph-icon icon="spinner" class="animate-spin -ml-1 mr-2 h-4 w-4" />
            {{ t('auth.signingIn') }}
          </span>
          <span v-else>{{ t('auth.signIn') }}</span>
        </button>
      </form>
    </div>
  </div>
</template>
