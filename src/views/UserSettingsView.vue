<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import NotificationsDropdown from '@/components/NotificationsDropdown.vue'

const router = useRouter()
const authStore = useAuthStore()

// Form state
const userName = ref('')
const userEmail = ref('')
const isSaving = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

onMounted(() => {
  if (authStore.user) {
    userName.value = authStore.user.name || ''
    userEmail.value = authStore.user.email || ''
  }
})

const handleSave = async () => {
  if (!userName.value.trim()) {
    error.value = '名稱不能為空'
    return
  }

  isSaving.value = true
  error.value = null
  successMessage.value = null

  try {
    await authStore.updateCurrentUser({
      name: userName.value.trim(),
      email: userEmail.value.trim()
    })
    successMessage.value = '設定已儲存'
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '儲存失敗'
  } finally {
    isSaving.value = false
  }
}

const goBack = () => {
  router.back()
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Header -->
    <header class="bg-white shadow">
      <div class="mx-auto max-w-7xl px-4 py-4 flex justify-between items-center">
        <div class="flex items-center gap-4">
          <button
            @click="goBack"
            class="text-gray-600 hover:text-gray-900"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 class="text-xl font-bold text-gray-900">使用者設定</h1>
        </div>
        <div class="flex items-center gap-4">
          <NotificationsDropdown />
          <span class="text-gray-600 text-sm">
            {{ authStore.user?.name || authStore.user?.username }}
          </span>
          <button
            @click="handleLogout"
            class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            登出
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-2xl px-4 py-6">
      <!-- Error Alert -->
      <div v-if="error" class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex items-center gap-2 text-red-800">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{{ error }}</span>
        </div>
      </div>

      <!-- Success Alert -->
      <div v-if="successMessage" class="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
        <div class="flex items-center gap-2 text-green-800">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>{{ successMessage }}</span>
        </div>
      </div>

      <!-- Settings Form -->
      <div class="bg-white rounded-lg shadow">
        <!-- Profile Section -->
        <div class="p-6 border-b">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">個人資訊</h2>

          <div class="space-y-4">
            <!-- Username (read-only) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                使用者名稱
              </label>
              <input
                :value="authStore.user?.username"
                type="text"
                disabled
                class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
              <p class="text-xs text-gray-500 mt-1">使用者名稱無法變更</p>
            </div>

            <!-- Name -->
            <div>
              <label for="userName" class="block text-sm font-medium text-gray-700 mb-1">
                顯示名稱 <span class="text-red-500">*</span>
              </label>
              <input
                id="userName"
                v-model="userName"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="輸入顯示名稱"
                :disabled="isSaving"
              />
            </div>

            <!-- Email -->
            <div>
              <label for="userEmail" class="block text-sm font-medium text-gray-700 mb-1">
                電子郵件
              </label>
              <input
                id="userEmail"
                v-model="userEmail"
                type="email"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="輸入電子郵件"
                :disabled="isSaving"
              />
            </div>

            <!-- Role (read-only) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                角色
              </label>
              <input
                :value="authStore.user?.role === 'app-admin' ? '系統管理員' : authStore.user?.role === 'app-manager' ? '專案經理' : '一般使用者'"
                type="text"
                disabled
                class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
            </div>
          </div>

          <!-- Save Button -->
          <div class="mt-6">
            <button
              @click="handleSave"
              :disabled="isSaving"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="isSaving">儲存中...</span>
              <span v-else>儲存變更</span>
            </button>
          </div>
        </div>

        <!-- Account Info Section -->
        <div class="p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">帳號資訊</h2>

          <div class="space-y-3 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">伺服器</span>
              <span class="text-gray-900">{{ authStore.apiUrl }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">使用者 ID</span>
              <span class="text-gray-900">{{ authStore.user?.id }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">狀態</span>
              <span :class="authStore.user?.is_active ? 'text-green-600' : 'text-red-600'">
                {{ authStore.user?.is_active ? '啟用中' : '已停用' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
