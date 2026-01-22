<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useGroupsStore } from '@/stores/groups'
import { useUsersStore } from '@/stores/users'
import { useToast } from '@/stores/toast'
import type { Group, User } from '@/types'

const groupsStore = useGroupsStore()
const usersStore = useUsersStore()
const toast = useToast()

// Filter state
const filterQuery = ref('')

// Form state
const isAdding = ref(false)
const isSubmitting = ref(false)
const editingGroupId = ref<number | null>(null)

// New group form
const newGroupName = ref('')
const newExternalId = ref('')

// Edit form
const editName = ref('')
const editExternalId = ref('')

// Members modal state
const showMembersModal = ref(false)
const selectedGroup = ref<Group | null>(null)
const groupMembers = ref<User[]>([])
const isLoadingMembers = ref(false)
const showAddMemberForm = ref(false)
const selectedUserId = ref<number | null>(null)

// Filtered groups
const filteredGroups = computed(() => {
  if (!filterQuery.value.trim()) return groupsStore.groups

  const query = filterQuery.value.toLowerCase()
  return groupsStore.groups.filter(g =>
    g.name.toLowerCase().includes(query) ||
    g.external_id?.toLowerCase().includes(query)
  )
})

const availableUsers = computed(() => {
  const memberIds = new Set(groupMembers.value.map(m => m.id))
  return usersStore.users.filter(u => !memberIds.has(u.id) && u.is_active)
})

onMounted(async () => {
  await Promise.all([
    groupsStore.fetchAllGroups(),
    usersStore.fetchAllUsers()
  ])
})

const startAdding = () => {
  isAdding.value = true
  editingGroupId.value = null
  newGroupName.value = ''
  newExternalId.value = ''
}

const cancelAdding = () => {
  isAdding.value = false
}

const handleAddGroup = async () => {
  if (!newGroupName.value.trim() || isSubmitting.value) return

  isSubmitting.value = true

  try {
    await groupsStore.createGroup(
      newGroupName.value.trim(),
      newExternalId.value.trim() || undefined
    )
    await groupsStore.fetchAllGroups()
    cancelAdding()
    toast.success('群組新增成功')
  } catch (err) {
    toast.error('新增失敗', err instanceof Error ? err.message : '新增群組失敗')
  } finally {
    isSubmitting.value = false
  }
}

const startEditing = (group: Group) => {
  isAdding.value = false
  editingGroupId.value = group.id
  editName.value = group.name
  editExternalId.value = group.external_id || ''
}

const cancelEditing = () => {
  editingGroupId.value = null
}

const handleSaveGroup = async () => {
  if (!editingGroupId.value || !editName.value.trim() || isSubmitting.value) return

  isSubmitting.value = true

  try {
    await groupsStore.updateGroup(
      editingGroupId.value,
      editName.value.trim(),
      editExternalId.value.trim() || undefined
    )
    await groupsStore.fetchAllGroups()
    cancelEditing()
    toast.success('群組更新成功')
  } catch (err) {
    toast.error('更新失敗', err instanceof Error ? err.message : '更新群組失敗')
  } finally {
    isSubmitting.value = false
  }
}

const handleRemoveGroup = async (group: Group) => {
  if (!confirm(`確定要刪除群組「${group.name}」嗎？此操作無法復原。`)) return

  try {
    await groupsStore.removeGroup(group.id)
    await groupsStore.fetchAllGroups()
    toast.success('群組已刪除')
  } catch (err) {
    toast.error('刪除失敗', err instanceof Error ? err.message : '刪除群組失敗')
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
    toast.error('載入失敗', err instanceof Error ? err.message : '載入成員失敗')
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
    toast.success('成員已加入')
  } catch (err) {
    toast.error('加入失敗', err instanceof Error ? err.message : '加入成員失敗')
  }
}

const handleRemoveMember = async (userId: number) => {
  if (!selectedGroup.value) return
  if (!confirm('確定要移除此成員嗎？')) return

  try {
    await groupsStore.removeGroupMember(selectedGroup.value.id, userId)
    groupMembers.value = await groupsStore.getGroupMembers(selectedGroup.value.id)
    toast.success('成員已移除')
  } catch (err) {
    toast.error('移除失敗', err instanceof Error ? err.message : '移除成員失敗')
  }
}
</script>

