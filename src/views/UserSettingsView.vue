<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/stores/toast'
import { getAvatarColor, getAvatarInitial, getUserDisplayName } from '@/utils/avatar'
import SearchModal from '@/components/SearchModal.vue'
import type { Task } from '@/types'

defineProps<{
  showSearchModal?: boolean
}>()

const emit = defineEmits<{
  'close-search-modal': []
}>()

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()
const toast = useToast()

// Avatar state - 直接使用 store 的狀態
const avatarData = computed(() => authStore.avatarData)
const isLoadingAvatar = computed(() => authStore.avatarLoading)
const isUploadingAvatar = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

// Form state
const userName = ref('')
const userEmail = ref('')
const isSaving = ref(false)

// Password change state
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const isChangingPassword = ref(false)
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// Computed
const displayName = computed(() => getUserDisplayName(authStore.user))
const userInitial = computed(() => getAvatarInitial(displayName.value))
const avatarBgColor = computed(() => getAvatarColor(displayName.value))

const roleLabel = computed(() => {
  const role = authStore.user?.role
  if (role === 'app-admin') return t('user.appAdmin')
  if (role === 'app-manager') return t('user.appManager')
  return t('user.appUser')
})

const roleBadgeClass = computed(() => {
  const role = authStore.user?.role
  if (role === 'app-admin') return 'bg-error/10 text-error'
  if (role === 'app-manager') return 'bg-warning/10 text-warning'
  return 'bg-info/10 text-info'
})

const isAdmin = computed(() => authStore.user?.role === 'app-admin')

// Methods
async function loadAvatar(): Promise<void> {
  try {
    await authStore.loadAvatar()
  } catch (err) {
    console.error('[Avatar] Load error:', err)
    toast.error(t('message.loadFailed'), parseAvatarError(err))
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
    toast.error(t('settings.invalidFormat'), t('settings.supportedFormats'))
    return
  }

  // 驗證檔案大小 (最大 2MB)
  if (file.size > 2 * 1024 * 1024) {
    toast.error(t('settings.fileTooLarge'), t('settings.maxFileSize'))
    return
  }

  isUploadingAvatar.value = true

  try {
    // 轉換為 Base64
    const base64 = await fileToBase64(file)

    // 上傳（store 會自動更新 avatarData）
    await authStore.uploadAvatar(base64)

    toast.success(t('message.uploadSuccess'), t('settings.avatarUpdated'))
  } catch (err) {
    toast.error(t('message.uploadFailed'), parseAvatarError(err))
  } finally {
    isUploadingAvatar.value = false
    // 清除 input 以便重複選擇同一檔案
    input.value = ''
  }
}

async function handleRemoveAvatar(): Promise<void> {
  if (!confirm(t('settings.confirmRemoveAvatar'))) return

  isUploadingAvatar.value = true

  try {
    // 移除（store 會自動清除 avatarData）
    await authStore.removeAvatar()
    toast.success(t('message.removeSuccess'), t('settings.avatarRemoved'))
  } catch (err) {
    toast.error(t('message.removeFailed'), parseAvatarError(err))
  } finally {
    isUploadingAvatar.value = false
  }
}

