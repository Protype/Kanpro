import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import type { Project } from '@/types'

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
      const result = await client.call<Project[]>('getAllProjects')
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

  async function createProject(data: {
    name: string
    description?: string
    identifier?: string
    is_private?: boolean
  }): Promise<number | false> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    try {
      const result = await client.call<number | false>('createProject', {
        name: data.name,
        description: data.description,
        identifier: data.identifier,
        is_private: data.is_private ? 1 : 0
      })

      // 建立成功後重新載入專案列表
      if (result !== false) {
        await fetchProjects()
      }

      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : '建立專案失敗'
      return false
    }
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
    createProject
  }
})
