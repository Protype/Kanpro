<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGroupsStore } from '@/stores/groups'
import { useUsersStore } from '@/stores/users'
import { getAvatarColor, getAvatarInitial, getUserDisplayName } from '@/utils/avatar'
import SearchModal from '@/components/SearchModal.vue'
import type { Group, User, Task } from '@/types'

defineProps<{
  showSearchModal?: boolean
}>()

const emit = defineEmits<{
  'close-search-modal': []
}>()

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
    successMessage.value = '群組新增成功'
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '新增群組失敗'
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
    successMessage.value = '群組更新成功'
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '更新群組失敗'
  } finally {
    isSubmitting.value = false
  }
}

const handleRemoveGroup = async (group: Group) => {
  if (!confirm(`確定要刪除群組「${group.name}」嗎？此操作無法復原。`)) return

  try {
    await groupsStore.removeGroup(group.id)
    await groupsStore.fetchAllGroups()
    successMessage.value = '群組已刪除'
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '刪除群組失敗'
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
    error.value = err instanceof Error ? err.message : '載入成員失敗'
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
    successMessage.value = '成員已加入'
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加入成員失敗'
  }
}

const handleRemoveMember = async (userId: number) => {
  if (!selectedGroup.value) return
  if (!confirm('確定要移除此成員嗎？')) return

  try {
    await groupsStore.removeGroupMember(selectedGroup.value.id, userId)
    groupMembers.value = await groupsStore.getGroupMembers(selectedGroup.value.id)
    successMessage.value = '成員已移除'
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '移除成員失敗'
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
        <h1 class="text-2xl font-bold text-content">群組管理</h1>
        <p class="text-content-secondary mt-1">管理使用者群組</p>
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
          所有群組
          <span v-if="groupsStore.groupsCount > 0" class="text-content-tertiary text-sm font-normal">
            ({{ groupsStore.groupsCount }})
          </span>
        </h2>
        <button
          v-if="!isAdding"
          @click="startAdding"
          class="btn-primary"
        >
          + 新增群組
        </button>
      </div>

      <!-- Loading -->
      <div v-if="groupsStore.isLoading" class="flex items-center justify-center py-12">
        <ph-icon icon="spinner" class="animate-spin h-8 w-8 text-accent" />
      </div>

      <div v-else class="space-y-4">
        <!-- Add group form -->
        <div v-if="isAdding" class="card p-6 space-y-4">
          <h3 class="text-lg font-semibold text-content">新增群組</h3>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-content-secondary mb-1">群組名稱 *</label>
              <input
                v-model="newGroupName"
                type="text"
                class="input"
                placeholder="輸入群組名稱"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-content-secondary mb-1">外部 ID（選填）</label>
              <input
                v-model="newExternalId"
                type="text"
                class="input"
                placeholder="如 LDAP 群組 ID"
              />
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
              @click="handleAddGroup"
              :disabled="!newGroupName.trim() || isSubmitting"
              class="btn-primary"
            >
              新增
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
                      外部 ID: {{ group.external_id }}
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <!-- Members -->
                  <button
                    @click="openMembersModal(group)"
                    class="p-2 text-content-tertiary hover:text-content-secondary"
                    title="管理成員"
                  >
                    <ph-icon icon="users" class="w-5 h-5" />
                  </button>
                  <!-- Edit -->
                  <button
                    @click="startEditing(group)"
                    class="p-2 text-content-tertiary hover:text-content-secondary"
                    title="編輯"
                  >
                    <ph-icon icon="pen-to-square" class="w-5 h-5" />
                  </button>
                  <!-- Delete -->
                  <button
                    @click="handleRemoveGroup(group)"
                    class="p-2 text-content-tertiary hover:text-error"
                    title="刪除"
                  >
                    <ph-icon icon="trash" class="w-5 h-5" />
                  </button>
                </div>
              </div>

              <!-- Edit mode -->
              <div v-else class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-content-secondary mb-1">群組名稱 *</label>
                  <input
                    v-model="editName"
                    type="text"
                    class="input"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-content-secondary mb-1">外部 ID（選填）</label>
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
                    取消
                  </button>
                  <button
                    @click="handleSaveGroup"
                    :disabled="!editName.trim() || isSubmitting"
                    class="btn-primary"
                  >
                    儲存
                  </button>
                </div>
              </div>
            </div>

            <!-- Empty state -->
            <div
              v-if="groupsStore.groups.length === 0 && !groupsStore.isLoading"
              class="p-8 text-center text-content-tertiary"
            >
              沒有群組
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
                  {{ selectedGroup?.name }} - 成員管理
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
                  <label class="block text-sm font-medium text-content-secondary mb-2">選擇使用者</label>
                  <select
                    v-model="selectedUserId"
                    class="select"
                  >
                    <option :value="null">請選擇</option>
                    <option v-for="user in availableUsers" :key="user.id" :value="user.id">
                      {{ user.name || user.username }} (@{{ user.username }})
                    </option>
                  </select>
                  <div class="flex gap-2 justify-end mt-3">
                    <button
                      @click="showAddMemberForm = false"
                      class="px-3 py-1.5 text-sm text-content-secondary hover:text-content"
                    >
                      取消
                    </button>
                    <button
                      @click="handleAddMember"
                      :disabled="!selectedUserId"
                      class="btn-primary btn-sm"
                    >
                      加入
                    </button>
                  </div>
                </div>

                <div v-else class="mb-4">
                  <button
                    @click="showAddMemberForm = true"
                    class="btn-secondary w-full"
                  >
                    + 新增成員
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
                      <div
                        class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                        :style="{ backgroundColor: getAvatarColor(getUserDisplayName(member)) }"
                      >
                        {{ getAvatarInitial(getUserDisplayName(member)) }}
                      </div>
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
                      title="移除"
                    >
                      <ph-icon icon="xmark" class="w-4 h-4" />
                    </button>
                  </div>

                  <div
                    v-if="groupMembers.length === 0"
                    class="text-center py-4 text-content-tertiary text-sm"
                  >
                    此群組沒有成員
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
