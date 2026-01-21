<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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

// Avatar state
const avatarData = ref<string | null>(null)
const isLoadingAvatar = ref(false)
const isUploadingAvatar = ref(false)
const avatarError = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

// Form state
const userName = ref('')
const userEmail = ref('')
const isSaving = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

// Computed
const userInitial = computed(() => {
  const name = authStore.user?.name || authStore.user?.username || ''
  return name.charAt(0).toUpperCase()
})

const roleLabel = computed(() => {
  const role = authStore.user?.role
  if (role === 'app-admin') return '系統管理員'
  if (role === 'app-manager') return '專案經理'
  return '一般使用者'
})

const roleBadgeClass = computed(() => {
  const role = authStore.user?.role
  if (role === 'app-admin') return 'bg-error/10 text-error'
  if (role === 'app-manager') return 'bg-warning/10 text-warning'
  return 'bg-info/10 text-info'
})

// Methods
async function loadAvatar(): Promise<void> {
  isLoadingAvatar.value = true
  avatarError.value = null

  try {
    const data = await authStore.getAvatar()
    avatarData.value = data
  } catch (err) {
    // 靜默失敗，使用預設頭像
    avatarData.value = null
  } finally {
    isLoadingAvatar.value = false
  }
}

function triggerFileInput(): void {
  fileInputRef.value?.click()
}

async function handleFileSelect(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  // 驗證檔案類型
  const validTypes = ['image/png', 'image/jpeg', 'image/gif']
  if (!validTypes.includes(file.type)) {
    avatarError.value = '只支援 PNG、JPG、GIF 格式'
    return
  }

  // 驗證檔案大小 (最大 2MB)
  if (file.size > 2 * 1024 * 1024) {
    avatarError.value = '檔案大小不能超過 2MB'
    return
  }

  isUploadingAvatar.value = true
  avatarError.value = null

  try {
    // 轉換為 Base64
    const base64 = await fileToBase64(file)

    // 上傳
    await authStore.uploadAvatar(base64)

    // 重新載入頭像
    await loadAvatar()

    showSuccess('頭像已更新')
  } catch (err) {
    avatarError.value = parseAvatarError(err)
  } finally {
    isUploadingAvatar.value = false
    // 清除 input 以便重複選擇同一檔案
    input.value = ''
  }
}

async function handleRemoveAvatar(): Promise<void> {
  if (!confirm('確定要移除頭像嗎？')) return

  isUploadingAvatar.value = true
  avatarError.value = null

  try {
    await authStore.removeAvatar()
    avatarData.value = null
    showSuccess('頭像已移除')
  } catch (err) {
    avatarError.value = parseAvatarError(err)
  } finally {
    isUploadingAvatar.value = false
  }
}

function parseAvatarError(err: unknown): string {
  if (err instanceof Error) {
    // Method not found - KanproBridge User Avatar 功能未啟用
    if (err.message.includes('-32601') || err.message.includes('Method not found')) {
      return '頭像功能未啟用，請在 Kanboard 設定中啟用 KanproBridge User Avatar'
    }
    return err.message
  }
  return '操作失敗'
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // 移除 data:image/xxx;base64, 前綴
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function showSuccess(message: string): void {
  successMessage.value = message
  setTimeout(() => {
    successMessage.value = null
  }, 3000)
}

async function handleSave(): Promise<void> {
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
    showSuccess('設定已儲存')
  } catch (err) {
    error.value = err instanceof Error ? err.message : '儲存失敗'
  } finally {
    isSaving.value = false
  }
}

function handleSearchSelect(task: Task): void {
  router.push(`/projects/${task.project_id}?task=${task.id}`)
  emit('close-search-modal')
}

onMounted(() => {
  if (authStore.user) {
    userName.value = authStore.user.name || ''
    userEmail.value = authStore.user.email || ''
  }
  loadAvatar()
})
</script>

