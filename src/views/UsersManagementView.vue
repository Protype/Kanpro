<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUsersStore } from '@/stores/users'
import NotificationsDropdown from '@/components/NotificationsDropdown.vue'
import type { User } from '@/types'

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
          <h1 class="text-xl font-bold text-gray-900">使用者管理</h1>
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

    <main class="mx-auto max-w-4xl px-4 py-6">
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

      <!-- Header with Add button -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-semibold text-gray-900">
          所有使用者
          <span v-if="usersStore.usersCount > 0" class="text-gray-400 text-sm font-normal">
            ({{ usersStore.usersCount }})
          </span>
        </h2>
        <button
          v-if="!isAdding"
          @click="startAdding"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + 新增使用者
        </button>
      </div>

      <!-- Loading -->
      <div v-if="usersStore.isLoading" class="flex items-center justify-center py-12">
        <svg class="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <div v-else class="space-y-4">
        <!-- Add user form -->
        <div v-if="isAdding" class="bg-white rounded-lg shadow p-6 space-y-4">
          <h3 class="text-lg font-semibold text-gray-900">新增使用者</h3>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">使用者名稱 *</label>
              <input
                v-model="newUsername"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="輸入使用者名稱"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">密碼 *</label>
              <input
                v-model="newPassword"
                type="password"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="輸入密碼"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">顯示名稱</label>
              <input
                v-model="newName"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="選填"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">電子郵件</label>
              <input
                v-model="newEmail"
                type="email"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="選填"
              />
            </div>
            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">角色</label>
              <select
                v-model="newRole"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              取消
            </button>
            <button
              @click="handleAddUser"
              :disabled="!newUsername.trim() || !newPassword || isSubmitting"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              新增
            </button>
          </div>
        </div>

        <!-- Users list -->
        <div class="bg-white rounded-lg shadow">
          <div class="divide-y">
            <div
              v-for="user in usersStore.users"
              :key="user.id"
              class="p-4"
            >
              <!-- View mode -->
              <div v-if="editingUserId !== user.id" class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <!-- Avatar -->
                  <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span class="text-gray-600 font-medium">
                      {{ (user.name || user.username).charAt(0).toUpperCase() }}
                    </span>
                  </div>

                  <!-- User info -->
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-medium text-gray-900">{{ user.name || user.username }}</span>
                      <span
                        v-if="!user.is_active"
                        class="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded"
                      >
                        已停用
                      </span>
                      <span
                        v-if="user.role === 'app-admin'"
                        class="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded"
                      >
                        管理員
                      </span>
                    </div>
                    <div class="text-sm text-gray-500">
                      @{{ user.username }}
                      <span v-if="user.email">· {{ user.email }}</span>
                    </div>
                    <div class="text-xs text-gray-400">
                      {{ getRoleLabel(user.role) }}
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <!-- Toggle active -->
                  <button
                    @click="handleToggleActive(user)"
                    :disabled="user.id === authStore.user?.id"
                    class="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30"
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
                    class="p-2 text-gray-400 hover:text-gray-600"
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
                    class="p-2 text-gray-400 hover:text-red-500 disabled:opacity-30"
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
                    <label class="block text-sm font-medium text-gray-700 mb-1">顯示名稱</label>
                    <input
                      v-model="editName"
                      type="text"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">電子郵件</label>
                    <input
                      v-model="editEmail"
                      type="email"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div class="col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">角色</label>
                    <select
                      v-model="editRole"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    取消
                  </button>
                  <button
                    @click="handleSaveUser"
                    :disabled="isSubmitting"
                    class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    儲存
                  </button>
                </div>
              </div>
            </div>

            <!-- Empty state -->
            <div
              v-if="usersStore.users.length === 0 && !usersStore.isLoading"
              class="p-8 text-center text-gray-500"
            >
              沒有使用者
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
