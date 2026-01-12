import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'
import type { Task } from '@/types'

export interface CreateTaskParams {
  project_id: number
  title: string
  description?: string
  color_id?: string
  column_id?: number
  swimlane_id?: number
  owner_id?: number
  category_id?: number
  date_due?: string
  priority?: number
  score?: number
  time_estimated?: number
}

export interface UpdateTaskParams {
  title?: string
  description?: string
  color_id?: string
  column_id?: number
  swimlane_id?: number
  owner_id?: number
  category_id?: number
  date_due?: string
  priority?: number
  score?: number
  time_estimated?: number
}

export const useTasksStore = defineStore('tasks', () => {
  const currentTask = ref<Task | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchTask(taskId: number): Promise<void> {
    const authStore = useAuthStore()

    isLoading.value = true
    error.value = null

    try {
      const client = authStore.getClient()
      const task = await client.call<Task>('getTask', { task_id: taskId })
      currentTask.value = task
    } catch (err) {
      error.value = err instanceof Error ? err.message : '載入任務失敗'
      currentTask.value = null
    } finally {
      isLoading.value = false
    }
  }

  async function createTask(params: CreateTaskParams): Promise<number> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const taskId = await client.call<number>('createTask', { ...params })
    return taskId
  }

  async function updateTask(taskId: number, params: UpdateTaskParams): Promise<boolean> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<boolean>('updateTask', {
      id: taskId,
      ...params
    } as Record<string, unknown>)
    return result
  }

  async function closeTask(taskId: number): Promise<boolean> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<boolean>('closeTask', { task_id: taskId })
    return result
  }

  async function openTask(taskId: number): Promise<boolean> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<boolean>('openTask', { task_id: taskId })
    return result
  }

  function clearCurrentTask(): void {
    currentTask.value = null
    error.value = null
  }

  return {
    currentTask,
    isLoading,
    error,
    fetchTask,
    createTask,
    updateTask,
    closeTask,
    openTask,
    clearCurrentTask
  }
})
