<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUsersStore } from '@/stores/users'
import { useToast } from '@/stores/toast'
import UserAvatar from '@/components/UserAvatar.vue'
import type { User } from '@/types'

const authStore = useAuthStore()
const usersStore = useUsersStore()
const toast = useToast()

// Filter state
const filterQuery = ref('')
const filterRole = ref<string>('')
const filterStatus = ref<string>('')

// Form state
const isAdding = ref(false)
const isSubmitting = ref(false)
const editingUserId = ref<number | null>(null)

// New user form
const newUsername = ref('')
const newPassword = ref('')
const newName = ref('')
const newEmail = ref('')
const newRole = ref('app-user')

// Edit form
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

const getRoleBadgeClass = (role: string) => {
  switch (role) {
    case 'app-admin':
      return 'badge-error'
    case 'app-manager':
      return 'badge-info'
    default:
      return 'badge-neutral'
  }
}

// Filtered users
const filteredUsers = computed(() => {
  let users = [...usersStore.users]

  // Filter by query
  if (filterQuery.value.trim()) {
    const query = filterQuery.value.toLowerCase()
    users = users.filter(u =>
      u.username.toLowerCase().includes(query) ||
      u.name?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query)
    )
  }

  // Filter by role
  if (filterRole.value) {
    users = users.filter(u => u.role === filterRole.value)
  }

  // Filter by status
  if (filterStatus.value) {
    const isActive = filterStatus.value === 'active'
    users = users.filter(u => u.is_active === isActive)
  }

  return users
})

onMounted(async () => {
  await usersStore.fetchAllUsers()
})

const startAdding = () => {
  isAdding.value = true
  editingUserId.value = null
  newUsername.value = ''
  newPassword.value = ''
  newName.value = ''
  newEmail.value = ''
  newRole.value = 'app-user'
}

const cancelAdding = () => {
  isAdding.value = false
}

const handleAddUser = async () => {
  if (!newUsername.value.trim() || !newPassword.value || isSubmitting.value) return

  isSubmitting.value = true

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
    toast.success('使用者新增成功')
  } catch (err) {
    toast.error('新增失敗', err instanceof Error ? err.message : '新增使用者失敗')
  } finally {
    isSubmitting.value = false
  }
}

const startEditing = (user: User) => {
  isAdding.value = false
  editingUserId.value = user.id
  editName.value = user.name || ''
  editEmail.value = user.email || ''
  editRole.value = user.role
}

const cancelEditing = () => {
  editingUserId.value = null
}

const handleSaveUser = async () => {
  if (!editingUserId.value || isSubmitting.value) return

  isSubmitting.value = true

  try {
    await usersStore.updateUser(editingUserId.value, {
      name: editName.value.trim() || undefined,
      email: editEmail.value.trim() || undefined,
      role: editRole.value
    })
    await usersStore.fetchAllUsers()
    cancelEditing()
    toast.success('使用者更新成功')
  } catch (err) {
    toast.error('更新失敗', err instanceof Error ? err.message : '更新使用者失敗')
  } finally {
    isSubmitting.value = false
  }
}

const handleToggleActive = async (user: User) => {
  try {
    if (user.is_active) {
      await usersStore.disableUser(user.id)
      toast.success('使用者已停用')
    } else {
      await usersStore.enableUser(user.id)
      toast.success('使用者已啟用')
    }
    await usersStore.fetchAllUsers()
  } catch (err) {
    toast.error('操作失敗', err instanceof Error ? err.message : '切換狀態失敗')
  }
}

const handleRemoveUser = async (user: User) => {
  if (!confirm(`確定要刪除使用者「${user.username}」嗎？此操作無法復原。`)) return

  try {
    await usersStore.removeUser(user.id)
    await usersStore.fetchAllUsers()
    toast.success('使用者已刪除')
  } catch (err) {
    toast.error('刪除失敗', err instanceof Error ? err.message : '刪除使用者失敗')
  }
}
</script>

