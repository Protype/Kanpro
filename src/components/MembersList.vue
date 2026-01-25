<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMembersStore } from '@/stores/members'
import { useToast } from '@/stores/toast'
import UserAvatar from '@/components/UserAvatar.vue'
import type { ProjectMember, User } from '@/types'

const props = defineProps<{
  projectId: number
}>()

const emit = defineEmits<{
  updated: []
}>()

const { t } = useI18n()
const membersStore = useMembersStore()
const toast = useToast()

const isAdding = ref(false)
const isSubmitting = ref(false)
const selectedUserId = ref<number | null>(null)
const selectedRole = ref<'project-manager' | 'project-member' | 'project-viewer'>('project-member')

// 使用者選擇器狀態（類似擁有者選擇器）
const showUserDropdown = ref(false)
const userSearchQuery = ref('')

const getRoleBadgeClass = (role: string): string => {
  switch (role) {
    case 'project-manager':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    case 'project-member':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case 'project-viewer':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  }
}

const filteredUsers = computed(() => {
  const query = userSearchQuery.value.toLowerCase()
  if (!query) return membersStore.availableUsers
  return membersStore.availableUsers.filter(u =>
    u.username.toLowerCase().includes(query) ||
    (u.name?.toLowerCase().includes(query) ?? false)
  )
})

const selectedUser = computed(() => {
  if (!selectedUserId.value) return null
  return membersStore.availableUsers.find(u => u.id === selectedUserId.value) || null
})

onMounted(async () => {
  await membersStore.fetchProjectMembers(props.projectId)
  await membersStore.fetchAllUsers()
})

watch(() => props.projectId, async (newId) => {
  if (newId) {
    await membersStore.fetchProjectMembers(newId)
  }
})

const startAdding = async () => {
  await membersStore.fetchAllUsers()
  isAdding.value = true
}

const cancelAdding = () => {
  isAdding.value = false
  selectedUserId.value = null
  selectedRole.value = 'project-member'
  userSearchQuery.value = ''
  showUserDropdown.value = false
}

const selectUser = (user: User) => {
  selectedUserId.value = user.id
  userSearchQuery.value = ''
  showUserDropdown.value = false
}

const clearUser = () => {
  selectedUserId.value = null
  showUserDropdown.value = false
}

const handleAddMember = async () => {
  if (!selectedUserId.value || isSubmitting.value) return

  isSubmitting.value = true
  const loadingToast = toast.loading(t('member.addingMember'))
  try {
    await membersStore.addProjectUser(props.projectId, selectedUserId.value, selectedRole.value)
    await membersStore.fetchProjectMembers(props.projectId)
    await membersStore.fetchAllUsers()
    toast.update(loadingToast, 'success', t('member.memberAdded'))
    cancelAdding()
    emit('updated')
  } catch (error) {
    console.error('Failed to add member:', error)
    toast.update(loadingToast, 'error', t('member.addMemberFailed'))
  } finally {
    isSubmitting.value = false
  }
}

const handleRemoveMember = async (member: ProjectMember) => {
  if (!confirm(t('member.confirmRemoveMember', { name: member.name || member.username }))) return

  const loadingToast = toast.loading(t('member.removingMember'))
  try {
    await membersStore.removeProjectUser(props.projectId, member.id)
    await membersStore.fetchProjectMembers(props.projectId)
    await membersStore.fetchAllUsers()
    toast.update(loadingToast, 'success', t('member.memberRemoved'))
    emit('updated')
  } catch (error) {
    console.error('Failed to remove member:', error)
    toast.update(loadingToast, 'error', t('member.removeMemberFailed'))
  }
}

const handleChangeRole = async (member: ProjectMember, newRole: 'project-manager' | 'project-member' | 'project-viewer') => {
  if (member.role === newRole) return

  const loadingToast = toast.loading(t('member.changingRole'))
  try {
    await membersStore.changeProjectUserRole(props.projectId, member.id, newRole)
    await membersStore.fetchProjectMembers(props.projectId)
    toast.update(loadingToast, 'success', t('member.roleChanged'))
    emit('updated')
  } catch (error) {
    console.error('Failed to change role:', error)
    toast.update(loadingToast, 'error', t('member.changeRoleFailed'))
  }
}