function parseAvatarError(err: unknown): string {
  if (err instanceof Error) {
    // Method not found - KanproBridge User Avatar 功能未啟用
    if (err.message.includes('-32601') || err.message.includes('Method not found')) {
      return t('settings.avatarFeatureDisabled')
    }
    return err.message
  }
  return t('message.operationFailed')
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

async function handleSave(): Promise<void> {
  if (!userName.value.trim()) {
    toast.error(t('message.validationError'), t('settings.nameRequired'))
    return
  }

  isSaving.value = true

  try {
    await authStore.updateCurrentUser({
      name: userName.value.trim(),
      email: userEmail.value.trim()
    })
    toast.success(t('message.saved'), t('settings.profileUpdated'))
  } catch (err) {
    // 檢查是否為權限錯誤
    if (err instanceof Error && (err.message.includes('403') || err.message.includes('Forbidden'))) {
      toast.error(t('message.insufficientPermissions'), t('settings.adminRequiredForEdit'))
    } else {
      toast.error(t('message.saveFailed'), err instanceof Error ? err.message : t('message.error'))
    }
  } finally {
    isSaving.value = false
  }
}

async function handleChangePassword(): Promise<void> {
  // 驗證
  if (!currentPassword.value) {
    toast.error(t('message.validationError'), t('settings.enterCurrentPassword'))
    return
  }
  if (!newPassword.value) {
    toast.error(t('message.validationError'), t('settings.enterNewPassword'))
    return
  }
  if (newPassword.value.length < 6) {
    toast.error(t('message.validationError'), t('settings.passwordMinLength'))
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    toast.error(t('message.validationError'), t('message.passwordMismatch'))
    return
  }

  isChangingPassword.value = true

  try {
    await authStore.changePassword(currentPassword.value, newPassword.value)
    toast.success(t('message.changeSuccess'), t('settings.passwordUpdated'))
    // 清空表單
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (err) {
    toast.error(t('message.changeFailed'), parsePasswordError(err))
  } finally {
    isChangingPassword.value = false
  }
}

function parsePasswordError(err: unknown): string {
  if (err instanceof Error) {
    // Method not found - KanproBridge User Password 功能未啟用
    if (err.message.includes('-32601') || err.message.includes('Method not found')) {
      return t('settings.passwordFeatureDisabled')
    }
    // 密碼錯誤
    if (err.message.includes('Invalid') || err.message.includes('incorrect')) {
      return t('settings.incorrectPassword')
    }
    return err.message
  }
  return t('message.changeFailed')
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
  // 如果尚未載入頭像，載入之
  if (!authStore.avatarData && !authStore.avatarLoading) {
    loadAvatar()
  }
})
</script>

<template>
  <div class="h-full overflow-auto bg-surface-secondary">
    <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-content">{{ t('settings.userSettings') }}</h1>
        <p class="text-content-secondary mt-1">{{ t('settings.userSettingsDescription') }}</p>
      </div>

      <!-- Main Content: Two Column Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Column: Avatar & Quick Info -->
        <div class="lg:col-span-1 space-y-6">
          <!-- Avatar Card -->
          <div class="card p-6">
            <h2 class="text-lg font-semibold text-content mb-4">{{ t('user.avatar') }}</h2>

            <!-- Avatar Display -->
            <div class="flex flex-col items-center">
              <div class="relative group">
                <!-- Avatar Image or Placeholder -->
                <div
                  class="w-32 h-32 rounded-full overflow-hidden flex items-center justify-center ring-4 ring-surface-secondary"
                  :style="{ backgroundColor: avatarData ? 'transparent' : avatarBgColor }"
                >
                  <img
                    v-if="avatarData"
                    :src="`data:image/png;base64,${avatarData}`"
                    alt="頭像"
                    class="w-full h-full object-cover"
                  />
                  <span v-else class="text-4xl font-semibold text-white">
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
                  {{ t('settings.upload') }}
                </button>
                <button
                  v-if="avatarData"
                  @click="handleRemoveAvatar"
                  :disabled="isUploadingAvatar"
                  class="btn-secondary text-sm text-error hover:bg-error/10"
                >
                  <ph-icon icon="trash" class="w-4 h-4 mr-1" />
                  {{ t('common.remove') }}
                </button>
              </div>

              <!-- Avatar Hint -->
              <p class="mt-3 text-xs text-content-tertiary text-center">
                {{ t('settings.avatarHint') }}
              </p>
            </div>
          </div>

          <!-- Account Info Card -->
          <div class="card p-6">
            <h2 class="text-lg font-semibold text-content mb-4">{{ t('settings.accountInfo') }}</h2>

            <div class="space-y-4">
              <div class="flex items-center justify-between py-2 border-b border-edge">
                <span class="text-sm text-content-tertiary">{{ t('settings.userId') }}</span>
                <span class="text-sm font-medium text-content">{{ authStore.user?.id }}</span>
              </div>

              <div class="flex items-center justify-between py-2 border-b border-edge">
                <span class="text-sm text-content-tertiary">{{ t('user.username') }}</span>
                <span class="text-sm font-medium text-content font-mono">@{{ authStore.user?.username }}</span>
              </div>

              <div class="flex items-center justify-between py-2 border-b border-edge">
                <span class="text-sm text-content-tertiary">{{ t('user.role') }}</span>
                <span :class="['text-xs px-2 py-1 rounded-full font-medium', roleBadgeClass]">
                  {{ roleLabel }}
                </span>
              </div>

              <div class="flex items-center justify-between py-2 border-b border-edge">
                <span class="text-sm text-content-tertiary">{{ t('settings.accountStatus') }}</span>
                <span :class="authStore.user?.is_active ? 'text-success' : 'text-error'" class="text-sm font-medium">
                  {{ authStore.user?.is_active ? t('common.active') : t('common.disabled') }}
                </span>
              </div>

              <div class="flex items-center justify-between py-2">
                <span class="text-sm text-content-tertiary">{{ t('settings.server') }}</span>
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
              <h2 class="text-lg font-semibold text-content">{{ t('settings.profile') }}</h2>
              <p class="text-sm text-content-secondary mt-1">{{ t('settings.profileDescription') }}</p>
              <!-- 非管理員提示 -->
              <div v-if="!isAdmin" class="mt-3 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
                <p class="text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
                  <ph-icon icon="info" class="w-4 h-4 flex-shrink-0" />
                  <span>{{ t('settings.adminRequiredHint') }}</span>
                </p>
              </div>
            </div>

            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Username (read-only) -->
                <div>
                  <label class="block text-sm font-medium text-content-secondary mb-2">
                    {{ t('user.username') }}
                  </label>
                  <input
                    :value="authStore.user?.username"
                    type="text"
                    disabled
                    class="input bg-surface-tertiary text-content-tertiary cursor-not-allowed"
                  />
                  <p class="text-xs text-content-tertiary mt-1">{{ t('settings.usernameCannotChange') }}</p>
                </div>

                <!-- Display Name -->
                <div>
                  <label for="userName" class="block text-sm font-medium text-content-secondary mb-2">
                    {{ t('settings.displayName') }} <span class="text-error">*</span>
                  </label>
                  <input
                    id="userName"
                    v-model="userName"
                    type="text"
                    class="input"
                    :placeholder="t('settings.enterDisplayName')"
                    :disabled="isSaving"
                  />
                </div>

                <!-- Email -->
                <div class="md:col-span-2">
                  <label for="userEmail" class="block text-sm font-medium text-content-secondary mb-2">
                    {{ t('user.email') }}
                  </label>
                  <input
                    id="userEmail"
                    v-model="userEmail"
                    type="email"
                    class="input"
                    :placeholder="t('settings.enterEmail')"
                    :disabled="isSaving"
                  />
                  <p class="text-xs text-content-tertiary mt-1">{{ t('settings.emailHint') }}</p>
                </div>

                <!-- Role (read-only) -->
                <div>
                  <label class="block text-sm font-medium text-content-secondary mb-2">
                    {{ t('settings.systemRole') }}
                  </label>
                  <input
                    :value="roleLabel"
                    type="text"
                    disabled
                    class="input bg-surface-tertiary text-content-tertiary cursor-not-allowed"
                  />
                  <p class="text-xs text-content-tertiary mt-1">{{ t('settings.roleSetByAdmin') }}</p>
                </div>

                <!-- Status (read-only) -->
                <div>
                  <label class="block text-sm font-medium text-content-secondary mb-2">
                    {{ t('settings.accountStatus') }}
                  </label>
                  <div class="input bg-surface-tertiary flex items-center gap-2 cursor-not-allowed">
                    <span
                      :class="authStore.user?.is_active ? 'bg-success' : 'bg-error'"
                      class="w-2 h-2 rounded-full"
                    ></span>
                    <span class="text-content-tertiary">
                      {{ authStore.user?.is_active ? t('common.active') : t('common.disabled') }}
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
                  <span>{{ isSaving ? t('message.saving') : t('settings.saveChanges') }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Security Section -->
          <div class="card">
            <div class="p-6 border-b border-edge">
              <h2 class="text-lg font-semibold text-content">{{ t('settings.security') }}</h2>
              <p class="text-sm text-content-secondary mt-1">{{ t('settings.securityDescription') }}</p>
            </div>

            <div class="p-6">
              <!-- Password Change Form -->
              <div>
                <h3 class="text-sm font-medium text-content mb-4">{{ t('settings.changePassword') }}</h3>

                <div class="space-y-4">
                  <!-- Current Password -->
                  <div>
                    <label for="currentPassword" class="block text-sm font-medium text-content-secondary mb-2">
                      {{ t('settings.currentPassword') }}
                    </label>
                    <div class="relative">
                      <input
                        id="currentPassword"
                        v-model="currentPassword"
                        :type="showCurrentPassword ? 'text' : 'password'"
                        class="input pr-10"
                        :placeholder="t('settings.enterCurrentPassword')"
                        :disabled="isChangingPassword"
                        autocomplete="current-password"
                      />
                      <button
                        type="button"
                        @click="showCurrentPassword = !showCurrentPassword"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-content-tertiary hover:text-content-secondary"
                      >
                        <ph-icon :icon="showCurrentPassword ? 'eye-slash' : 'eye'" class="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <!-- New Password -->
                  <div>
                    <label for="newPassword" class="block text-sm font-medium text-content-secondary mb-2">
                      {{ t('settings.newPassword') }}
                    </label>
                    <div class="relative">
                      <input
                        id="newPassword"
                        v-model="newPassword"
                        :type="showNewPassword ? 'text' : 'password'"
                        class="input pr-10"
                        :placeholder="t('settings.enterNewPassword')"
                        :disabled="isChangingPassword"
                        autocomplete="new-password"
                      />
                      <button
                        type="button"
                        @click="showNewPassword = !showNewPassword"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-content-tertiary hover:text-content-secondary"
                      >
                        <ph-icon :icon="showNewPassword ? 'eye-slash' : 'eye'" class="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <!-- Confirm Password -->
                  <div>
                    <label for="confirmPassword" class="block text-sm font-medium text-content-secondary mb-2">
                      {{ t('settings.confirmPassword') }}
                    </label>
                    <div class="relative">
                      <input
                        id="confirmPassword"
                        v-model="confirmPassword"
                        :type="showConfirmPassword ? 'text' : 'password'"
                        class="input pr-10"
                        :placeholder="t('settings.reenterNewPassword')"
                        :disabled="isChangingPassword"
                        autocomplete="new-password"
                      />
                      <button
                        type="button"
                        @click="showConfirmPassword = !showConfirmPassword"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-content-tertiary hover:text-content-secondary"
                      >
                        <ph-icon :icon="showConfirmPassword ? 'eye-slash' : 'eye'" class="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <!-- Change Password Button -->
                  <div class="pt-2">
                    <button
                      @click="handleChangePassword"
                      :disabled="isChangingPassword"
                      class="btn-primary"
                    >
                      <ph-icon v-if="isChangingPassword" icon="spinner" class="w-4 h-4 mr-2 animate-spin" />
                      <ph-icon v-else icon="lock" class="w-4 h-4 mr-2" />
                      <span>{{ isChangingPassword ? t('settings.changingPassword') : t('settings.changePassword') }}</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- 2FA Status -->
              <div class="mt-6 pt-6 border-t border-edge flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-medium text-content">{{ t('settings.twoFactor') }}</h3>
                  <p class="text-sm text-content-tertiary mt-1">
                    {{ authStore.user?.twofactor_activated ? t('common.enabled') : t('common.disabled') }}
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