<template>
  <div class="h-full flex flex-col bg-surface-secondary">
    <!-- Loading -->
    <div v-if="usersStore.isLoading && usersStore.users.length === 0" class="flex-1 flex items-center justify-center">
      <ph-icon icon="spinner" class="animate-spin h-8 w-8 text-accent" />
    </div>

    <!-- Content -->
    <main v-else class="flex-1 p-4 overflow-auto">
      <!-- Toolbar -->
      <div class="mb-4 flex items-center gap-4 flex-wrap">
        <span class="text-sm text-content-tertiary whitespace-nowrap">
          共 {{ filteredUsers.length }} 位使用者
        </span>
        <div class="flex-1" />
        <select v-model="filterRole" class="select w-40">
          <option value="">所有角色</option>
          <option v-for="role in roles" :key="role.value" :value="role.value">
            {{ role.label }}
          </option>
        </select>
        <select v-model="filterStatus" class="select w-32">
          <option value="">所有狀態</option>
          <option value="active">啟用</option>
          <option value="inactive">停用</option>
        </select>
        <input
          v-model="filterQuery"
          type="text"
          placeholder="搜尋使用者..."
          class="input w-64"
        />
        <button
          v-if="!isAdding"
          @click="startAdding"
          class="btn-primary"
        >
          <ph-icon icon="plus" class="w-4 h-4 mr-1.5" />
          新增使用者
        </button>
      </div>

      <!-- Add User Form -->
      <div v-if="isAdding" class="card mb-4 p-4">
        <h2 class="text-base font-semibold text-content mb-4">新增使用者</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-content-secondary mb-1">使用者名稱 *</label>
            <input v-model="newUsername" type="text" class="input" placeholder="輸入使用者名稱" />
          </div>
          <div>
            <label class="block text-sm font-medium text-content-secondary mb-1">密碼 *</label>
            <input v-model="newPassword" type="password" class="input" placeholder="輸入密碼" />
          </div>
          <div>
            <label class="block text-sm font-medium text-content-secondary mb-1">顯示名稱</label>
            <input v-model="newName" type="text" class="input" placeholder="選填" />
          </div>
          <div>
            <label class="block text-sm font-medium text-content-secondary mb-1">電子郵件</label>
            <input v-model="newEmail" type="email" class="input" placeholder="選填" />
          </div>
          <div>
            <label class="block text-sm font-medium text-content-secondary mb-1">角色</label>
            <select v-model="newRole" class="select">
              <option v-for="role in roles" :key="role.value" :value="role.value">
                {{ role.label }}
              </option>
            </select>
          </div>
        </div>
        <div class="flex gap-2 justify-end mt-4">
          <button @click="cancelAdding" :disabled="isSubmitting" class="btn-secondary">
            取消
          </button>
          <button
            @click="handleAddUser"
            :disabled="!newUsername.trim() || !newPassword || isSubmitting"
            class="btn-primary"
          >
            <ph-icon v-if="isSubmitting" icon="spinner" class="w-4 h-4 mr-1.5 animate-spin" />
            新增
          </button>
        </div>
      </div>

      <!-- Users Table -->
      <div class="card overflow-hidden">
        <table class="table">
          <thead class="table-header">
            <tr>
              <th class="table-header-cell">使用者</th>
              <th class="table-header-cell">電子郵件</th>
              <th class="table-header-cell">角色</th>
              <th class="table-header-cell text-center">狀態</th>
              <th class="table-header-cell w-32 text-right">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-edge">
            <!-- Edit Row -->
            <tr v-if="editingUserId" class="bg-accent/5">
              <td class="table-cell" colspan="5">
                <div class="py-2">
                  <h3 class="text-sm font-medium text-content mb-3">編輯使用者</h3>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-content-secondary mb-1">顯示名稱</label>
                      <input v-model="editName" type="text" class="input" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-content-secondary mb-1">電子郵件</label>
                      <input v-model="editEmail" type="email" class="input" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-content-secondary mb-1">角色</label>
                      <select v-model="editRole" class="select">
                        <option v-for="role in roles" :key="role.value" :value="role.value">
                          {{ role.label }}
                        </option>
                      </select>
                    </div>
                  </div>
                  <div class="flex gap-2 justify-end mt-3">
                    <button @click="cancelEditing" :disabled="isSubmitting" class="btn-secondary btn-sm">
                      取消
                    </button>
                    <button @click="handleSaveUser" :disabled="isSubmitting" class="btn-primary btn-sm">
                      <ph-icon v-if="isSubmitting" icon="spinner" class="w-4 h-4 mr-1 animate-spin" />
                      儲存
                    </button>
                  </div>
                </div>
              </td>
            </tr>

            <!-- User Rows -->
            <tr
              v-for="user in filteredUsers"
              :key="user.id"
              class="table-row"
              :class="{ 'opacity-50': !user.is_active }"
            >
              <td class="table-cell">
                <div class="flex items-center gap-3">
                  <UserAvatar :user="user" size="sm" />
                  <div>
                    <p class="font-medium text-content">{{ user.name || user.username }}</p>
                    <p class="text-xs text-content-tertiary">@{{ user.username }}</p>
                  </div>
                </div>
              </td>
              <td class="table-cell text-content-secondary">
                {{ user.email || '-' }}
              </td>
              <td class="table-cell">
                <span :class="getRoleBadgeClass(user.role)">
                  {{ getRoleLabel(user.role) }}
                </span>
              </td>
              <td class="table-cell text-center">
                <span :class="user.is_active ? 'badge-success' : 'badge-error'">
                  {{ user.is_active ? '啟用' : '停用' }}
                </span>
              </td>
              <td class="table-cell text-right">
                <div class="flex items-center justify-end gap-1">
                  <button
                    @click="handleToggleActive(user)"
                    :disabled="user.id === authStore.user?.id"
                    class="p-1.5 text-content-tertiary hover:text-content-secondary hover:bg-surface-hover rounded disabled:opacity-30"
                    :title="user.is_active ? '停用' : '啟用'"
                  >
                    <ph-icon :icon="user.is_active ? 'ban' : 'check-circle'" class="w-4 h-4" />
                  </button>
                  <button
                    @click="startEditing(user)"
                    class="p-1.5 text-content-tertiary hover:text-content-secondary hover:bg-surface-hover rounded"
                    title="編輯"
                  >
                    <ph-icon icon="pencil" class="w-4 h-4" />
                  </button>
                  <button
                    @click="handleRemoveUser(user)"
                    :disabled="user.id === authStore.user?.id"
                    class="p-1.5 text-content-tertiary hover:text-error hover:bg-surface-hover rounded disabled:opacity-30"
                    title="刪除"
                  >
                    <ph-icon icon="trash" class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-if="filteredUsers.length === 0">
              <td colspan="5" class="px-4 py-8 text-center text-content-tertiary">
                <ph-icon icon="users" class="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>沒有符合條件的使用者</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  </div>
</template>
