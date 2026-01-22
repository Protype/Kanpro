import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import type { ProjectMember, User } from '@/types'

export const useMembersStore = defineStore('members', () => {
  const members = ref<ProjectMember[]>([])
  const membersMap = ref<Record<string | number, string>>({})
  const allUsers = ref<User[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const membersCount = computed(() => members.value.length)

  const availableUsers = computed(() => {
    const memberIds = members.value.map(m => m.id)
    return allUsers.value.filter(u => !memberIds.includes(u.id))
  })

  async function fetchProjectMembers(projectId: number): Promise<void> {
    const authStore = useAuthStore()

    isLoading.value = true
    error.value = null

    try {
      const client = authStore.getClient()
      // getProjectUsers returns { userId: displayName } format
      const result = await client.call<Record<string, string>>('getProjectUsers', {
        project_id: projectId
      })
      // Preserve the original ID->name mapping
      membersMap.value = result || {}
      // Convert to array of names for display
      members.value = Object.values(result || {}) as unknown as ProjectMember[]
    } catch (err) {
      error.value = err instanceof Error ? err.message : '載入成員失敗'
      members.value = []
      membersMap.value = {}
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 獲取所有用戶（需要 admin 權限）
   * 非 admin 用戶會靜默失敗，不影響其他功能
   */
  async function fetchAllUsers(): Promise<void> {
    const authStore = useAuthStore()

    try {
      const client = authStore.getClient()
      const result = await client.call<User[]>('getAllUsers')
      allUsers.value = result || []
    } catch {
      // getAllUsers 需要 admin 權限，非 admin 用戶會得到 403
      // 靜默失敗，不影響其他功能
      allUsers.value = []
    }
  }

  async function addProjectUser(
    projectId: number,
    userId: number,
    role: 'project-manager' | 'project-member' | 'project-viewer'
  ): Promise<boolean> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<boolean>('addProjectUser', {
      project_id: projectId,
      user_id: userId,
      role: role
    })
    return result
  }

  async function removeProjectUser(projectId: number, userId: number): Promise<boolean> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<boolean>('removeProjectUser', {
      project_id: projectId,
      user_id: userId
    })
    return result
  }

  async function changeProjectUserRole(
    projectId: number,
    userId: number,
    role: 'project-manager' | 'project-member' | 'project-viewer'
  ): Promise<boolean> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<boolean>('changeProjectUserRole', {
      project_id: projectId,
      user_id: userId,
      role: role
    })
    return result
  }

  function clearMembers(): void {
    members.value = []
    membersMap.value = {}
    error.value = null
  }

  return {
    members,
    membersMap,
    allUsers,
    isLoading,
    error,
    membersCount,
    availableUsers,
    fetchProjectMembers,
    fetchAllUsers,
    addProjectUser,
    removeProjectUser,
    changeProjectUserRole,
    clearMembers
  }
})
