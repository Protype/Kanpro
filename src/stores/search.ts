import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'
import type { Task } from '@/types'

export const useSearchStore = defineStore('search', () => {
  const results = ref<Task[]>([])
  const isSearching = ref(false)
  const error = ref<string | null>(null)
  const query = ref('')

  async function searchTasks(projectId: number, searchQuery: string): Promise<void> {
    // Clear results if query is empty
    if (!searchQuery.trim()) {
      results.value = []
      query.value = ''
      return
    }

    const authStore = useAuthStore()

    isSearching.value = true
    error.value = null
    query.value = searchQuery

    try {
      const client = authStore.getClient()
      const searchResults = await client.call<Task[]>('searchTasks', {
        project_id: projectId,
        query: searchQuery
      })
      results.value = searchResults || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : '搜尋失敗'
      results.value = []
    } finally {
      isSearching.value = false
    }
  }

  function clearSearch(): void {
    results.value = []
    query.value = ''
    error.value = null
  }

  return {
    results,
    isSearching,
    error,
    query,
    searchTasks,
    clearSearch
  }
})
