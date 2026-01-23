import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import { useSystemStore } from './system'
import type { ProjectMember, User } from '@/types'

/**
 * 成員資料取得策略：
 *
 * 方式一（標準 Kanboard API）：
 * - 從 getProjectUsers / getAssignableUsers 取得 { userId: displayName } 格式
 * - 再用 getUser 逐一取得每個使用者的完整資料
 *
 * 方式二（Kanpro Bridge 擴展 API）：
 * - 如果 Kanpro Bridge 的 project_user 功能有啟用
 * - 使用 getProjectUsersExtended / getAssignableUsersExtended 一次取得完整資料
 * - 回傳格式包含: id, username, name, email, role, is_active, project_role
 *
 * API 使用場景：
 * - getProjectUsers / getProjectUsersExtended: 專案設定頁的成員管理（顯示所有成員，含瀏覽者）
 * - getAssignableUsers / getAssignableUsersExtended: 任務指派人選擇器（只顯示可指派的人，不含瀏覽者）
 */

/**
 * Kanpro Bridge Extended API 回傳的使用者格式
 */
interface ExtendedProjectUser {
  id: number
  username: string
  name: string | null
  email: string | null
  role: string  // 系統角色 (app-admin, app-manager, app-user)
  is_active: boolean | string | number
  project_role: 'project-manager' | 'project-member' | 'project-viewer'
}

