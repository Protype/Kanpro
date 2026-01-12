import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import type { Task } from '@/types'

export const useDashboardStore = defineStore('dashboard', () => {
  const myTasks = ref<Task[]>([])
  const overdueTasks = ref<Task[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const hasOverdueTasks = computed(() => overdueTasks.value.length > 0)

  async function fetchMyTasks(): Promise<void> {
    const authStore = useAuthStore()

    isLoading.value = true
    error.value = null

    try {
      const client = authStore.getClient()
      // Search for tasks assigned to current user that are open
      const tasks = await client.call<Task[]>('searchTasks', {
        project_id: 0, // 0 means all projects
        query: 'assignee:me status:open'
      })
      myTasks.value = tasks || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : '載入任務失敗'
      myTasks.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function fetchOverdueTasks(): Promise<void> {
    const authStore = useAuthStore()

    try {
      const client = authStore.getClient()
      const tasks = await client.call<Task[]>('getOverdueTasks')
      overdueTasks.value = tasks || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : '載入逾期任務失敗'
      overdueTasks.value = []
    }
  }

  async function fetchDashboardData(): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      await Promise.all([
        fetchMyTasks(),
        fetchOverdueTasks()
      ])
    } finally {
      isLoading.value = false
    }
  }

  function clearDashboard(): void {
    myTasks.value = []
    overdueTasks.value = []
    error.value = null
  }

  return {
    myTasks,
    overdueTasks,
    isLoading,
    error,
    hasOverdueTasks,
    fetchMyTasks,
    fetchOverdueTasks,
    fetchDashboardData,
    clearDashboard
  }
})
