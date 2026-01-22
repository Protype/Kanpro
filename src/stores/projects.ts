import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import type { Project } from '@/types'

/**
 * Kanboard createProject API 支援的完整參數
 * 注意：is_private 不被 API 支援，需建立後呼叫 disableProjectPublicAccess
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
 * 建立專案的選項（包含建立後的額外操作）
 */
export interface CreateProjectOptions extends CreateProjectParams {
  /** 建立後是否限制公開存取（呼叫 disableProjectPublicAccess） */
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
    data: { name?: string; description?: string; start_date?: string; end_date?: string }
  ): Promise<boolean> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<boolean>('updateProject', {
      project_id: projectId,
      ...data
    })
    return result
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
   * 建立專案
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
    getProjectById,
    updateProject,
    removeProject,
    createProject,
    disableProjectPublicAccess,
    enableProjectPublicAccess,
    $reset
  }
})
