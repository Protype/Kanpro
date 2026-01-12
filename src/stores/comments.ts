import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import type { Comment } from '@/types'

export const useCommentsStore = defineStore('comments', () => {
  const comments = ref<Comment[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const commentsCount = computed(() => comments.value.length)

  async function fetchComments(taskId: number): Promise<void> {
    const authStore = useAuthStore()

    isLoading.value = true
    error.value = null

    try {
      const client = authStore.getClient()
      const result = await client.call<Comment[]>('getAllComments', { task_id: taskId })
      comments.value = result || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : '載入評論失敗'
      comments.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function createComment(taskId: number, content: string): Promise<number> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const commentId = await client.call<number>('createComment', {
      task_id: taskId,
      content
    })
    return commentId
  }

  async function updateComment(commentId: number, content: string): Promise<boolean> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<boolean>('updateComment', {
      id: commentId,
      content
    })
    return result
  }

  async function removeComment(commentId: number): Promise<boolean> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<boolean>('removeComment', {
      comment_id: commentId
    })
    return result
  }

  function clearComments(): void {
    comments.value = []
    error.value = null
  }

  return {
    comments,
    isLoading,
    error,
    commentsCount,
    fetchComments,
    createComment,
    updateComment,
    removeComment,
    clearComments
  }
})
