<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
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
const { t } = useI18n()
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

const roles = computed(() => [
  { value: 'app-admin', label: t('user.roleAdmin') },
  { value: 'app-manager', label: t('user.roleManager') },
  { value: 'app-user', label: t('user.roleUser') }
])

const getRoleLabel = (role: string) => {
  return roles.value.find(r => r.value === role)?.label || role
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
    successMessage.value = t('user.addSuccess')
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('user.addFailed')
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
    successMessage.value = t('user.updateSuccess')
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('user.updateFailed')
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
    successMessage.value = user.is_active ? t('user.disableSuccess') : t('user.enableSuccess')
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('user.toggleFailed')
  }
}

const handleRemoveUser = async (user: User) => {
  if (!confirm(t('user.confirmRemove', { username: user.username }))) return

  try {
    await usersStore.removeUser(user.id)
    await usersStore.fetchAllUsers()
    successMessage.value = t('user.removeSuccess')
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('user.removeFailed')
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
        <h1 class="text-2xl font-bold text-content">{{ t('user.management') }}</h1>
        <p class="text-content-secondary mt-1">{{ t('user.manageSystemUsers') }}</p>
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
          {{ t('user.allUsers') }}
          <span v-if="usersStore.usersCount > 0" class="text-content-tertiary text-sm font-normal">
            ({{ usersStore.usersCount }})
          </span>
        </h2>
        <button
          v-if="!isAdding"
          @click="startAdding"
          class="btn-primary"
        >
          + {{ t('user.addUser') }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="usersStore.isLoading" class="flex items-center justify-center py-12">
        <ph-icon icon="spinner" class="animate-spin h-8 w-8 text-accent" />
      </div>

      <div v-else class="space-y-4">
        <!-- Add user form -->
        <div v-if="isAdding" class="card p-6 space-y-4">
          <h3 class="text-lg font-semibold text-content">{{ t('user.addUser') }}</h3>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-content-secondary mb-1">{{ t('user.username') }} *</label>
              <input
                v-model="newUsername"
                type="text"
                class="input"
                :placeholder="t('user.enterUsername')"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-content-secondary mb-1">{{ t('user.password') }} *</label>
              <input
                v-model="newPassword"
                type="password"
                class="input"
                :placeholder="t('user.enterPassword')"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-content-secondary mb-1">{{ t('user.displayName') }}</label>
              <input
                v-model="newName"
                type="text"
                class="input"
                :placeholder="t('common.optional')"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-content-secondary mb-1">{{ t('user.email') }}</label>
              <input
                v-model="newEmail"
                type="email"
                class="input"
                :placeholder="t('common.optional')"
              />
            </div>
            <div class="col-span-2">
              <label class="block text-sm font-medium text-content-secondary mb-1">{{ t('user.role') }}</label>
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
              {{ t('common.cancel') }}
            </button>
            <button
              @click="handleAddUser"
              :disabled="!newUsername.trim() || !newPassword || isSubmitting"
              class="btn-primary"
            >
              {{ t('common.add') }}
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
                        {{ t('common.disabled') }}
                      </span>
                      <span
                        v-if="user.role === 'app-admin'"
                        class="text-xs px-2 py-0.5 bg-accent-light text-accent rounded"
                      >
                        {{ t('user.admin') }}
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
                    :title="user.is_active ? t('common.disable') : t('common.enable')"
                  >
                    <ph-icon v-if="user.is_active" icon="ban" class="w-5 h-5" />
                    <ph-icon v-else icon="circle-check" class="w-5 h-5" />
                  </button>
                  <!-- Edit -->
                  <button
                    @click="startEditing(user)"
                    class="p-2 text-content-tertiary hover:text-content-secondary"
                    :title="t('common.edit')"
                  >
                    <ph-icon icon="pen-to-square" class="w-5 h-5" />
                  </button>
                  <!-- Delete -->
                  <button
                    @click="handleRemoveUser(user)"
                    :disabled="user.id === authStore.user?.id"
                    class="p-2 text-content-tertiary hover:text-error disabled:opacity-30"
                    :title="t('common.delete')"
                  >
                    <ph-icon icon="trash" class="w-5 h-5" />
                  </button>
                </div>
              </div>

              <!-- Edit mode -->
              <div v-else class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-content-secondary mb-1">{{ t('user.displayName') }}</label>
                    <input
                      v-model="editName"
                      type="text"
                      class="input"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-content-secondary mb-1">{{ t('user.email') }}</label>
                    <input
                      v-model="editEmail"
                      type="email"
                      class="input"
                    />
                  </div>
                  <div class="col-span-2">
                    <label class="block text-sm font-medium text-content-secondary mb-1">{{ t('user.role') }}</label>
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
                    {{ t('common.cancel') }}
                  </button>
                  <button
                    @click="handleSaveUser"
                    :disabled="isSubmitting"
                    class="btn-primary"
                  >
                    {{ t('common.save') }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Empty state -->
            <div
              v-if="usersStore.users.length === 0 && !usersStore.isLoading"
              class="p-8 text-center text-content-tertiary"
            >
              {{ t('user.noMatchingUsers') }}
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
