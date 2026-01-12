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

  return {
    projects,
    isLoading,
    error,
    searchQuery,
    activeProjects,
    filteredProjects,
    fetchProjects,
    getProjectById
  }
})
