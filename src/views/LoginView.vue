<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import ThemeToggle from '@/components/ThemeToggle.vue'

const router = useRouter()
const authStore = useAuthStore()
const theme = useTheme()

const apiUrl = ref('')
const username = ref('')
const password = ref('')
const rememberMe = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

onMounted(() => {
  // 初始化主題
  theme.init()

  // 從環境變數載入預設 API URL
  const envApiUrl = import.meta.env.VITE_KANBOARD_API_URL
  if (envApiUrl) {
    apiUrl.value = envApiUrl
  }
})

const handleLogin = async () => {
  errorMessage.value = ''
  isLoading.value = true

  try {
    await authStore.login({
      apiUrl: apiUrl.value,
      username: username.value,
      password: password.value,
      rememberMe: rememberMe.value
    })
    router.push('/')
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        errorMessage.value = '帳號或密碼錯誤'
      } else if (error.message.includes('Network') || error.message.includes('fetch')) {
        errorMessage.value = '無法連線到伺服器'
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
          <input
            id="apiUrl"
            v-model="apiUrl"
            type="url"
            required
            placeholder="http://your-kanboard-server/jsonrpc.php"
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
