<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useGroupsStore } from '@/stores/groups'
import { useUsersStore } from '@/stores/users'
import UserAvatar from '@/components/UserAvatar.vue'
import SearchModal from '@/components/SearchModal.vue'
import type { Group, User, Task } from '@/types'

defineProps<{
  showSearchModal?: boolean
}>()

const emit = defineEmits<{
  'close-search-modal': []
}>()

const { t } = useI18n()
const router = useRouter()
const groupsStore = useGroupsStore()
const usersStore = useUsersStore()

// Form state
const isAdding = ref(false)
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

// New group form
const newGroupName = ref('')
const newExternalId = ref('')

// Edit state
const editingGroupId = ref<number | null>(null)
const editName = ref('')
const editExternalId = ref('')

// Members modal state
const showMembersModal = ref(false)
const selectedGroup = ref<Group | null>(null)
const groupMembers = ref<User[]>([])
const isLoadingMembers = ref(false)
const showAddMemberForm = ref(false)
const selectedUserId = ref<number | null>(null)

onMounted(async () => {
  await Promise.all([
    groupsStore.fetchAllGroups(),
    usersStore.fetchAllUsers()
  ])
})

const startAdding = () => {
  isAdding.value = true
  newGroupName.value = ''
  newExternalId.value = ''
  error.value = null
}

const cancelAdding = () => {
  isAdding.value = false
}

const handleAddGroup = async () => {
  if (!newGroupName.value.trim() || isSubmitting.value) return

  isSubmitting.value = true
  error.value = null

  try {
    await groupsStore.createGroup(
      newGroupName.value.trim(),
      newExternalId.value.trim() || undefined
    )
    await groupsStore.fetchAllGroups()
    cancelAdding()
    successMessage.value = t('group.addSuccess')
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('group.addFailed')
  } finally {
    isSubmitting.value = false
  }
}

const startEditing = (group: Group) => {
  editingGroupId.value = group.id
  editName.value = group.name
  editExternalId.value = group.external_id || ''
  error.value = null
}

const cancelEditing = () => {
  editingGroupId.value = null
}

const handleSaveGroup = async () => {
  if (!editingGroupId.value || !editName.value.trim() || isSubmitting.value) return

  isSubmitting.value = true
  error.value = null

  try {
    await groupsStore.updateGroup(
      editingGroupId.value,
      editName.value.trim(),
      editExternalId.value.trim() || undefined
    )
    await groupsStore.fetchAllGroups()
    cancelEditing()
    successMessage.value = t('group.updateSuccess')
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('group.updateFailed')
  } finally {
    isSubmitting.value = false
  }
}

const handleRemoveGroup = async (group: Group) => {
  if (!confirm(t('group.confirmRemove', { name: group.name }))) return

  try {
    await groupsStore.removeGroup(group.id)
    await groupsStore.fetchAllGroups()
    successMessage.value = t('group.removeSuccess')
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('group.removeFailed')
  }
}

const openMembersModal = async (group: Group) => {
  selectedGroup.value = group
  showMembersModal.value = true
  isLoadingMembers.value = true
  showAddMemberForm.value = false
  selectedUserId.value = null

  try {
    groupMembers.value = await groupsStore.getGroupMembers(group.id)
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('group.loadMembersFailed')
  } finally {
    isLoadingMembers.value = false
  }
}

const closeMembersModal = () => {
  showMembersModal.value = false
  selectedGroup.value = null
  groupMembers.value = []
}

const handleAddMember = async () => {
  if (!selectedGroup.value || !selectedUserId.value) return

  try {
    await groupsStore.addGroupMember(selectedGroup.value.id, selectedUserId.value)
    groupMembers.value = await groupsStore.getGroupMembers(selectedGroup.value.id)
    showAddMemberForm.value = false
    selectedUserId.value = null
    successMessage.value = t('group.addMemberSuccess')
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('group.addMemberFailed')
  }
}

