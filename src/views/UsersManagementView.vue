<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUsersStore } from '@/stores/users'
import UserAvatar from '@/components/UserAvatar.vue'
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
        <ph-icon icon="spinner" class="animate-spin h-8 w-8 text-accent" />
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
                  <UserAvatar :user="user" size="md" />

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
                    <ph-icon v-if="user.is_active" icon="ban" class="w-5 h-5" />
                    <ph-icon v-else icon="circle-check" class="w-5 h-5" />
                  </button>
                  <!-- Edit -->
                  <button
                    @click="startEditing(user)"
                    class="p-2 text-content-tertiary hover:text-content-secondary"
                    title="編輯"
                  >
                    <ph-icon icon="pen-to-square" class="w-5 h-5" />
                  </button>
                  <!-- Delete -->
                  <button
                    @click="handleRemoveUser(user)"
                    :disabled="user.id === authStore.user?.id"
                    class="p-2 text-content-tertiary hover:text-error disabled:opacity-30"
                    title="刪除"
                  >
                    <ph-icon icon="trash" class="w-5 h-5" />
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
