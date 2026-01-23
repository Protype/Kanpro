import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import type { ProjectMember, User } from '@/types'

/**
 * 成員資料取得策略：
 *
 * 方式一（目前實作）：
 * - 從 getProjectUsers 取得 { userId: displayName } 格式
 * - 再用 getUser 逐一取得每個使用者的完整資料
 *
 * 方式二（未來支援）：
 * - 如果 Kanpro Bridge API 有啟用，可一次取得完整成員資料
 * - TODO: 偵測 Bridge API 並自動切換
 */

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

  /**
   * 取得單一使用者資料
   */
  async function fetchUser(userId: number): Promise<User | null> {
    const authStore = useAuthStore()
    try {
      const client = authStore.getClient()
      const result = await client.call<User>('getUser', { user_id: userId })
      return result || null
    } catch {
      return null
    }
  }

  /**
   * 取得專案成員的角色
   * 使用 getProjectUserRole API
   */
  async function fetchProjectUserRole(
    projectId: number,
    userId: number
  ): Promise<'project-manager' | 'project-member' | 'project-viewer'> {
    const authStore = useAuthStore()
    try {
      const client = authStore.getClient()
      const result = await client.call<string>('getProjectUserRole', {
        project_id: projectId,
        user_id: userId
      })
      // API 回傳可能是空字串表示無角色
      if (result && ['project-manager', 'project-member', 'project-viewer'].includes(result)) {
        return result as 'project-manager' | 'project-member' | 'project-viewer'
      }
      return 'project-member' // 預設角色
    } catch {
      return 'project-member'
    }
  }

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

      // Preserve the original ID->name mapping for quick lookup
      membersMap.value = result || {}

      // 取得每個使用者的完整資料和角色
      const userIds = Object.keys(result || {}).map(id => parseInt(id, 10))

      // 並行取得所有使用者資料和角色
      const memberPromises = userIds.map(async (userId) => {
        const [user, role] = await Promise.all([
          fetchUser(userId),
          fetchProjectUserRole(projectId, userId)
        ])

        if (user) {
          // Kanboard API 可能回傳 '1'/'0' 字串或 boolean
          const isActive = user.is_active === true ||
            (user.is_active as unknown) === '1' ||
            (user.is_active as unknown) === 1

          return {
            id: user.id,
            username: user.username,
            name: user.name || null,
            email: user.email || null,
            role: role,
            is_active: isActive
          } as ProjectMember
        }

        // 如果無法取得使用者資料，使用 membersMap 中的 displayName 作為 fallback
        const displayName = result[userId.toString()] || `User ${userId}`
        return {
          id: userId,
          username: displayName,
          name: displayName,
          email: null,
          role: role,
          is_active: true
        } as ProjectMember
      })

      members.value = await Promise.all(memberPromises)
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
