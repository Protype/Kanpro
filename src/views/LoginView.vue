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

const apiUrl = ref('')
const username = ref('')
const password = ref('')
const rememberMe = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const isEditingApiUrl = ref(false)
const configLoading = ref(true)

// 是否有 API URL（有值就顯示純文字模式）
const hasApiUrl = computed(() => !!apiUrl.value)

// 是否有 config.json 預設值（用於顯示重置按鈕）
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
 * 切換 API URL 編輯模式
 */
const toggleApiUrlEdit = () => {
  isEditingApiUrl.value = !isEditingApiUrl.value
}

/**
 * 重置 API URL 為 config.json 預設值
 */
const handleResetApiUrl = () => {
  appConfig.clearApiUrl()
  apiUrl.value = appConfig.configFileApiUrl.value || ''
  isEditingApiUrl.value = false
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

    router.push('/')
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        errorMessage.value = '帳號或密碼錯誤'
      } else if (error.message.includes('Unexpected token') || error.message.includes('not valid JSON')) {
        // 返回的不是 JSON，可能是 API 路徑錯誤
        errorMessage.value = 'API 端點錯誤（伺服器返回非 JSON 格式，請確認網址是否正確）'
      } else if (error.message.includes('Network') || error.message.includes('fetch') || error.message.includes('Failed')) {
        // 跨域請求失敗，可能是 CORS 問題
        if (wasCrossOrigin && !import.meta.env.DEV) {
          errorMessage.value = '無法連線到伺服器（可能是 CORS 未設定，請確認伺服器已啟用跨域存取）'
        } else {
          errorMessage.value = '無法連線到伺服器'
        }
      } else {
        errorMessage.value = error.message || '登入失敗，請稍後再試'
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

    <div class="max-w-md w-full card p-8 mx-4">
      <h2 class="text-2xl font-bold text-center text-content mb-8">Kanpro</h2>

      <!-- 錯誤訊息 -->
      <div v-if="errorMessage" class="alert-error mb-4">
        <p class="text-sm">{{ errorMessage }}</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <!-- 伺服器網址 -->
        <div>
          <label for="apiUrl" class="block text-sm font-medium text-content-secondary mb-1">
            伺服器網址
          </label>
          <!-- 載入中 -->
          <div v-if="configLoading" class="input bg-surface-tertiary animate-pulse">
            載入中...
          </div>
          <!-- 有 URL 且非編輯模式時：顯示虛線底連結 + 編輯按鈕 -->
          <div v-else-if="hasApiUrl && !isEditingApiUrl" class="flex items-center gap-2">
            <a
              :href="displayApiUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 border-b border-dashed border-current truncate"
            >
              {{ displayApiUrl }}
            </a>
            <button
              type="button"
              @click="toggleApiUrlEdit"
              class="text-content-tertiary hover:text-content flex-shrink-0 cursor-pointer"
              title="編輯"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
          </div>
          <!-- 無 URL 或編輯模式時：顯示輸入框 -->
          <div v-else class="flex items-center gap-2">
            <input
              id="apiUrl"
              v-model="apiUrl"
              type="text"
              required
              placeholder="/kanboard/ 或 http://your-kanboard-server/"
              class="input flex-1"
            />
            <button
              v-if="hasConfigFileUrl"
              type="button"
              @click="handleResetApiUrl"
              class="btn-secondary text-sm px-3 py-2"
            >
              重置
            </button>
            <button
              v-if="hasApiUrl"
              type="button"
              @click="toggleApiUrlEdit"
              class="btn-secondary text-sm px-3 py-2"
            >
              取消
            </button>
          </div>
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
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            登入中...
          </span>
          <span v-else>登入</span>
        </button>
      </form>
    </div>
  </div>
</template>
