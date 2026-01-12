<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGroupsStore } from '@/stores/groups'
import { useUsersStore } from '@/stores/users'
import NotificationsDropdown from '@/components/NotificationsDropdown.vue'
import type { Group, User } from '@/types'

const router = useRouter()
const authStore = useAuthStore()
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
          <h1 class="text-xl font-bold text-gray-900">群組管理</h1>
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
          所有群組
          <span v-if="groupsStore.groupsCount > 0" class="text-gray-400 text-sm font-normal">
            ({{ groupsStore.groupsCount }})
          </span>
        </h2>
        <button
          v-if="!isAdding"
          @click="startAdding"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + 新增群組
        </button>
      </div>

      <!-- Loading -->
      <div v-if="groupsStore.isLoading" class="flex items-center justify-center py-12">
        <svg class="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <div v-else class="space-y-4">
        <!-- Add group form -->
        <div v-if="isAdding" class="bg-white rounded-lg shadow p-6 space-y-4">
          <h3 class="text-lg font-semibold text-gray-900">新增群組</h3>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">群組名稱 *</label>
              <input
                v-model="newGroupName"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="輸入群組名稱"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">外部 ID（選填）</label>
              <input
                v-model="newExternalId"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="如 LDAP 群組 ID"
              />
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
              @click="handleAddGroup"
              :disabled="!newGroupName.trim() || isSubmitting"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              新增
            </button>
          </div>
        </div>

        <!-- Groups list -->
        <div class="bg-white rounded-lg shadow">
          <div class="divide-y">
            <div
              v-for="group in groupsStore.groups"
              :key="group.id"
              class="p-4"
            >
              <!-- View mode -->
              <div v-if="editingGroupId !== group.id" class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <!-- Group icon -->
                  <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>

                  <!-- Group info -->
                  <div>
                    <div class="font-medium text-gray-900">{{ group.name }}</div>
                    <div v-if="group.external_id" class="text-sm text-gray-500">
                      外部 ID: {{ group.external_id }}
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <!-- Members -->
                  <button
                    @click="openMembersModal(group)"
                    class="p-2 text-gray-400 hover:text-gray-600"
                    title="管理成員"
                  >
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </button>
                  <!-- Edit -->
                  <button
                    @click="startEditing(group)"
                    class="p-2 text-gray-400 hover:text-gray-600"
                    title="編輯"
                  >
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <!-- Delete -->
                  <button
                    @click="handleRemoveGroup(group)"
                    class="p-2 text-gray-400 hover:text-red-500"
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
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">群組名稱 *</label>
                  <input
                    v-model="editName"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">外部 ID（選填）</label>
                  <input
                    v-model="editExternalId"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
                    @click="handleSaveGroup"
                    :disabled="!editName.trim() || isSubmitting"
                    class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    儲存
                  </button>
                </div>
              </div>
            </div>

            <!-- Empty state -->
            <div
              v-if="groupsStore.groups.length === 0 && !groupsStore.isLoading"
              class="p-8 text-center text-gray-500"
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
          <div class="relative bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div class="p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-900">
                  {{ selectedGroup?.name }} - 成員管理
                </h3>
                <button
                  @click="closeMembersModal"
                  class="text-gray-400 hover:text-gray-600"
                >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <!-- Loading -->
              <div v-if="isLoadingMembers" class="text-center py-8">
                <svg class="animate-spin h-6 w-6 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>

              <div v-else>
                <!-- Add member form -->
                <div v-if="showAddMemberForm" class="mb-4 p-4 bg-gray-50 rounded-lg">
                  <label class="block text-sm font-medium text-gray-700 mb-2">選擇使用者</label>
                  <select
                    v-model="selectedUserId"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option :value="null">請選擇</option>
                    <option v-for="user in availableUsers" :key="user.id" :value="user.id">
                      {{ user.name || user.username }} (@{{ user.username }})
                    </option>
                  </select>
                  <div class="flex gap-2 justify-end mt-3">
                    <button
                      @click="showAddMemberForm = false"
                      class="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                    >
                      取消
                    </button>
                    <button
                      @click="handleAddMember"
                      :disabled="!selectedUserId"
                      class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      加入
                    </button>
                  </div>
                </div>

                <div v-else class="mb-4">
                  <button
                    @click="showAddMemberForm = true"
                    class="w-full px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    + 新增成員
                  </button>
                </div>

                <!-- Members list -->
                <div class="space-y-2 max-h-64 overflow-y-auto">
                  <div
                    v-for="member in groupMembers"
                    :key="member.id"
                    class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <span class="text-gray-600 text-sm font-medium">
                          {{ (member.name || member.username).charAt(0).toUpperCase() }}
                        </span>
                      </div>
                      <div>
                        <div class="font-medium text-gray-900 text-sm">
                          {{ member.name || member.username }}
                        </div>
                        <div class="text-xs text-gray-500">@{{ member.username }}</div>
                      </div>
                    </div>
                    <button
                      @click="handleRemoveMember(member.id)"
                      class="p-1 text-gray-400 hover:text-red-500"
                      title="移除"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div
                    v-if="groupMembers.length === 0"
                    class="text-center py-4 text-gray-500 text-sm"
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
  </div>
</template>