const handleRemoveMember = async (userId: number) => {
  if (!selectedGroup.value) return
  if (!confirm(t('group.confirmRemoveMember'))) return

  try {
    await groupsStore.removeGroupMember(selectedGroup.value.id, userId)
    groupMembers.value = await groupsStore.getGroupMembers(selectedGroup.value.id)
    successMessage.value = t('group.removeMemberSuccess')
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('group.removeMemberFailed')
  }
}

const availableUsers = computed(() => {
  const memberIds = new Set(groupMembers.value.map(m => m.id))
  return usersStore.users.filter(u => !memberIds.has(u.id) && u.is_active)
})

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
        <h1 class="text-2xl font-bold text-content">{{ t('group.memberManagement') }}</h1>
        <p class="text-content-secondary mt-1">{{ t('group.manageGroups') }}</p>
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
          {{ t('group.groups') }}
          <span v-if="groupsStore.groupsCount > 0" class="text-content-tertiary text-sm font-normal">
            ({{ groupsStore.groupsCount }})
          </span>
        </h2>
        <button
          v-if="!isAdding"
          @click="startAdding"
          class="btn-primary"
        >
          + {{ t('group.addGroup') }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="groupsStore.isLoading" class="flex items-center justify-center py-12">
        <ph-icon icon="spinner" class="animate-spin h-8 w-8 text-accent" />
      </div>

      <div v-else class="space-y-4">
        <!-- Add group form -->
        <div v-if="isAdding" class="card p-6 space-y-4">
          <h3 class="text-lg font-semibold text-content">{{ t('group.addGroup') }}</h3>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-content-secondary mb-1">{{ t('group.name') }} *</label>
              <input
                v-model="newGroupName"
                type="text"
                class="input"
                :placeholder="t('group.enterName')"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-content-secondary mb-1">{{ t('group.externalId') }}</label>
              <input
                v-model="newExternalId"
                type="text"
                class="input"
                :placeholder="t('group.externalIdPlaceholder')"
              />
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
              @click="handleAddGroup"
              :disabled="!newGroupName.trim() || isSubmitting"
              class="btn-primary"
            >
              {{ t('common.add') }}
            </button>
          </div>
        </div>

        <!-- Groups list -->
        <div class="card">
          <div class="divide-y divide-edge">
            <div
              v-for="group in groupsStore.groups"
              :key="group.id"
              class="p-4"
            >
              <!-- View mode -->
              <div v-if="editingGroupId !== group.id" class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <!-- Group icon -->
                  <div class="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <ph-icon icon="user-group" class="w-5 h-5 text-accent" />
                  </div>

                  <!-- Group info -->
                  <div>
                    <div class="font-medium text-content">{{ group.name }}</div>
                    <div v-if="group.external_id" class="text-sm text-content-tertiary">
                      {{ t('group.externalId') }}: {{ group.external_id }}
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <!-- Members -->
                  <button
                    @click="openMembersModal(group)"
                    class="p-2 text-content-tertiary hover:text-content-secondary"
                    :title="t('group.manageMembers')"
                  >
                    <ph-icon icon="users" class="w-5 h-5" />
                  </button>
                  <!-- Edit -->
                  <button
                    @click="startEditing(group)"
                    class="p-2 text-content-tertiary hover:text-content-secondary"
                    :title="t('common.edit')"
                  >
                    <ph-icon icon="pen-to-square" class="w-5 h-5" />
                  </button>
                  <!-- Delete -->
                  <button
                    @click="handleRemoveGroup(group)"
                    class="p-2 text-content-tertiary hover:text-error"
                    :title="t('common.delete')"
                  >
                    <ph-icon icon="trash" class="w-5 h-5" />
                  </button>
                </div>
              </div>

              <!-- Edit mode -->
              <div v-else class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-content-secondary mb-1">{{ t('group.name') }} *</label>
                  <input
                    v-model="editName"
                    type="text"
                    class="input"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-content-secondary mb-1">{{ t('group.externalId') }}</label>
                  <input
                    v-model="editExternalId"
                    type="text"
                    class="input"
                  />
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
                    @click="handleSaveGroup"
                    :disabled="!editName.trim() || isSubmitting"
                    class="btn-primary"
                  >
                    {{ t('common.save') }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Empty state -->
            <div
              v-if="groupsStore.groups.length === 0 && !groupsStore.isLoading"
              class="p-8 text-center text-content-tertiary"
            >
              {{ t('group.noMatchingGroups') }}
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Members Modal -->
    <Teleport to="body">
      <div
        v-if="showMembersModal"
        class="fixed inset-0 z-50 overflow-y-auto"
      >
        <div
          class="fixed inset-0 bg-black bg-opacity-50"
          @click="closeMembersModal"
        ></div>
        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative bg-surface rounded-lg shadow-xl w-full max-w-lg">
            <div class="p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-content">
                  {{ selectedGroup?.name }} - {{ t('group.memberManagement') }}
                </h3>
                <button
                  @click="closeMembersModal"
                  class="text-content-tertiary hover:text-content-secondary"
                >
                  <ph-icon icon="xmark" class="w-5 h-5" />
                </button>
              </div>

              <!-- Loading -->
              <div v-if="isLoadingMembers" class="text-center py-8">
                <ph-icon icon="spinner" class="animate-spin h-6 w-6 text-accent mx-auto" />
              </div>

              <div v-else>
                <!-- Add member form -->
                <div v-if="showAddMemberForm" class="mb-4 p-4 bg-surface-tertiary rounded-lg">
                  <label class="block text-sm font-medium text-content-secondary mb-2">{{ t('group.selectUser') }}</label>
                  <select
                    v-model="selectedUserId"
                    class="select"
                  >
                    <option :value="null">{{ t('common.pleaseSelect') }}</option>
                    <option v-for="user in availableUsers" :key="user.id" :value="user.id">
                      {{ user.name || user.username }} (@{{ user.username }})
                    </option>
                  </select>
                  <div class="flex gap-2 justify-end mt-3">
                    <button
                      @click="showAddMemberForm = false"
                      class="px-3 py-1.5 text-sm text-content-secondary hover:text-content"
                    >
                      {{ t('common.cancel') }}
                    </button>
                    <button
                      @click="handleAddMember"
                      :disabled="!selectedUserId"
                      class="btn-primary btn-sm"
                    >
                      {{ t('group.addToGroup') }}
                    </button>
                  </div>
                </div>

                <div v-else class="mb-4">
                  <button
                    @click="showAddMemberForm = true"
                    class="btn-secondary w-full"
                  >
                    + {{ t('group.addMember') }}
                  </button>
                </div>

                <!-- Members list -->
                <div class="space-y-2 max-h-64 overflow-y-auto">
                  <div
                    v-for="member in groupMembers"
                    :key="member.id"
                    class="flex items-center justify-between p-3 bg-surface-tertiary rounded-lg"
                  >
                    <div class="flex items-center gap-3">
                      <UserAvatar :user="member" size="sm" />
                      <div>
                        <div class="font-medium text-content text-sm">
                          {{ member.name || member.username }}
                        </div>
                        <div class="text-xs text-content-tertiary">@{{ member.username }}</div>
                      </div>
                    </div>
                    <button
                      @click="handleRemoveMember(member.id)"
                      class="p-1 text-content-tertiary hover:text-error"
                      :title="t('common.remove')"
                    >
                      <ph-icon icon="xmark" class="w-4 h-4" />
                    </button>
                  </div>

                  <div
                    v-if="groupMembers.length === 0"
                    class="text-center py-4 text-content-tertiary text-sm"
                  >
                    {{ t('group.noMembers') }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Search Modal -->
    <SearchModal
      v-if="showSearchModal"
      @close="emit('close-search-modal')"
      @select="handleSearchSelect"
    />
  </div>
</template>
