<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useMembersStore } from '@/stores/members'
import type { ProjectMember } from '@/types'

const props = defineProps<{
  projectId: number
}>()

const emit = defineEmits<{
  updated: []
}>()

const membersStore = useMembersStore()

const isAdding = ref(false)
const isSubmitting = ref(false)
const selectedUserId = ref<number | null>(null)
const selectedRole = ref<'project-manager' | 'project-member' | 'project-viewer'>('project-member')

const getRoleBadgeClass = (role: string): string => {
  switch (role) {
    case 'project-manager':
      return 'bg-purple-100 text-purple-700'
    case 'project-member':
      return 'bg-blue-100 text-blue-700'
    case 'project-viewer':
      return 'bg-gray-100 text-gray-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

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
}

const handleAddMember = async () => {
  if (!selectedUserId.value || isSubmitting.value) return

  isSubmitting.value = true
  try {
    await membersStore.addProjectUser(props.projectId, selectedUserId.value, selectedRole.value)
    await membersStore.fetchProjectMembers(props.projectId)
    await membersStore.fetchAllUsers()
    cancelAdding()
    emit('updated')
  } catch (error) {
    console.error('Failed to add member:', error)
    alert('新增成員失敗')
  } finally {
    isSubmitting.value = false
  }
}

const handleRemoveMember = async (member: ProjectMember) => {
  if (!confirm(`確定要從專案中移除「${member.name || member.username}」嗎？`)) return

  try {
    await membersStore.removeProjectUser(props.projectId, member.id)
    await membersStore.fetchProjectMembers(props.projectId)
    await membersStore.fetchAllUsers()
    emit('updated')
  } catch (error) {
    console.error('Failed to remove member:', error)
    alert('移除成員失敗')
  }
}

const handleChangeRole = async (member: ProjectMember, newRole: 'project-manager' | 'project-member' | 'project-viewer') => {
  if (member.role === newRole) return

  try {
    await membersStore.changeProjectUserRole(props.projectId, member.id, newRole)
    await membersStore.fetchProjectMembers(props.projectId)
    emit('updated')
  } catch (error) {
    console.error('Failed to change role:', error)
    alert('變更角色失敗')
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900">
        專案成員
        <span v-if="membersStore.membersCount > 0" class="text-gray-400 text-sm font-normal">
          ({{ membersStore.membersCount }})
        </span>
      </h3>
      <button
        v-if="!isAdding"
        @click="startAdding"
        class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        + 新增成員
      </button>
    </div>

    <!-- Loading -->
    <div v-if="membersStore.isLoading" class="text-center py-4">
      <svg class="animate-spin h-6 w-6 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <div v-else class="space-y-3">
      <!-- Add member form -->
      <div v-if="isAdding" class="bg-gray-50 rounded-lg p-4 space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">選擇使用者</label>
            <select
              v-model="selectedUserId"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option :value="null" disabled>選擇使用者...</option>
              <option v-for="user in membersStore.availableUsers" :key="user.id" :value="user.id">
                {{ user.name || user.username }} ({{ user.username }})
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">角色</label>
            <select
              v-model="selectedRole"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="project-manager">專案經理</option>
              <option value="project-member">專案成員</option>
              <option value="project-viewer">瀏覽者</option>
            </select>
          </div>
        </div>
        <div class="flex gap-2 justify-end">
          <button
            @click="cancelAdding"
            :disabled="isSubmitting"
            class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            取消
          </button>
          <button
            @click="handleAddMember"
            :disabled="!selectedUserId || isSubmitting"
            class="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            新增
          </button>
        </div>
      </div>

      <!-- Members list -->
      <div class="bg-white rounded-lg border divide-y">
        <div
          v-for="member in membersStore.members"
          :key="member.id"
          class="flex items-center justify-between p-4 hover:bg-gray-50"
        >
          <div class="flex items-center gap-3">
            <!-- Avatar -->
            <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <span class="text-gray-600 font-medium">
                {{ (member.name || member.username).charAt(0).toUpperCase() }}
              </span>
            </div>

            <!-- User info -->
            <div>
              <div class="font-medium text-gray-900">
                {{ member.name || member.username }}
              </div>
              <div class="text-sm text-gray-500">
                {{ member.username }}
                <span v-if="member.email"> · {{ member.email }}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <!-- Role selector -->
            <select
              :value="member.role"
              @change="handleChangeRole(member, ($event.target as HTMLSelectElement).value as 'project-manager' | 'project-member' | 'project-viewer')"
              :class="[
                'px-2 py-1 text-xs font-medium rounded border-0 cursor-pointer',
                getRoleBadgeClass(member.role)
              ]"
            >
              <option value="project-manager">專案經理</option>
              <option value="project-member">專案成員</option>
              <option value="project-viewer">瀏覽者</option>
            </select>

            <!-- Remove button -->
            <button
              @click="handleRemoveMember(member)"
              class="p-1 text-gray-400 hover:text-red-500 transition-colors"
              title="移除成員"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Empty state -->
        <div
          v-if="membersStore.members.length === 0 && !membersStore.isLoading"
          class="p-8 text-center text-gray-500"
        >
          沒有成員
        </div>
      </div>
    </div>
  </div>
</template>
