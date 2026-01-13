<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUsersStore } from '@/stores/users'
import SearchModal from '@/components/SearchModal.vue'
import type { User, Task } from '@/types'

defineProps<{
  showSearchModal?: boolean
}>()

const emit = defineEmits<{
  'close-search-modal': []
}>()

const router = useRouter()
const authStore = useAuthStore()
const usersStore = useUsersStore()

// Form state
const isAdding = ref(false)
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

// New user form
const newUsername = ref('')
const newPassword = ref('')
const newName = ref('')
const newEmail = ref('')
const newRole = ref('app-user')

// Edit state
const editingUserId = ref<number | null>(null)
const editName = ref('')
const editEmail = ref('')
const editRole = ref('')

const roles = [
  { value: 'app-admin', label: '系統管理員' },
  { value: 'app-manager', label: '專案經理' },
  { value: 'app-user', label: '一般使用者' }
]

const getRoleLabel = (role: string) => {
  return roles.find(r => r.value === role)?.label || role
}

onMounted(async () => {
  await usersStore.fetchAllUsers()
})

const startAdding = () => {
  isAdding.value = true
  newUsername.value = ''
  newPassword.value = ''
  newName.value = ''
  newEmail.value = ''
  newRole.value = 'app-user'
  error.value = null
}

const cancelAdding = () => {
  isAdding.value = false
}

const handleAddUser = async () => {
  if (!newUsername.value.trim() || !newPassword.value || isSubmitting.value) return

  isSubmitting.value = true
  error.value = null

  try {
    await usersStore.createUser({
      username: newUsername.value.trim(),
      password: newPassword.value,
      name: newName.value.trim() || undefined,
      email: newEmail.value.trim() || undefined,
      role: newRole.value
    })
    await usersStore.fetchAllUsers()
    cancelAdding()
    successMessage.value = '使用者新增成功'
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '新增使用者失敗'
  } finally {
    isSubmitting.value = false
  }
}

const startEditing = (user: User) => {
  editingUserId.value = user.id
  editName.value = user.name || ''
  editEmail.value = user.email || ''
  editRole.value = user.role
  error.value = null
}

const cancelEditing = () => {
  editingUserId.value = null
}

const handleSaveUser = async () => {
  if (!editingUserId.value || isSubmitting.value) return

  isSubmitting.value = true
  error.value = null

  try {
    await usersStore.updateUser(editingUserId.value, {
      name: editName.value.trim() || undefined,
      email: editEmail.value.trim() || undefined,
      role: editRole.value
    })
    await usersStore.fetchAllUsers()
    cancelEditing()
    successMessage.value = '使用者更新成功'
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '更新使用者失敗'
  } finally {
    isSubmitting.value = false
  }
}

const handleToggleActive = async (user: User) => {
  try {
    if (user.is_active) {
      await usersStore.disableUser(user.id)
    } else {
      await usersStore.enableUser(user.id)
    }
    await usersStore.fetchAllUsers()
    successMessage.value = `使用者已${user.is_active ? '停用' : '啟用'}`
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '切換狀態失敗'
  }
}

const handleRemoveUser = async (user: User) => {
  if (!confirm(`確定要刪除使用者「${user.username}」嗎？此操作無法復原。`)) return

  try {
    await usersStore.removeUser(user.id)
    await usersStore.fetchAllUsers()
    successMessage.value = '使用者已刪除'
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '刪除使用者失敗'
  }
}

const handleSearchSelect = (task: Task) => {
  router.push(`/projects/${task.project_id}?task=${task.id}`)
  emit('close-search-modal')
}
</script>

