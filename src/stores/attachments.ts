import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import type { TaskFile } from '@/types'

export const useAttachmentsStore = defineStore('attachments', () => {
  const attachments = ref<TaskFile[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const attachmentsCount = computed(() => attachments.value.length)
  const imageAttachments = computed(() => attachments.value.filter(a => a.is_image))

  async function fetchAttachments(taskId: number): Promise<void> {
    const authStore = useAuthStore()

    isLoading.value = true
    error.value = null

    try {
      const client = authStore.getClient()
      const result = await client.call<TaskFile[]>('getAllTaskFiles', { task_id: taskId })
      attachments.value = result || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : '載入附件失敗'
      attachments.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function uploadAttachment(
    taskId: number,
    projectId: number,
    filename: string,
    blob: string
  ): Promise<number> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const fileId = await client.call<number>('createTaskFile', {
      project_id: projectId,
      task_id: taskId,
      filename,
      blob
    })
    return fileId
  }

  async function downloadAttachment(fileId: number): Promise<string> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<string>('downloadTaskFile', { file_id: fileId })
    return result
  }

  async function removeAttachment(fileId: number): Promise<boolean> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<boolean>('removeTaskFile', { file_id: fileId })
    return result
  }

  function clearAttachments(): void {
    attachments.value = []
    error.value = null
  }

  return {
    attachments,
    isLoading,
    error,
    attachmentsCount,
    imageAttachments,
    fetchAttachments,
    uploadAttachment,
    downloadAttachment,
    removeAttachment,
    clearAttachments
  }
})
