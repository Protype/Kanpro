<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useUsersStore } from '@/stores/users'
import { useToast } from '@/stores/toast'
import UserAvatar from '@/components/UserAvatar.vue'
import type { User } from '@/types'

const { t } = useI18n()
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


const roles = computed(() => [
  { value: 'app-admin', label: t('user.roleAdmin') },
  { value: 'app-manager', label: t('user.roleManager') },
  { value: 'app-user', label: t('user.roleUser') }
])

const getRoleLabel = (role: string) => {
  return roles.value.find(r => r.value === role)?.label || role
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
    toast.success(t('user.addSuccess'))
  } catch (err) {
    toast.error(t('user.addFailed'), err instanceof Error ? err.message : t('user.addFailed'))
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
    toast.success(t('user.updateSuccess'))
  } catch (err) {
    toast.error(t('user.updateFailed'), err instanceof Error ? err.message : t('user.updateFailed'))
  } finally {
    isSubmitting.value = false
  }
}

const handleToggleActive = async (user: User) => {
  try {
    if (user.is_active) {
      await usersStore.disableUser(user.id)
      toast.success(t('user.disableSuccess'))
    } else {
      await usersStore.enableUser(user.id)
      toast.success(t('user.enableSuccess'))
    }
    await usersStore.fetchAllUsers()
  } catch (err) {
    toast.error(t('user.toggleFailed'), err instanceof Error ? err.message : t('user.toggleFailed'))
  }
}

const handleRemoveUser = async (user: User) => {
  if (!confirm(t('user.confirmRemove', { username: user.username }))) return

  try {
    await usersStore.removeUser(user.id)
    await usersStore.fetchAllUsers()
    toast.success(t('user.removeSuccess'))
  } catch (err) {
    toast.error(t('user.removeFailed'), err instanceof Error ? err.message : t('user.removeFailed'))
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
          {{ t('user.totalCount', { count: filteredUsers.length }) }}
        </span>
        <div class="flex-1" />
        <select v-model="filterRole" class="select w-40">
          <option value="">{{ t('user.allRoles') }}</option>
          <option v-for="role in roles" :key="role.value" :value="role.value">
            {{ role.label }}
          </option>
        </select>
        <select v-model="filterStatus" class="select w-32">
          <option value="">{{ t('user.allStatus') }}</option>
          <option value="active">{{ t('common.enabled') }}</option>
          <option value="inactive">{{ t('common.disabled') }}</option>
        </select>
        <input
          v-model="filterQuery"
          type="text"
          :placeholder="t('user.searchPlaceholder')"
          class="input w-64"
        />
        <button
          v-if="!isAdding"
          @click="startAdding"
          class="btn-primary"
        >
          <ph-icon icon="plus" class="w-4 h-4 mr-1.5" />
          {{ t('user.addUser') }}
        </button>
      </div>

      <!-- Add User Form -->
      <div v-if="isAdding" class="card mb-4 p-4">
        <h2 class="text-base font-semibold text-content mb-4">{{ t('user.addUser') }}</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-content-secondary mb-1">{{ t('user.username') }} *</label>
            <input v-model="newUsername" type="text" class="input" :placeholder="t('user.enterUsername')" />
          </div>
          <div>
            <label class="block text-sm font-medium text-content-secondary mb-1">{{ t('user.password') }} *</label>
            <input v-model="newPassword" type="password" class="input" :placeholder="t('user.enterPassword')" />
          </div>
          <div>
            <label class="block text-sm font-medium text-content-secondary mb-1">{{ t('user.displayName') }}</label>
            <input v-model="newName" type="text" class="input" :placeholder="t('common.optional')" />
          </div>
          <div>
            <label class="block text-sm font-medium text-content-secondary mb-1">{{ t('user.email') }}</label>
            <input v-model="newEmail" type="email" class="input" :placeholder="t('common.optional')" />
          </div>
          <div>
            <label class="block text-sm font-medium text-content-secondary mb-1">{{ t('user.role') }}</label>
            <select v-model="newRole" class="select">
              <option v-for="role in roles" :key="role.value" :value="role.value">
                {{ role.label }}
              </option>
            </select>
          </div>
        </div>
        <div class="flex gap-2 justify-end mt-4">
          <button @click="cancelAdding" :disabled="isSubmitting" class="btn-secondary">
            {{ t('common.cancel') }}
          </button>
          <button
            @click="handleAddUser"
            :disabled="!newUsername.trim() || !newPassword || isSubmitting"
            class="btn-primary"
          >
            <ph-icon v-if="isSubmitting" icon="spinner" class="w-4 h-4 mr-1.5 animate-spin" />
            {{ t('common.add') }}
          </button>
        </div>
      </div>

      <!-- Users Table -->
      <div class="card overflow-hidden">
        <table class="table">
          <thead class="table-header">
            <tr>
              <th class="table-header-cell">{{ t('user.user') }}</th>
              <th class="table-header-cell">{{ t('user.email') }}</th>
              <th class="table-header-cell">{{ t('user.role') }}</th>
              <th class="table-header-cell text-center">{{ t('common.status') }}</th>
              <th class="table-header-cell w-32 text-right">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-edge">
            <!-- Edit Row -->
            <tr v-if="editingUserId" class="bg-accent/5">
              <td class="table-cell" colspan="5">
                <div class="py-2">
                  <h3 class="text-sm font-medium text-content mb-3">{{ t('user.editUser') }}</h3>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-content-secondary mb-1">{{ t('user.displayName') }}</label>
                      <input v-model="editName" type="text" class="input" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-content-secondary mb-1">{{ t('user.email') }}</label>
                      <input v-model="editEmail" type="email" class="input" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-content-secondary mb-1">{{ t('user.role') }}</label>
                      <select v-model="editRole" class="select">
                        <option v-for="role in roles" :key="role.value" :value="role.value">
                          {{ role.label }}
                        </option>
                      </select>
                    </div>
                  </div>
                  <div class="flex gap-2 justify-end mt-3">
                    <button @click="cancelEditing" :disabled="isSubmitting" class="btn-secondary btn-sm">
                      {{ t('common.cancel') }}
                    </button>
                    <button @click="handleSaveUser" :disabled="isSubmitting" class="btn-primary btn-sm">
                      <ph-icon v-if="isSubmitting" icon="spinner" class="w-4 h-4 mr-1 animate-spin" />
                      {{ t('common.save') }}
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
                  {{ user.is_active ? t('common.enabled') : t('common.disabled') }}
                </span>
              </td>
              <td class="table-cell text-right">
                <div class="flex items-center justify-end gap-1">
                  <button
                    @click="handleToggleActive(user)"
                    :disabled="user.id === authStore.user?.id"
                    class="p-1.5 text-content-tertiary hover:text-content-secondary hover:bg-surface-hover rounded disabled:opacity-30"
                    :title="user.is_active ? t('common.disable') : t('common.enable')"
                  >
                    <ph-icon :icon="user.is_active ? 'ban' : 'check-circle'" class="w-4 h-4" />
                  </button>
                  <button
                    @click="startEditing(user)"
                    class="p-1.5 text-content-tertiary hover:text-content-secondary hover:bg-surface-hover rounded"
                    :title="t('common.edit')"
                  >
                    <ph-icon icon="pencil" class="w-4 h-4" />
                  </button>
                  <button
                    @click="handleRemoveUser(user)"
                    :disabled="user.id === authStore.user?.id"
                    class="p-1.5 text-content-tertiary hover:text-error hover:bg-surface-hover rounded disabled:opacity-30"
                    :title="t('common.delete')"
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
                <p>{{ t('user.noMatchingUsers') }}</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  </div>
</template>
