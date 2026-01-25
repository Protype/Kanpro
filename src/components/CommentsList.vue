<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCommentsStore } from '@/stores/comments'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/stores/toast'
import UserAvatar from '@/components/UserAvatar.vue'
import type { Comment } from '@/types'

const props = defineProps<{
  taskId: number
}>()

const emit = defineEmits<{
  updated: []
}>()

const { t } = useI18n()
const toast = useToast()
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
    toast.error(t('comment.createFailed'))
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
    toast.error(t('comment.updateFailed'))
  } finally {
    isSubmitting.value = false
  }
}

const handleRemoveComment = async (commentId: number) => {
  if (!confirm(t('comment.confirmRemove'))) return

  try {
    await commentsStore.removeComment(commentId)
    await commentsStore.fetchComments(props.taskId)
    emit('updated')
  } catch (error) {
    console.error('Failed to remove comment:', error)
    toast.error(t('comment.removeFailed'))
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
        {{ t('comment.title') }}
        <span v-if="commentsStore.commentsCount > 0" class="text-gray-400">
          ({{ commentsStore.commentsCount }})
        </span>
      </h3>
      <button
        v-if="!isAdding"
        @click="isAdding = true"
        class="text-sm text-blue-600 hover:text-blue-800"
      >
        + {{ t('comment.addComment') }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="commentsStore.isLoading" class="text-center py-4">
      <ph-icon icon="spinner" class="animate-spin h-5 w-5 text-blue-600 mx-auto" />
    </div>

    <!-- Comments list -->
    <div v-else class="space-y-4">
      <!-- Add comment form -->
      <div v-if="isAdding" class="bg-gray-50 rounded-lg p-3 space-y-2">
        <textarea
          v-model="newCommentContent"
          rows="3"
          :placeholder="t('comment.enterContent')"
          class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          :disabled="isSubmitting"
        ></textarea>
        <div class="flex gap-2 justify-end">
          <button
            @click="cancelAdd"
            :disabled="isSubmitting"
            class="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            @click="handleAddComment"
            :disabled="!newCommentContent.trim() || isSubmitting"
            class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {{ t('comment.publish') }}
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
            <!-- Avatar -->
            <UserAvatar :name="comment.name || comment.username" size="md" />
            <div>
              <span class="text-sm font-medium text-gray-900">
                {{ comment.name || comment.username || t('comment.unknownUser') }}
              </span>
              <span class="text-xs text-gray-500 ml-2">
                {{ formatDate(comment.date_creation) }}
              </span>
              <span v-if="comment.date_modification" class="text-xs text-gray-400 ml-1">
                {{ t('comment.edited') }}
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div v-if="canEditComment(comment)" class="flex gap-1">
            <button
              v-if="editingCommentId !== comment.id"
              @click="startEditing(comment)"
              class="text-gray-400 hover:text-gray-600 p-1"
              :title="t('comment.edit')"
            >
              <ph-icon icon="pen-to-square" class="w-4 h-4" />
            </button>
            <button
              @click="handleRemoveComment(comment.id)"
              class="text-gray-400 hover:text-red-500 p-1"
              :title="t('comment.remove')"
            >
              <ph-icon icon="trash" class="w-4 h-4" />
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
              {{ t('common.cancel') }}
            </button>
            <button
              @click="handleUpdateComment(comment.id)"
              :disabled="!editingContent.trim() || isSubmitting"
              class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {{ t('common.save') }}
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
        {{ t('comment.noComments') }}
      </div>
    </div>
  </div>
</template>
