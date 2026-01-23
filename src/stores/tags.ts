import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import type { Tag } from '@/types'

export const useTagsStore = defineStore('tags', () => {
  const projectTags = ref<Tag[]>([])
  const taskTags = ref<string[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const tagsCount = computed(() => taskTags.value.length)

  async function fetchProjectTags(projectId: number): Promise<void> {
    const authStore = useAuthStore()

    isLoading.value = true
    error.value = null

    try {
      const client = authStore.getClient()
      const result = await client.call<Tag[]>('getTagsByProject', { project_id: projectId })
      projectTags.value = result || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : '載入專案標籤失敗'
      projectTags.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function fetchTaskTags(taskId: number): Promise<void> {
    const authStore = useAuthStore()

    isLoading.value = true
    error.value = null

    try {
      const client = authStore.getClient()
      const result = await client.call<string[]>('getTaskTags', { task_id: taskId })
      taskTags.value = result || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : '載入任務標籤失敗'
      taskTags.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function setTaskTags(taskId: number, projectId: number, tags: string[]): Promise<boolean> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<boolean>('setTaskTags', {
      project_id: projectId,
      task_id: taskId,
      tags
    })
    return result
  }

  function clearTags(): void {
    projectTags.value = []
    taskTags.value = []
    error.value = null
  }

  return {
    projectTags,
    taskTags,
    isLoading,
    error,
    tagsCount,
    fetchProjectTags,
    fetchTaskTags,
    setTaskTags,
    clearTags,
    // Aliases for backward compatibility
    tags: projectTags,
    fetchTags: fetchProjectTags
  }
})
