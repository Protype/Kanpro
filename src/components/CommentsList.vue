<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useCommentsStore } from '@/stores/comments'
import { useAuthStore } from '@/stores/auth'
import type { Comment } from '@/types'

const props = defineProps<{
  taskId: number
}>()

const emit = defineEmits<{
  updated: []
}>()

const commentsStore = useCommentsStore()
const authStore = useAuthStore()

const newCommentContent = ref('')
const isAdding = ref(false)
const isSubmitting = ref(false)
const editingCommentId = ref<number | null>(null)
const editingContent = ref('')

const currentUserId = computed(() => authStore.user?.id)

const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString('zh-TW')
}

onMounted(() => {
  commentsStore.fetchComments(props.taskId)
})

watch(() => props.taskId, (newId) => {
  if (newId) {
    commentsStore.fetchComments(newId)
  }
})

const handleAddComment = async () => {
  if (!newCommentContent.value.trim() || isSubmitting.value) return

  isSubmitting.value = true
  try {
    await commentsStore.createComment(props.taskId, newCommentContent.value.trim())
    await commentsStore.fetchComments(props.taskId)
    newCommentContent.value = ''
    isAdding.value = false
    emit('updated')
  } catch (error) {
    console.error('Failed to create comment:', error)
    alert('建立評論失敗')
  } finally {
    isSubmitting.value = false
  }
}

const startEditing = (comment: Comment) => {
  editingCommentId.value = comment.id
  editingContent.value = comment.comment
}

const cancelEditing = () => {
  editingCommentId.value = null
  editingContent.value = ''
}

const handleUpdateComment = async (commentId: number) => {
  if (!editingContent.value.trim() || isSubmitting.value) return

  isSubmitting.value = true
  try {
    await commentsStore.updateComment(commentId, editingContent.value.trim())
    await commentsStore.fetchComments(props.taskId)
    editingCommentId.value = null
    editingContent.value = ''
    emit('updated')
  } catch (error) {
    console.error('Failed to update comment:', error)
    alert('更新評論失敗')
  } finally {
    isSubmitting.value = false
  }
}

const handleRemoveComment = async (commentId: number) => {
  if (!confirm('確定要刪除此評論嗎？')) return

  try {
    await commentsStore.removeComment(commentId)
    await commentsStore.fetchComments(props.taskId)
    emit('updated')
  } catch (error) {
    console.error('Failed to remove comment:', error)
    alert('刪除評論失敗')
  }
}

const cancelAdd = () => {
  isAdding.value = false
  newCommentContent.value = ''
}

const canEditComment = (comment: Comment): boolean => {
  return comment.user_id === currentUserId.value
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-medium text-gray-700">
        評論
        <span v-if="commentsStore.commentsCount > 0" class="text-gray-400">
          ({{ commentsStore.commentsCount }})
        </span>
      </h3>
      <button
        v-if="!isAdding"
        @click="isAdding = true"
        class="text-sm text-blue-600 hover:text-blue-800"
      >
        + 新增評論
      </button>
    </div>

    <!-- Loading -->
    <div v-if="commentsStore.isLoading" class="text-center py-4">
      <svg class="animate-spin h-5 w-5 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <!-- Comments list -->
    <div v-else class="space-y-4">
      <!-- Add comment form -->
      <div v-if="isAdding" class="bg-gray-50 rounded-lg p-3 space-y-2">
        <textarea
          v-model="newCommentContent"
          rows="3"
          placeholder="輸入評論內容..."
          class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          :disabled="isSubmitting"
        ></textarea>
        <div class="flex gap-2 justify-end">
          <button
            @click="cancelAdd"
            :disabled="isSubmitting"
            class="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
          >
            取消
          </button>
          <button
            @click="handleAddComment"
            :disabled="!newCommentContent.trim() || isSubmitting"
            class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            發表
          </button>
        </div>
      </div>

      <!-- Comment items -->
      <div
        v-for="comment in commentsStore.comments"
        :key="comment.id"
        class="bg-white border border-gray-200 rounded-lg p-3"
      >
        <!-- Comment header -->
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <!-- Avatar placeholder -->
            <div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {{ (comment.name || comment.username || '?').charAt(0).toUpperCase() }}
            </div>
            <div>
              <span class="text-sm font-medium text-gray-900">
                {{ comment.name || comment.username || '未知使用者' }}
              </span>
              <span class="text-xs text-gray-500 ml-2">
                {{ formatDate(comment.date_creation) }}
              </span>
              <span v-if="comment.date_modification" class="text-xs text-gray-400 ml-1">
                (已編輯)
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div v-if="canEditComment(comment)" class="flex gap-1">
            <button
              v-if="editingCommentId !== comment.id"
              @click="startEditing(comment)"
              class="text-gray-400 hover:text-gray-600 p-1"
              title="編輯"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              @click="handleRemoveComment(comment.id)"
              class="text-gray-400 hover:text-red-500 p-1"
              title="刪除"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Comment content -->
        <div v-if="editingCommentId === comment.id" class="space-y-2">
          <textarea
            v-model="editingContent"
            rows="3"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            :disabled="isSubmitting"
          ></textarea>
          <div class="flex gap-2 justify-end">
            <button
              @click="cancelEditing"
              :disabled="isSubmitting"
              class="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              取消
            </button>
            <button
              @click="handleUpdateComment(comment.id)"
              :disabled="!editingContent.trim() || isSubmitting"
              class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              儲存
            </button>
          </div>
        </div>
        <div v-else class="text-sm text-gray-700 whitespace-pre-wrap">
          {{ comment.comment }}
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="commentsStore.comments.length === 0 && !isAdding"
        class="text-center py-6 text-gray-400 text-sm"
      >
        沒有評論
      </div>
    </div>
  </div>
</template>
