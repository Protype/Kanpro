import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import type { Subtask } from '@/types'

export const useSubtasksStore = defineStore('subtasks', () => {
  const subtasks = ref<Subtask[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties for progress
  const totalCount = computed(() => subtasks.value.length)
  const completedCount = computed(() => subtasks.value.filter(s => s.status === 2).length)
  const progressPercentage = computed(() => {
    if (totalCount.value === 0) return 0
    return (completedCount.value / totalCount.value) * 100
  })

  async function fetchSubtasks(taskId: number): Promise<void> {
    const authStore = useAuthStore()

    isLoading.value = true
    error.value = null

    try {
      const client = authStore.getClient()
      const result = await client.call<Subtask[]>('getAllSubtasks', { task_id: taskId })
      subtasks.value = result || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : '載入子任務失敗'
      subtasks.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function createSubtask(taskId: number, title: string, userId?: number): Promise<number> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const params: Record<string, unknown> = {
      task_id: taskId,
      title
    }
    if (userId !== undefined) {
      params.user_id = userId
    }

    const subtaskId = await client.call<number>('createSubtask', params)
    return subtaskId
  }

  async function updateSubtaskStatus(subtaskId: number, status: 0 | 1 | 2): Promise<boolean> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<boolean>('updateSubtask', {
      id: subtaskId,
      status
    })
    return result
  }

  async function updateSubtask(subtaskId: number, params: { title?: string; status?: 0 | 1 | 2; user_id?: number | null }): Promise<boolean> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<boolean>('updateSubtask', {
      id: subtaskId,
      ...params
    })
    return result
  }

  async function removeSubtask(subtaskId: number): Promise<boolean> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<boolean>('removeSubtask', { subtask_id: subtaskId })
    return result
  }

  function clearSubtasks(): void {
    subtasks.value = []
    error.value = null
  }

  return {
    subtasks,
    isLoading,
    error,
    totalCount,
    completedCount,
    progressPercentage,
    fetchSubtasks,
    createSubtask,
    updateSubtaskStatus,
    updateSubtask,
    removeSubtask,
    clearSubtasks
  }
})