// 點擊外部關閉下拉選單
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.user-dropdown-container')) {
    showUserDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="p-5">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4 h-8">
      <div class="flex items-center gap-2">
        <ph-icon icon="users" class="w-5 h-5 text-content-tertiary" />
        <h3 class="text-base font-semibold text-content">
          {{ t('member.projectMembers') }}
        </h3>
        <span v-if="membersStore.membersCount > 0" class="text-xs text-content-tertiary bg-surface-secondary px-1.5 py-0.5 rounded">
          {{ membersStore.membersCount }}
        </span>
      </div>
      <button
        v-if="!isAdding"
        @click="startAdding"
        class="p-2 text-content-tertiary hover:text-content-secondary hover:bg-surface-hover rounded-md transition-colors"
        :title="t('member.addMember')"
      >
        <ph-icon icon="user-plus" weight="fill" class="w-5 h-5" />
      </button>
    </div>

    <div class="space-y-3">
      <!-- Add member form -->
      <div v-if="isAdding" class="bg-surface-secondary rounded-lg p-4 space-y-3 border border-edge">
        <div class="grid grid-cols-2 gap-3">
          <!-- 使用者選擇器（類似擁有者選擇器） -->
          <div class="user-dropdown-container">
            <div class="relative">
              <button
                type="button"
                @click="showUserDropdown = !showUserDropdown"
                :disabled="isSubmitting"
                class="w-full h-10 px-3 bg-surface border border-edge rounded-lg text-left flex items-center gap-2 hover:bg-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <template v-if="selectedUser">
                  <UserAvatar :user="selectedUser" size="sm" class="flex-shrink-0" />
                  <span class="flex-1 truncate text-sm text-content">
                    {{ selectedUser.name || selectedUser.username }}
                  </span>
                  <button
                    type="button"
                    @click.stop="clearUser"
                    class="text-content-tertiary hover:text-content-secondary flex-shrink-0"
                    :disabled="isSubmitting"
                  >
                    <ph-icon icon="xmark" class="w-4 h-4" />
                  </button>
                </template>
                <template v-else>
                  <span class="flex-1 text-sm text-content-tertiary">{{ t('member.selectUser') }}</span>
                </template>
                <ph-icon icon="chevron-down" class="w-4 h-4 text-content-tertiary flex-shrink-0" />
              </button>

              <!-- User Dropdown -->
              <Transition name="dropdown">
                <div
                  v-if="showUserDropdown"
                  class="absolute z-10 w-full mt-1 bg-surface border border-edge rounded-lg shadow-lg max-h-48 overflow-y-auto"
                >
                  <!-- Search -->
                  <div class="p-2 border-b border-edge">
                    <input
                      v-model="userSearchQuery"
                      type="text"
                      :placeholder="t('user.searchUsers')"
                      class="w-full px-2 py-1 text-sm bg-surface-secondary border border-edge rounded text-content placeholder:text-content-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                  <!-- User List -->
                  <div class="py-1">
                    <button
                      v-for="user in filteredUsers"
                      :key="user.id"
                      type="button"
                      @click="selectUser(user)"
                      class="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-surface-hover transition-colors"
                      :class="{ 'bg-accent/10': selectedUserId === user.id }"
                    >
                      <UserAvatar :user="user" size="sm" />
                      <div class="flex-1 min-w-0">
                        <div class="text-sm text-content truncate">{{ user.name || user.username }}</div>
                        <div class="text-xs text-content-tertiary truncate">@{{ user.username }}</div>
                      </div>
                    </button>
                    <div v-if="filteredUsers.length === 0" class="px-3 py-2 text-sm text-content-tertiary">
                      {{ t('user.noUsers') }}
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </div>

          <!-- 角色選擇器 -->
          <div>
            <select
              v-model="selectedRole"
              :disabled="isSubmitting"
              class="w-full h-10 px-3 text-sm bg-surface border border-edge rounded-lg text-content focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="project-manager">{{ t('member.projectManager') }}</option>
              <option value="project-member">{{ t('member.projectMember') }}</option>
              <option value="project-viewer">{{ t('member.projectViewer') }}</option>
            </select>
          </div>
        </div>
        <div class="flex gap-2 justify-end">
          <button
            @click="cancelAdding"
            :disabled="isSubmitting"
            class="px-4 py-2 text-sm text-content-secondary hover:text-content transition-colors disabled:opacity-50"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            @click="handleAddMember"
            :disabled="!selectedUserId || isSubmitting"
            class="px-4 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <ph-icon v-if="isSubmitting" icon="spinner" class="w-4 h-4 animate-spin" />
            {{ t('common.add') }}
          </button>
        </div>
      </div>

      <!-- Members list -->
      <div class="space-y-2">
        <div
          v-for="member in membersStore.members"
          :key="member.id"
          class="group flex items-center justify-between p-3 bg-surface-secondary/50 rounded-lg hover:bg-surface-secondary transition-colors"
        >
          <div class="flex items-center gap-3">
            <!-- Avatar -->
            <UserAvatar :user="member" size="md" />

            <!-- User info -->
            <div class="min-w-0">
              <div class="font-medium text-sm text-content truncate">
                {{ member.name || member.username }}
              </div>
              <div class="text-xs text-content-tertiary truncate">
                {{ member.username }}
                <span v-if="member.email"> · {{ member.email }}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <!-- Role selector -->
            <select
              :value="member.role"
              @change="handleChangeRole(member, ($event.target as HTMLSelectElement).value as 'project-manager' | 'project-member' | 'project-viewer')"
              :class="[
                'px-2 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors',
                getRoleBadgeClass(member.role)
              ]"
            >
              <option value="project-manager">{{ t('member.projectManager') }}</option>
              <option value="project-member">{{ t('member.projectMember') }}</option>
              <option value="project-viewer">{{ t('member.projectViewer') }}</option>
            </select>

            <!-- Remove button -->
            <button
              @click="handleRemoveMember(member)"
              class="p-1.5 text-content-tertiary group-hover:text-content-secondary hover:!text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"
              :title="t('member.removeMember')"
            >
              <ph-icon icon="trash" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Empty state -->
        <div
          v-if="membersStore.members.length === 0"
          class="py-8 text-center text-content-tertiary text-sm"
        >
          <ph-icon icon="users" class="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>{{ t('member.noMembers') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Dropdown Transition */
.dropdown-enter-active {
  transition: all 0.15s ease-out;
}

.dropdown-leave-active {
  transition: all 0.1s ease-in;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-0.25rem);
}
</style>
