<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSubtasksStore } from '@/stores/subtasks'
import { useToast } from '@/stores/toast'
import type { Subtask } from '@/types'

const props = defineProps<{
  taskId: number
}>()

const emit = defineEmits<{
  updated: []
}>()

const { t } = useI18n()
const toast = useToast()
const subtasksStore = useSubtasksStore()

const newSubtaskTitle = ref('')
const isAdding = ref(false)
const isSubmitting = ref(false)

const getStatusLabel = (status: number): string => {
  if (status === 0) return t('subtask.todo')
  if (status === 1) return t('subtask.inProgress')
  return t('subtask.done')
}

const statusClasses: Record<number, string> = {
  0: 'bg-gray-100 text-gray-600',
  1: 'bg-blue-100 text-blue-700',
  2: 'bg-green-100 text-green-700'
}

const getNextStatus = (current: 0 | 1 | 2): 0 | 1 | 2 => {
  if (current === 0) return 1
  if (current === 1) return 2
  return 0
}

onMounted(() => {
  subtasksStore.fetchSubtasks(props.taskId)
})

watch(() => props.taskId, (newId) => {
  if (newId) {
    subtasksStore.fetchSubtasks(newId)
  }
})

const handleStatusClick = async (subtask: Subtask) => {
  const nextStatus = getNextStatus(subtask.status)
  try {
    await subtasksStore.updateSubtaskStatus(subtask.id, nextStatus)
    await subtasksStore.fetchSubtasks(props.taskId)
    emit('updated')
  } catch (error) {
    console.error('Failed to update subtask status:', error)
    toast.error(t('subtask.updateStatusFailed'))
  }
}

const handleAddSubtask = async () => {
  if (!newSubtaskTitle.value.trim() || isSubmitting.value) return

  isSubmitting.value = true
  try {
    await subtasksStore.createSubtask(props.taskId, newSubtaskTitle.value.trim())
    await subtasksStore.fetchSubtasks(props.taskId)
    newSubtaskTitle.value = ''
    isAdding.value = false
    emit('updated')
  } catch (error) {
    console.error('Failed to create subtask:', error)
    toast.error(t('subtask.createFailed'))
  } finally {
    isSubmitting.value = false
  }
}

const handleRemoveSubtask = async (subtaskId: number) => {
  if (!confirm(t('subtask.confirmRemove'))) return

  try {
    await subtasksStore.removeSubtask(subtaskId)
    await subtasksStore.fetchSubtasks(props.taskId)
    emit('updated')
  } catch (error) {
    console.error('Failed to remove subtask:', error)
    toast.error(t('subtask.removeFailed'))
  }
}

const cancelAdd = () => {
  isAdding.value = false
  newSubtaskTitle.value = ''
}
</script>

<template>
  <div class="space-y-3">
    <!-- Header with progress -->
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-medium text-gray-700">
        {{ t('subtask.title') }}
        <span v-if="subtasksStore.totalCount > 0" class="text-gray-400">
          ({{ subtasksStore.completedCount }}/{{ subtasksStore.totalCount }})
        </span>
      </h3>
      <button
        v-if="!isAdding"
        @click="isAdding = true"
        class="text-sm text-blue-600 hover:text-blue-800"
      >
        + {{ t('common.add') }}
      </button>
    </div>

    <!-- Progress bar -->
    <div v-if="subtasksStore.totalCount > 0" class="w-full bg-gray-200 rounded-full h-2">
      <div
        class="bg-green-500 h-2 rounded-full transition-all duration-300"
        :style="{ width: `${subtasksStore.progressPercentage}%` }"
      ></div>
    </div>

    <!-- Loading -->
    <div v-if="subtasksStore.isLoading" class="text-center py-2">
      <ph-icon icon="spinner" class="animate-spin h-5 w-5 text-blue-600 mx-auto" />
    </div>

    <!-- Subtasks list -->
    <div v-else class="space-y-2">
      <div
        v-for="subtask in subtasksStore.subtasks"
        :key="subtask.id"
        class="flex items-center gap-2 group"
      >
        <!-- Status toggle button -->
        <button
          @click="handleStatusClick(subtask)"
          :class="[
            'px-2 py-0.5 text-xs rounded transition-colors',
            statusClasses[subtask.status]
          ]"
          :title="t('subtask.clickToToggleStatus', { status: getStatusLabel(subtask.status) })"
        >
          {{ getStatusLabel(subtask.status) }}
        </button>

        <!-- Title -->
        <span
          :class="[
            'flex-1 text-sm',
            subtask.status === 2 ? 'text-gray-400 line-through' : 'text-gray-700'
          ]"
        >
          {{ subtask.title }}
        </span>

        <!-- Delete button -->
        <button
          @click.stop="handleRemoveSubtask(subtask.id)"
          class="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
          :title="t('subtask.remove')"
        >
          <ph-icon icon="xmark" class="w-4 h-4" />
        </button>
      </div>

      <!-- Empty state -->
      <div
        v-if="subtasksStore.subtasks.length === 0 && !isAdding"
        class="text-center py-4 text-gray-400 text-sm"
      >
        {{ t('subtask.noSubtasks') }}
      </div>

      <!-- Add subtask form -->
      <div v-if="isAdding" class="flex items-center gap-2">
        <input
          v-model="newSubtaskTitle"
          type="text"
          :placeholder="t('subtask.enterTitle')"
          class="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          :disabled="isSubmitting"
          @keyup.enter="handleAddSubtask"
          @keyup.escape="cancelAdd"
        />
        <button
          @click="handleAddSubtask"
          :disabled="!newSubtaskTitle.trim() || isSubmitting"
          class="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {{ t('common.add') }}
        </button>
        <button
          @click="cancelAdd"
          :disabled="isSubmitting"
          class="px-2 py-1 text-sm text-gray-600 hover:text-gray-800"
        >
          {{ t('common.cancel') }}
        </button>
      </div>
    </div>
  </div>
</template>