<template>
  <div class="h-full flex flex-col bg-surface-secondary">
    <!-- Loading -->
    <div v-if="groupsStore.isLoading && groupsStore.groups.length === 0" class="flex-1 flex items-center justify-center">
      <ph-icon icon="spinner" class="animate-spin h-8 w-8 text-accent" />
    </div>

    <!-- Content -->
    <main v-else class="flex-1 p-4 overflow-auto">
      <!-- Toolbar -->
      <div class="card mb-4 p-4 flex items-center gap-4 flex-wrap">
        <input
          v-model="filterQuery"
          type="text"
          placeholder="搜尋群組..."
          class="input flex-1 min-w-[200px] max-w-md"
        />
        <span class="text-sm text-content-tertiary">
          共 {{ filteredGroups.length }} 個群組
        </span>
        <div class="flex-1" />
        <button
          v-if="!isAdding"
          @click="startAdding"
          class="btn-primary"
        >
          <ph-icon icon="plus" class="w-4 h-4 mr-1.5" />
          新增群組
        </button>
      </div>

      <!-- Add Group Form -->
      <div v-if="isAdding" class="card mb-4 p-4">
        <h2 class="text-base font-semibold text-content mb-4">新增群組</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-content-secondary mb-1">群組名稱 *</label>
            <input v-model="newGroupName" type="text" class="input" placeholder="輸入群組名稱" />
          </div>
          <div>
            <label class="block text-sm font-medium text-content-secondary mb-1">外部 ID（選填）</label>
            <input v-model="newExternalId" type="text" class="input" placeholder="如 LDAP 群組 ID" />
          </div>
        </div>
        <div class="flex gap-2 justify-end mt-4">
          <button @click="cancelAdding" :disabled="isSubmitting" class="btn-secondary">
            取消
          </button>
          <button
            @click="handleAddGroup"
            :disabled="!newGroupName.trim() || isSubmitting"
            class="btn-primary"
          >
            <ph-icon v-if="isSubmitting" icon="spinner" class="w-4 h-4 mr-1.5 animate-spin" />
            新增
          </button>
        </div>
      </div>

      <!-- Groups Table -->
      <div class="card overflow-hidden">
        <table class="table">
          <thead class="table-header">
            <tr>
              <th class="table-header-cell">群組名稱</th>
              <th class="table-header-cell">外部 ID</th>
              <th class="table-header-cell w-32 text-right">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-edge">
            <!-- Edit Row -->
            <tr v-if="editingGroupId" class="bg-accent/5">
              <td class="table-cell" colspan="3">
                <div class="py-2">
                  <h3 class="text-sm font-medium text-content mb-3">編輯群組</h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-content-secondary mb-1">群組名稱 *</label>
                      <input v-model="editName" type="text" class="input" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-content-secondary mb-1">外部 ID（選填）</label>
                      <input v-model="editExternalId" type="text" class="input" />
                    </div>
                  </div>
                  <div class="flex gap-2 justify-end mt-3">
                    <button @click="cancelEditing" :disabled="isSubmitting" class="btn-secondary btn-sm">
                      取消
                    </button>
                    <button @click="handleSaveGroup" :disabled="!editName.trim() || isSubmitting" class="btn-primary btn-sm">
                      <ph-icon v-if="isSubmitting" icon="spinner" class="w-4 h-4 mr-1 animate-spin" />
                      儲存
                    </button>
                  </div>
                </div>
              </td>
            </tr>

            <!-- Group Rows -->
            <tr
              v-for="group in filteredGroups"
              :key="group.id"
              class="table-row"
            >
              <td class="table-cell">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                    <ph-icon icon="users-three" class="w-4 h-4 text-accent" />
                  </div>
                  <span class="font-medium text-content">{{ group.name }}</span>
                </div>
              </td>
              <td class="table-cell text-content-secondary font-mono text-sm">
                {{ group.external_id || '-' }}
              </td>
              <td class="table-cell text-right">
                <div class="flex items-center justify-end gap-1">
                  <button
                    @click="openMembersModal(group)"
                    class="p-1.5 text-content-tertiary hover:text-content-secondary hover:bg-surface-hover rounded"
                    title="管理成員"
                  >
                    <ph-icon icon="users" class="w-4 h-4" />
                  </button>
                  <button
                    @click="startEditing(group)"
                    class="p-1.5 text-content-tertiary hover:text-content-secondary hover:bg-surface-hover rounded"
                    title="編輯"
                  >
                    <ph-icon icon="pencil" class="w-4 h-4" />
                  </button>
                  <button
                    @click="handleRemoveGroup(group)"
                    class="p-1.5 text-content-tertiary hover:text-error hover:bg-surface-hover rounded"
                    title="刪除"
                  >
                    <ph-icon icon="trash" class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-if="filteredGroups.length === 0">
              <td colspan="3" class="px-4 py-8 text-center text-content-tertiary">
                <ph-icon icon="users-three" class="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>沒有符合條件的群組</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>

    <!-- Members Modal -->
    <Teleport to="body">
      <div
        v-if="showMembersModal"
        class="fixed inset-0 z-50 overflow-y-auto"
      >
        <div
          class="fixed inset-0 bg-black/50"
          @click="closeMembersModal"
        />
        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative bg-surface rounded-lg shadow-xl w-full max-w-lg">
            <div class="p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-content">
                  {{ selectedGroup?.name }} - 成員管理
                </h3>
                <button
                  @click="closeMembersModal"
                  class="p-1 text-content-tertiary hover:text-content-secondary hover:bg-surface-hover rounded"
                >
                  <ph-icon icon="x" class="w-5 h-5" />
                </button>
              </div>

              <!-- Loading -->
              <div v-if="isLoadingMembers" class="text-center py-8">
                <ph-icon icon="spinner" class="animate-spin h-6 w-6 text-accent mx-auto" />
              </div>

              <div v-else>
                <!-- Add member form -->
                <div v-if="showAddMemberForm" class="mb-4 p-4 bg-surface-secondary rounded-lg">
                  <label class="block text-sm font-medium text-content-secondary mb-2">選擇使用者</label>
                  <select v-model="selectedUserId" class="select">
                    <option :value="null">請選擇</option>
                    <option v-for="user in availableUsers" :key="user.id" :value="user.id">
                      {{ user.name || user.username }} (@{{ user.username }})
                    </option>
                  </select>
                  <div class="flex gap-2 justify-end mt-3">
                    <button @click="showAddMemberForm = false" class="btn-ghost btn-sm">
                      取消
                    </button>
                    <button @click="handleAddMember" :disabled="!selectedUserId" class="btn-primary btn-sm">
                      加入
                    </button>
                  </div>
                </div>

                <div v-else class="mb-4">
                  <button @click="showAddMemberForm = true" class="btn-secondary w-full">
                    <ph-icon icon="plus" class="w-4 h-4 mr-1.5" />
                    新增成員
                  </button>
                </div>

                <!-- Members list -->
                <div class="space-y-2 max-h-64 overflow-y-auto">
                  <div
                    v-for="member in groupMembers"
                    :key="member.id"
                    class="flex items-center justify-between p-3 bg-surface-secondary rounded-lg"
                  >
                    <div class="flex items-center gap-3">
                      <div class="avatar-sm">
                        <span>{{ (member.name || member.username).charAt(0).toUpperCase() }}</span>
                      </div>
                      <div>
                        <p class="font-medium text-content text-sm">{{ member.name || member.username }}</p>
                        <p class="text-xs text-content-tertiary">@{{ member.username }}</p>
                      </div>
                    </div>
                    <button
                      @click="handleRemoveMember(member.id)"
                      class="p-1 text-content-tertiary hover:text-error"
                      title="移除"
                    >
                      <ph-icon icon="x" class="w-4 h-4" />
                    </button>
                  </div>

                  <div v-if="groupMembers.length === 0" class="text-center py-4 text-content-tertiary text-sm">
                    此群組沒有成員
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
