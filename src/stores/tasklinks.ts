import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import type { TaskLink } from '@/types'

export const useTaskLinksStore = defineStore('tasklinks', () => {
  const taskLinks = ref<TaskLink[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const linksCount = computed(() => taskLinks.value.length)

  async function fetchTaskLinks(taskId: number): Promise<void> {
    const authStore = useAuthStore()

    isLoading.value = true
    error.value = null

    try {
      const client = authStore.getClient()
      const result = await client.call<TaskLink[]>('getAllTaskLinks', { task_id: taskId })
      taskLinks.value = result || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : '載入任務連結失敗'
      taskLinks.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function createTaskLink(
    taskId: number,
    oppositeTaskId: number,
    linkId: number
  ): Promise<number> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<number>('createTaskLink', {
      task_id: taskId,
      opposite_task_id: oppositeTaskId,
      link_id: linkId
    })
    return result
  }

  async function removeTaskLink(taskLinkId: number): Promise<boolean> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<boolean>('removeTaskLink', { task_link_id: taskLinkId })
    return result
  }

  function clearTaskLinks(): void {
    taskLinks.value = []
    error.value = null
  }

  return {
    taskLinks,
    isLoading,
    error,
    linksCount,
    fetchTaskLinks,
    createTaskLink,
    removeTaskLink,
    clearTaskLinks
  }
})
