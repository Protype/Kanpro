import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import type { Project } from '@/types'

/**
 * Kanboard createProject API 支援的參數（建立團隊專案）
 *
 * 注意：
 * - 此 API 建立的是團隊專案 (is_private=0)
 * - 若要建立個人專案 (is_private=1)，需使用 createMyPrivateProject API
 * - is_public 無法在建立時設定，需建立後呼叫 disableProjectPublicAccess
 */
export interface CreateProjectParams {
  name: string
  description?: string
  owner_id?: number
  identifier?: string
  start_date?: string // ISO8601 格式
  end_date?: string   // ISO8601 格式
  priority_default?: number
  priority_start?: number
  priority_end?: number
  email?: string
}

/**
 * Kanboard createMyPrivateProject API 支援的參數（建立個人專案）
 *
 * 個人專案特性：
 * - is_private=1，建立後無法變更
 * - 僅擁有者和系統管理員可存取
 * - 無成員管理功能（addProjectUser 等 API 無效）
 */
export interface CreatePrivateProjectParams {
  name: string
  description?: string
}

/**
 * Kanboard updateProject API 支援的完整參數
 */
export interface UpdateProjectParams {
  name?: string
  description?: string
  identifier?: string
  owner_id?: number
  start_date?: string
  end_date?: string
  priority_default?: number
  priority_start?: number
  priority_end?: number
  email?: string
}

/**
 * 建立團隊專案的選項（包含建立後的額外操作）
 */
export interface CreateProjectOptions extends CreateProjectParams {
  /**
   * 建立後是否停用公開存取
   * 預設專案是 is_public=0（已停用），此選項用於確保停用
   */
  disablePublicAccess?: boolean
}

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const searchQuery = ref('')

  const activeProjects = computed(() => {
    return projects.value.filter(p => p.is_active)
  })

  const filteredProjects = computed(() => {
    if (!searchQuery.value.trim()) {
      return projects.value
    }

    const query = searchQuery.value.toLowerCase()
    return projects.value.filter(p => {
      const nameMatch = p.name.toLowerCase().includes(query)
      const descMatch = p.description?.toLowerCase().includes(query) ?? false
      return nameMatch || descMatch
    })
  })

  async function fetchProjects(): Promise<void> {
    const authStore = useAuthStore()

    isLoading.value = true
    error.value = null

    try {
      const client = authStore.getClient()
      // 使用 getMyProjects 取代 getAllProjects
      // getAllProjects 需要 admin 權限，非 admin 用戶會得到 403
      const result = await client.call<Project[]>('getMyProjects')
      projects.value = result
    } catch (err) {
      error.value = err instanceof Error ? err.message : '載入專案失敗'
      projects.value = []
    } finally {
      isLoading.value = false
    }
  }

  function getProjectById(id: number): Project | undefined {
    return projects.value.find(p => p.id === id)
  }

  async function updateProject(
    projectId: number,
    data: UpdateProjectParams
  ): Promise<boolean> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<boolean>('updateProject', {
      project_id: projectId,
      ...data
    })
    return result
  }

  /**
   * 取得單一專案詳細資訊
   */
  async function fetchProjectById(projectId: number): Promise<Project | null> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    try {
      const result = await client.call<Project>('getProjectById', {
        project_id: projectId
      })
      return result
    } catch (err) {
      console.error('Failed to fetch project:', err)
      return null
    }
  }

  async function removeProject(projectId: number): Promise<boolean> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<boolean>('removeProject', {
      project_id: projectId
    })
    return result
  }

  /**
   * 停用專案的公開存取
   */
  async function disableProjectPublicAccess(projectId: number): Promise<boolean> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    try {
      const result = await client.call<boolean>('disableProjectPublicAccess', {
        project_id: projectId
      })
      return result
    } catch (err) {
      console.error('Failed to disable public access:', err)
      return false
    }
  }

  /**
   * 啟用專案的公開存取
   */
  async function enableProjectPublicAccess(projectId: number): Promise<boolean> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    try {
      const result = await client.call<boolean>('enableProjectPublicAccess', {
        project_id: projectId
      })
      return result
    } catch (err) {
      console.error('Failed to enable public access:', err)
      return false
    }
  }

  /**
   * 建立個人專案
   * @param params 個人專案建立參數
   * @returns 建立成功返回專案 ID，失敗返回 false
   */
  async function createMyPrivateProject(params: CreatePrivateProjectParams): Promise<number | false> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    // 過濾掉 undefined 值
    const apiParams: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') {
        apiParams[key] = value
      }
    }

    try {
      const projectId = await client.call<number | false>('createMyPrivateProject', apiParams)

      if (projectId !== false) {
        // 重新載入專案列表
        await fetchProjects()
      }

      return projectId
    } catch (err) {
      error.value = err instanceof Error ? err.message : '建立個人專案失敗'
      return false
    }
  }

  /**
   * 建立團隊專案
   * @param options 專案建立選項
   * @returns 建立成功返回專案 ID，失敗返回 false
   */
  async function createProject(options: CreateProjectOptions): Promise<number | false> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    // 分離建立後操作選項與 API 參數
    const { disablePublicAccess, ...apiParams } = options

    // 過濾掉 undefined 值
    const params: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(apiParams)) {
      if (value !== undefined && value !== '') {
        params[key] = value
      }
    }

    try {
      const projectId = await client.call<number | false>('createProject', params)

      if (projectId !== false) {
        // 建立成功後，若需要限制公開存取
        if (disablePublicAccess) {
          await disableProjectPublicAccess(projectId)
        }

        // 重新載入專案列表
        await fetchProjects()
      }

      return projectId
    } catch (err) {
      error.value = err instanceof Error ? err.message : '建立專案失敗'
      return false
    }
  }

  /**
   * 重置 store 狀態（登出時呼叫）
   */
  function $reset(): void {
    projects.value = []
    isLoading.value = false
    error.value = null
    searchQuery.value = ''
  }

  return {
    projects,
    isLoading,
    error,
    searchQuery,
    activeProjects,
    filteredProjects,
    fetchProjects,
    fetchProjectById,
    getProjectById,
    updateProject,
    removeProject,
    createProject,
    createMyPrivateProject,
    disableProjectPublicAccess,
    enableProjectPublicAccess,
    $reset
  }
})