<template>
  <div class="h-full overflow-auto bg-surface-secondary">
    <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-content">使用者設定</h1>
        <p class="text-content-secondary mt-1">管理您的個人資訊與帳號設定</p>
      </div>

      <!-- Alerts -->
      <div v-if="error" class="alert-error mb-6">
        <div class="flex items-center gap-2">
          <ph-icon icon="warning" class="w-5 h-5" />
          <span>{{ error }}</span>
        </div>
      </div>

      <div v-if="successMessage" class="alert-success mb-6">
        <div class="flex items-center gap-2">
          <ph-icon icon="check-circle" class="w-5 h-5" />
          <span>{{ successMessage }}</span>
        </div>
      </div>

      <!-- Main Content: Two Column Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Column: Avatar & Quick Info -->
        <div class="lg:col-span-1 space-y-6">
          <!-- Avatar Card -->
          <div class="card p-6">
            <h2 class="text-lg font-semibold text-content mb-4">個人頭像</h2>

            <!-- Avatar Display -->
            <div class="flex flex-col items-center">
              <div class="relative group">
                <!-- Avatar Image or Placeholder -->
                <div
                  class="w-32 h-32 rounded-full overflow-hidden bg-surface-tertiary flex items-center justify-center ring-4 ring-surface-secondary"
                >
                  <img
                    v-if="avatarData"
                    :src="`data:image/png;base64,${avatarData}`"
                    alt="頭像"
                    class="w-full h-full object-cover"
                  />
                  <span v-else class="text-4xl font-semibold text-content-tertiary">
                    {{ userInitial }}
                  </span>

                  <!-- Loading Overlay -->
                  <div
                    v-if="isLoadingAvatar || isUploadingAvatar"
                    class="absolute inset-0 bg-surface/80 flex items-center justify-center"
                  >
                    <ph-icon icon="spinner" class="w-8 h-8 text-accent animate-spin" />
                  </div>
                </div>

                <!-- Hover Overlay -->
                <button
                  @click="triggerFileInput"
                  :disabled="isUploadingAvatar"
                  class="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                >
                  <ph-icon icon="camera" class="w-8 h-8 text-white" />
                </button>
              </div>

              <!-- Hidden File Input -->
              <input
                ref="fileInputRef"
                type="file"
                accept="image/png,image/jpeg,image/gif"
                class="hidden"
                @change="handleFileSelect"
              />

              <!-- Avatar Actions -->
              <div class="mt-4 flex gap-2">
                <button
                  @click="triggerFileInput"
                  :disabled="isUploadingAvatar"
                  class="btn-secondary text-sm"
                >
                  <ph-icon icon="upload-simple" class="w-4 h-4 mr-1" />
                  上傳
                </button>
                <button
                  v-if="avatarData"
                  @click="handleRemoveAvatar"
                  :disabled="isUploadingAvatar"
                  class="btn-secondary text-sm text-error hover:bg-error/10"
                >
                  <ph-icon icon="trash" class="w-4 h-4 mr-1" />
                  移除
                </button>
              </div>

              <!-- Avatar Error -->
              <p v-if="avatarError" class="mt-2 text-sm text-error text-center">
                {{ avatarError }}
              </p>

              <!-- Avatar Hint -->
              <p class="mt-3 text-xs text-content-tertiary text-center">
                支援 PNG、JPG、GIF，最大 2MB
              </p>
            </div>
          </div>

          <!-- Account Info Card -->
          <div class="card p-6">
            <h2 class="text-lg font-semibold text-content mb-4">帳號資訊</h2>

            <div class="space-y-4">
              <div class="flex items-center justify-between py-2 border-b border-edge">
                <span class="text-sm text-content-tertiary">使用者 ID</span>
                <span class="text-sm font-medium text-content">{{ authStore.user?.id }}</span>
              </div>

              <div class="flex items-center justify-between py-2 border-b border-edge">
                <span class="text-sm text-content-tertiary">使用者名稱</span>
                <span class="text-sm font-medium text-content font-mono">@{{ authStore.user?.username }}</span>
              </div>

              <div class="flex items-center justify-between py-2 border-b border-edge">
                <span class="text-sm text-content-tertiary">角色</span>
                <span :class="['text-xs px-2 py-1 rounded-full font-medium', roleBadgeClass]">
                  {{ roleLabel }}
                </span>
              </div>

              <div class="flex items-center justify-between py-2 border-b border-edge">
                <span class="text-sm text-content-tertiary">帳號狀態</span>
                <span :class="authStore.user?.is_active ? 'text-success' : 'text-error'" class="text-sm font-medium">
                  {{ authStore.user?.is_active ? '啟用中' : '已停用' }}
                </span>
              </div>

              <div class="flex items-center justify-between py-2">
                <span class="text-sm text-content-tertiary">伺服器</span>
                <span class="text-sm text-content truncate max-w-[180px]" :title="authStore.apiUrl">
                  {{ authStore.apiUrl }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Profile Settings -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Profile Information Card -->
          <div class="card">
            <div class="p-6 border-b border-edge">
              <h2 class="text-lg font-semibold text-content">個人資訊</h2>
              <p class="text-sm text-content-secondary mt-1">更新您的顯示名稱與聯絡資訊</p>
            </div>

            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Username (read-only) -->
                <div>
                  <label class="block text-sm font-medium text-content-secondary mb-2">
                    使用者名稱
                  </label>
                  <input
                    :value="authStore.user?.username"
                    type="text"
                    disabled
                    class="input bg-surface-tertiary text-content-tertiary cursor-not-allowed"
                  />
                  <p class="text-xs text-content-tertiary mt-1">使用者名稱無法變更</p>
                </div>

                <!-- Display Name -->
                <div>
                  <label for="userName" class="block text-sm font-medium text-content-secondary mb-2">
                    顯示名稱 <span class="text-error">*</span>
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
                <div class="md:col-span-2">
                  <label for="userEmail" class="block text-sm font-medium text-content-secondary mb-2">
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
                  <p class="text-xs text-content-tertiary mt-1">用於接收通知與帳號相關訊息</p>
                </div>

                <!-- Role (read-only) -->
                <div>
                  <label class="block text-sm font-medium text-content-secondary mb-2">
                    系統角色
                  </label>
                  <input
                    :value="roleLabel"
                    type="text"
                    disabled
                    class="input bg-surface-tertiary text-content-tertiary cursor-not-allowed"
                  />
                  <p class="text-xs text-content-tertiary mt-1">角色由管理員設定</p>
                </div>

                <!-- Status (read-only) -->
                <div>
                  <label class="block text-sm font-medium text-content-secondary mb-2">
                    帳號狀態
                  </label>
                  <div class="input bg-surface-tertiary flex items-center gap-2 cursor-not-allowed">
                    <span
                      :class="authStore.user?.is_active ? 'bg-success' : 'bg-error'"
                      class="w-2 h-2 rounded-full"
                    ></span>
                    <span class="text-content-tertiary">
                      {{ authStore.user?.is_active ? '啟用中' : '已停用' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Save Button -->
              <div class="mt-8 pt-6 border-t border-edge flex justify-end">
                <button
                  @click="handleSave"
                  :disabled="isSaving"
                  class="btn-primary"
                >
                  <ph-icon v-if="isSaving" icon="spinner" class="w-4 h-4 mr-2 animate-spin" />
                  <span>{{ isSaving ? '儲存中...' : '儲存變更' }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Security Section (placeholder for future) -->
          <div class="card">
            <div class="p-6 border-b border-edge">
              <h2 class="text-lg font-semibold text-content">安全性設定</h2>
              <p class="text-sm text-content-secondary mt-1">管理您的密碼與安全選項</p>
            </div>

            <div class="p-6">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-medium text-content">密碼</h3>
                  <p class="text-sm text-content-tertiary mt-1">請透過 Kanboard 後台變更密碼</p>
                </div>
                <a
                  :href="`${authStore.apiUrl?.replace('/jsonrpc.php', '')}/user/${authStore.user?.id}/password`"
                  target="_blank"
                  class="btn-secondary text-sm"
                >
                  <ph-icon icon="arrow-square-out" class="w-4 h-4 mr-1" />
                  前往變更
                </a>
              </div>

              <!-- 2FA Status -->
              <div class="mt-6 pt-6 border-t border-edge flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-medium text-content">雙重認證 (2FA)</h3>
                  <p class="text-sm text-content-tertiary mt-1">
                    {{ authStore.user?.twofactor_activated ? '已啟用' : '未啟用' }}
                  </p>
                </div>
                <span
                  :class="authStore.user?.twofactor_activated ? 'text-success' : 'text-content-tertiary'"
                  class="text-sm"
                >
                  <ph-icon
                    :icon="authStore.user?.twofactor_activated ? 'shield-check' : 'shield'"
                    class="w-5 h-5"
                  />
                </span>
              </div>
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