<template>
  <div class="h-full overflow-auto bg-surface-secondary">
    <main class="mx-auto max-w-4xl px-4 py-6">
      <!-- Page Title -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-content">使用者管理</h1>
        <p class="text-content-secondary mt-1">管理系統使用者帳號</p>
      </div>
      <!-- Error Alert -->
      <div v-if="error" class="alert-error mb-6">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{{ error }}</span>
        </div>
      </div>

      <!-- Success Alert -->
      <div v-if="successMessage" class="alert-success mb-6">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>{{ successMessage }}</span>
        </div>
      </div>

      <!-- Header with Add button -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-semibold text-content">
          所有使用者
          <span v-if="usersStore.usersCount > 0" class="text-content-tertiary text-sm font-normal">
            ({{ usersStore.usersCount }})
          </span>
        </h2>
        <button
          v-if="!isAdding"
          @click="startAdding"
          class="btn-primary"
        >
          + 新增使用者
        </button>
      </div>

      <!-- Loading -->
      <div v-if="usersStore.isLoading" class="flex items-center justify-center py-12">
        <svg class="animate-spin h-8 w-8 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <div v-else class="space-y-4">
        <!-- Add user form -->
        <div v-if="isAdding" class="card p-6 space-y-4">
          <h3 class="text-lg font-semibold text-content">新增使用者</h3>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-content-secondary mb-1">使用者名稱 *</label>
              <input
                v-model="newUsername"
                type="text"
                class="input"
                placeholder="輸入使用者名稱"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-content-secondary mb-1">密碼 *</label>
              <input
                v-model="newPassword"
                type="password"
                class="input"
                placeholder="輸入密碼"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-content-secondary mb-1">顯示名稱</label>
              <input
                v-model="newName"
                type="text"
                class="input"
                placeholder="選填"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-content-secondary mb-1">電子郵件</label>
              <input
                v-model="newEmail"
                type="email"
                class="input"
                placeholder="選填"
              />
            </div>
            <div class="col-span-2">
              <label class="block text-sm font-medium text-content-secondary mb-1">角色</label>
              <select
                v-model="newRole"
                class="select"
              >
                <option v-for="role in roles" :key="role.value" :value="role.value">
                  {{ role.label }}
                </option>
              </select>
            </div>
          </div>

          <div class="flex gap-2 justify-end">
            <button
              @click="cancelAdding"
              :disabled="isSubmitting"
              class="btn-secondary"
            >
              取消
            </button>
            <button
              @click="handleAddUser"
              :disabled="!newUsername.trim() || !newPassword || isSubmitting"
              class="btn-primary"
            >
              新增
            </button>
          </div>
        </div>

        <!-- Users list -->
        <div class="card">
          <div class="divide-y divide-edge">
            <div
              v-for="user in usersStore.users"
              :key="user.id"
              class="p-4"
            >
              <!-- View mode -->
              <div v-if="editingUserId !== user.id" class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <!-- Avatar -->
                  <div class="avatar-md">
                    <span>
                      {{ (user.name || user.username).charAt(0).toUpperCase() }}
                    </span>
                  </div>

                  <!-- User info -->
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-medium text-content">{{ user.name || user.username }}</span>
                      <span
                        v-if="!user.is_active"
                        class="badge-error"
                      >
                        已停用
                      </span>
                      <span
                        v-if="user.role === 'app-admin'"
                        class="text-xs px-2 py-0.5 bg-accent-light text-accent rounded"
                      >
                        管理員
                      </span>
                    </div>
                    <div class="text-sm text-content-tertiary">
                      @{{ user.username }}
                      <span v-if="user.email">· {{ user.email }}</span>
                    </div>
                    <div class="text-xs text-content-tertiary">
                      {{ getRoleLabel(user.role) }}
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <!-- Toggle active -->
                  <button
                    @click="handleToggleActive(user)"
                    :disabled="user.id === authStore.user?.id"
                    class="p-2 text-content-tertiary hover:text-content-secondary disabled:opacity-30"
                    :title="user.is_active ? '停用' : '啟用'"
                  >
                    <svg v-if="user.is_active" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <!-- Edit -->
                  <button
                    @click="startEditing(user)"
                    class="p-2 text-content-tertiary hover:text-content-secondary"
                    title="編輯"
                  >
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <!-- Delete -->
                  <button
                    @click="handleRemoveUser(user)"
                    :disabled="user.id === authStore.user?.id"
                    class="p-2 text-content-tertiary hover:text-error disabled:opacity-30"
                    title="刪除"
                  >
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Edit mode -->
              <div v-else class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-content-secondary mb-1">顯示名稱</label>
                    <input
                      v-model="editName"
                      type="text"
                      class="input"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-content-secondary mb-1">電子郵件</label>
                    <input
                      v-model="editEmail"
                      type="email"
                      class="input"
                    />
                  </div>
                  <div class="col-span-2">
                    <label class="block text-sm font-medium text-content-secondary mb-1">角色</label>
                    <select
                      v-model="editRole"
                      class="select"
                    >
                      <option v-for="role in roles" :key="role.value" :value="role.value">
                        {{ role.label }}
                      </option>
                    </select>
                  </div>
                </div>
                <div class="flex gap-2 justify-end">
                  <button
                    @click="cancelEditing"
                    :disabled="isSubmitting"
                    class="btn-secondary"
                  >
                    取消
                  </button>
                  <button
                    @click="handleSaveUser"
                    :disabled="isSubmitting"
                    class="btn-primary"
                  >
                    儲存
                  </button>
                </div>
              </div>
            </div>

            <!-- Empty state -->
            <div
              v-if="usersStore.users.length === 0 && !usersStore.isLoading"
              class="p-8 text-center text-content-tertiary"
            >
              沒有使用者
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