export const useMembersStore = defineStore('members', () => {
  // 專案所有成員（含瀏覽者）- 用於專案設定
  const members = ref<ProjectMember[]>([])
  const membersMap = ref<Record<string | number, string>>({})

  // 可指派任務的成員（不含瀏覽者）- 用於任務指派
  const assignableUsers = ref<ProjectMember[]>([])
  const assignableUsersMap = ref<Record<string | number, string>>({})

  const allUsers = ref<User[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const membersCount = computed(() => members.value.length)
  const assignableUsersCount = computed(() => assignableUsers.value.length)

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

  /**
   * 從 API 回傳的 { userId: displayName } 格式建立完整的成員資料
   */
  async function buildMembersList(
    projectId: number,
    userIdMap: Record<string, string>,
    includeRole: boolean = true
  ): Promise<ProjectMember[]> {
    const userIds = Object.keys(userIdMap).map(id => parseInt(id, 10))

    const memberPromises = userIds.map(async (userId) => {
      const [user, role] = await Promise.all([
        fetchUser(userId),
        includeRole ? fetchProjectUserRole(projectId, userId) : Promise.resolve('project-member' as const)
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

      // 如果無法取得使用者資料，使用 displayName 作為 fallback
      const displayName = userIdMap[userId.toString()] || `User ${userId}`
      return {
        id: userId,
        username: displayName,
        name: displayName,
        email: null,
        role: role,
        is_active: true
      } as ProjectMember
    })

    return Promise.all(memberPromises)
  }

  /**
   * 檢查 Kanpro Bridge 的 project_user 功能是否啟用
   */
  function isProjectUserExtendedEnabled(): boolean {
    const systemStore = useSystemStore()
    return systemStore.isModuleEnabled('project_user')
  }

  /**
   * 從 Extended API 回傳格式轉換為 ProjectMember
   */
  function convertExtendedUserToMember(user: ExtendedProjectUser): ProjectMember {
    const isActive = user.is_active === true ||
      (user.is_active as unknown) === '1' ||
      (user.is_active as unknown) === 1

    return {
      id: user.id,
      username: user.username,
      name: user.name || null,
      email: user.email || null,
      role: user.project_role,
      is_active: isActive
    }
  }

  /**
   * 取得專案所有成員（含瀏覽者）
   * 用途：專案設定頁的成員管理
   *
   * 如果 Kanpro Bridge project_user 功能啟用，使用 getProjectUsersExtended
   * 否則使用標準 getProjectUsers API
   */
  async function fetchProjectMembers(projectId: number): Promise<void> {
    const authStore = useAuthStore()

    isLoading.value = true
    error.value = null

    try {
      const client = authStore.getClient()

      // 檢查是否使用 Extended API
      if (isProjectUserExtendedEnabled()) {
        // 使用 Kanpro Bridge Extended API - 一次取得完整資料
        const result = await client.call<ExtendedProjectUser[]>('getProjectUsersExtended', {
          project_id: projectId
        })

        const extendedUsers = result || []
        members.value = extendedUsers.map(convertExtendedUserToMember)

        // 建立 ID->name 對應表供其他地方使用
        membersMap.value = {}
        for (const user of extendedUsers) {
          membersMap.value[user.id] = user.name || user.username
        }
      } else {
        // 使用標準 Kanboard API
        // getProjectUsers returns { userId: displayName } format
        const result = await client.call<Record<string, string>>('getProjectUsers', {
          project_id: projectId
        })

        // Preserve the original ID->name mapping for quick lookup
        membersMap.value = result || {}

        // 取得每個使用者的完整資料和角色
        members.value = await buildMembersList(projectId, result || {}, true)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '載入成員失敗'
      members.value = []
      membersMap.value = {}
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 取得可指派任務的成員（不含瀏覽者）
   * 用途：任務指派人選擇器
   *
   * 如果 Kanpro Bridge project_user 功能啟用，使用 getAssignableUsersExtended
   * 否則使用標準 getAssignableUsers API
   */
  async function fetchAssignableUsers(projectId: number): Promise<void> {
    const authStore = useAuthStore()

    isLoading.value = true
    error.value = null

    try {
      const client = authStore.getClient()

      // 檢查是否使用 Extended API
      if (isProjectUserExtendedEnabled()) {
        // 使用 Kanpro Bridge Extended API - 一次取得完整資料
        const result = await client.call<ExtendedProjectUser[]>('getAssignableUsersExtended', {
          project_id: projectId
        })

        const extendedUsers = result || []
        assignableUsers.value = extendedUsers.map(convertExtendedUserToMember)

        // 建立 ID->name 對應表供其他地方使用
        assignableUsersMap.value = {}
        for (const user of extendedUsers) {
          assignableUsersMap.value[user.id] = user.name || user.username
        }
      } else {
        // 使用標準 Kanboard API
        // getAssignableUsers returns { userId: displayName } format
        // 只回傳可以被指派任務的使用者（不包含 project-viewer）
        const result = await client.call<Record<string, string>>('getAssignableUsers', {
          project_id: projectId
        })

        // Preserve the original ID->name mapping for quick lookup
        assignableUsersMap.value = result || {}

        // 取得每個使用者的完整資料（可指派的使用者不需要查角色，因為一定不是 viewer）
        assignableUsers.value = await buildMembersList(projectId, result || {}, false)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '載入可指派使用者失敗'
      assignableUsers.value = []
      assignableUsersMap.value = {}
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 取得可指派任務的成員（alias for fetchAssignableUsers）
   * 用於 TaskFormModal 等任務相關元件
   */
  const fetchMembers = fetchAssignableUsers

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
    assignableUsers.value = []
    assignableUsersMap.value = {}
    error.value = null
  }

  return {
    // 專案所有成員（含瀏覽者）
    members,
    membersMap,
    membersCount,

    // 可指派任務的成員（不含瀏覽者）
    assignableUsers,
    assignableUsersMap,
    assignableUsersCount,

    // 所有使用者（需 admin 權限）
    allUsers,
    availableUsers,

    // 狀態
    isLoading,
    error,

    // 取得成員
    fetchProjectMembers,    // 用於專案設定
    fetchAssignableUsers,   // 用於任務指派
    fetchMembers,           // alias for fetchAssignableUsers
    fetchAllUsers,          // 需 admin 權限

    // 成員管理
    addProjectUser,
    removeProjectUser,
    changeProjectUserRole,
    clearMembers
  }
})
