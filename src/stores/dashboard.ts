import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import { useProjectsStore } from './projects'
import type { Task } from '@/types'

export const useDashboardStore = defineStore('dashboard', () => {
  const myTasks = ref<Task[]>([])
  const overdueTasks = ref<Task[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const hasOverdueTasks = computed(() => overdueTasks.value.length > 0)

  async function fetchMyTasks(): Promise<void> {
    const authStore = useAuthStore()
    const projectsStore = useProjectsStore()

    isLoading.value = true
    error.value = null

    try {
      const client = authStore.getClient()
      // 確保已載入專案列表
      if (projectsStore.projects.length === 0) {
        await projectsStore.fetchProjects()
      }

      // 從每個專案搜尋指派給我的任務
      const allTasks: Task[] = []
      for (const project of projectsStore.activeProjects) {
        try {
          const tasks = await client.call<Task[]>('searchTasks', {
            project_id: project.id,
            query: 'assignee:me status:open'
          })
          if (tasks) allTasks.push(...tasks)
        } catch {
          // 忽略單一專案的錯誤
        }
      }
      myTasks.value = allTasks
    } catch (err) {
      error.value = err instanceof Error ? err.message : '載入任務失敗'
      myTasks.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function fetchOverdueTasks(): Promise<void> {
    const authStore = useAuthStore()
    const projectsStore = useProjectsStore()

    try {
      const client = authStore.getClient()
      // 確保已載入專案列表
      if (projectsStore.projects.length === 0) {
        await projectsStore.fetchProjects()
      }

      // 從每個專案搜尋逾期任務（getOverdueTasks 需要 admin 權限）
      const allTasks: Task[] = []
      for (const project of projectsStore.activeProjects) {
        try {
          const tasks = await client.call<Task[]>('searchTasks', {
            project_id: project.id,
            query: 'overdue:yes status:open'
          })
          if (tasks) allTasks.push(...tasks)
        } catch {
          // 忽略單一專案的錯誤
        }
      }
      overdueTasks.value = allTasks
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
