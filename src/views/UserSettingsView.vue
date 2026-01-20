<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import SearchModal from '@/components/SearchModal.vue'
import type { Task } from '@/types'

defineProps<{
  showSearchModal?: boolean
}>()

const emit = defineEmits<{
  'close-search-modal': []
}>()

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

const handleSearchSelect = (task: Task) => {
  router.push(`/projects/${task.project_id}?task=${task.id}`)
  emit('close-search-modal')
}
</script>

<template>
  <div class="h-full overflow-auto bg-surface-secondary">
    <main class="mx-auto max-w-2xl px-4 py-6">
      <!-- Page Title -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-content">使用者設定</h1>
        <p class="text-content-secondary mt-1">管理您的帳號資訊</p>
      </div>
      <!-- Error Alert -->
      <div v-if="error" class="alert-error mb-6">
        <div class="flex items-center gap-2">
          <ph-icon icon="triangle-exclamation" class="w-5 h-5" />
          <span>{{ error }}</span>
        </div>
      </div>

      <!-- Success Alert -->
      <div v-if="successMessage" class="alert-success mb-6">
        <div class="flex items-center gap-2">
          <ph-icon icon="check" class="w-5 h-5" />
          <span>{{ successMessage }}</span>
        </div>
      </div>

      <!-- Settings Form -->
      <div class="card">
        <!-- Profile Section -->
        <div class="p-6 border-b border-edge">
          <h2 class="text-lg font-semibold text-content mb-4">個人資訊</h2>

          <div class="space-y-4">
            <!-- Username (read-only) -->
            <div>
              <label class="block text-sm font-medium text-content-secondary mb-1">
                使用者名稱
              </label>
              <input
                :value="authStore.user?.username"
                type="text"
                disabled
                class="input bg-surface-tertiary text-content-tertiary"
              />
              <p class="text-xs text-content-tertiary mt-1">使用者名稱無法變更</p>
            </div>

            <!-- Name -->
            <div>
              <label for="userName" class="block text-sm font-medium text-content-secondary mb-1">
                顯示名稱 <span class="text-red-500">*</span>
              </label>
              <input
                id="userName"
                v-model="userName"
                type="text"
                class="input"
                placeholder="輸入顯示名稱"
                :disabled="isSaving"
              />
            </div>

            <!-- Email -->
            <div>
              <label for="userEmail" class="block text-sm font-medium text-content-secondary mb-1">
                電子郵件
              </label>
              <input
                id="userEmail"
                v-model="userEmail"
                type="email"
                class="input"
                placeholder="輸入電子郵件"
                :disabled="isSaving"
              />
            </div>

            <!-- Role (read-only) -->
            <div>
              <label class="block text-sm font-medium text-content-secondary mb-1">
                角色
              </label>
              <input
                :value="authStore.user?.role === 'app-admin' ? '系統管理員' : authStore.user?.role === 'app-manager' ? '專案經理' : '一般使用者'"
                type="text"
                disabled
                class="input bg-surface-tertiary text-content-tertiary"
              />
            </div>
          </div>

          <!-- Save Button -->
          <div class="mt-6">
            <button
              @click="handleSave"
              :disabled="isSaving"
              class="btn-primary"
            >
              <span v-if="isSaving">儲存中...</span>
              <span v-else>儲存變更</span>
            </button>
          </div>
        </div>

        <!-- Account Info Section -->
        <div class="p-6">
          <h2 class="text-lg font-semibold text-content mb-4">帳號資訊</h2>

          <div class="space-y-3 text-sm">
            <div class="flex justify-between">
              <span class="text-content-tertiary">伺服器</span>
              <span class="text-content">{{ authStore.apiUrl }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-content-tertiary">使用者 ID</span>
              <span class="text-content">{{ authStore.user?.id }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-content-tertiary">狀態</span>
              <span :class="authStore.user?.is_active ? 'text-success' : 'text-error'">
                {{ authStore.user?.is_active ? '啟用中' : '已停用' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Search Modal -->
    <SearchModal
      v-if="showSearchModal"
      @close="emit('close-search-modal')"
      @select="handleSearchSelect"
    />
  </div>
</template>
