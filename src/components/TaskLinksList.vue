<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTaskLinksStore } from '@/stores/tasklinks'
import { useTasksStore } from '@/stores/tasks'
import { useToast } from '@/stores/toast'
import type { Task } from '@/types'

const props = defineProps<{
  taskId: number
  projectId: number
}>()

const emit = defineEmits<{
  updated: []
  selectTask: [taskId: number]
}>()

const { t } = useI18n()
const toast = useToast()
const taskLinksStore = useTaskLinksStore()
const tasksStore = useTasksStore()

const isAdding = ref(false)
const isSubmitting = ref(false)
const selectedTaskId = ref<number | null>(null)
const selectedLinkType = ref(1) // Default link type

// Link types (Kanboard default)
const linkTypes = computed(() => [
  { id: 1, label: t('link.relatesTo') },
  { id: 2, label: t('link.blocks') },
  { id: 3, label: t('link.isBlockedBy') },
  { id: 4, label: t('link.duplicates') },
  { id: 5, label: t('link.isChildOf') },
  { id: 6, label: t('link.isParentOf') },
  { id: 7, label: t('link.targets') },
  { id: 8, label: t('link.isTargetOf') }
])

// Get available tasks for linking (exclude current task and already linked tasks)
const availableTasks = ref<Task[]>([])

const fetchAvailableTasks = async () => {
  await tasksStore.fetchAllTasks(props.projectId)
  const linkedTaskIds = taskLinksStore.taskLinks.map(link => link.opposite_task_id)
  availableTasks.value = tasksStore.allTasks.filter(
    task => task.id !== props.taskId && !linkedTaskIds.includes(task.id)
  )
}

const getLinkTypeLabel = (linkId: number): string => {
  const linkType = linkTypes.value.find(lt => lt.id === linkId)
  return linkType?.label || t('link.relatesTo')
}

const getLinkedTask = (oppositeTaskId: number): Task | undefined => {
  return tasksStore.allTasks.find(task => task.id === oppositeTaskId)
}

onMounted(async () => {
  await taskLinksStore.fetchTaskLinks(props.taskId)
  await fetchAvailableTasks()
})

watch(() => props.taskId, async (newId) => {
  if (newId) {
    await taskLinksStore.fetchTaskLinks(newId)
    await fetchAvailableTasks()
  }
})

const startAdding = async () => {
  await fetchAvailableTasks()
  isAdding.value = true
}

const cancelAdding = () => {
  isAdding.value = false
  selectedTaskId.value = null
  selectedLinkType.value = 1
}

const handleAddLink = async () => {
  if (!selectedTaskId.value || isSubmitting.value) return

  isSubmitting.value = true
  try {
    await taskLinksStore.createTaskLink(props.taskId, selectedTaskId.value, selectedLinkType.value)
    await taskLinksStore.fetchTaskLinks(props.taskId)
    await fetchAvailableTasks()
    cancelAdding()
    emit('updated')
  } catch (error) {
    console.error('Failed to create task link:', error)
    toast.error(t('link.createFailed'))
  } finally {
    isSubmitting.value = false
  }
}

const handleRemoveLink = async (taskLinkId: number) => {
  if (!confirm(t('link.confirmRemove'))) return

  try {
    await taskLinksStore.removeTaskLink(taskLinkId)
    await taskLinksStore.fetchTaskLinks(props.taskId)
    await fetchAvailableTasks()
    emit('updated')
  } catch (error) {
    console.error('Failed to remove task link:', error)
    toast.error(t('link.removeFailed'))
  }
}

const handleClickTask = (taskId: number) => {
  emit('selectTask', taskId)
}
</script>

<template>
  <div class="space-y-3">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-medium text-gray-700">
        {{ t('link.title') }}
        <span v-if="taskLinksStore.linksCount > 0" class="text-gray-400">
          ({{ taskLinksStore.linksCount }})
        </span>
      </h3>
      <button
        v-if="!isAdding"
        @click="startAdding"
        class="text-sm text-blue-600 hover:text-blue-800"
      >
        + {{ t('common.add') }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="taskLinksStore.isLoading" class="text-center py-2">
      <ph-icon icon="spinner" class="animate-spin h-5 w-5 text-blue-600 mx-auto" />
    </div>

    <div v-else class="space-y-2">
      <!-- Add link form -->
      <div v-if="isAdding" class="bg-gray-50 rounded-lg p-3 space-y-2">
        <div class="space-y-2">
          <select
            v-model="selectedLinkType"
            class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option v-for="linkType in linkTypes" :key="linkType.id" :value="linkType.id">
              {{ linkType.label }}
            </option>
          </select>
          <select
            v-model="selectedTaskId"
            class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option :value="null" disabled>{{ t('link.selectTask') }}</option>
            <option v-for="task in availableTasks" :key="task.id" :value="task.id">
              #{{ task.id }} - {{ task.title }}
            </option>
          </select>
        </div>
        <div class="flex gap-2 justify-end">
          <button
            @click="cancelAdding"
            :disabled="isSubmitting"
            class="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            @click="handleAddLink"
            :disabled="!selectedTaskId || isSubmitting"
            class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {{ t('common.add') }}
          </button>
        </div>
      </div>

      <!-- Link items -->
      <div
        v-for="link in taskLinksStore.taskLinks"
        :key="link.id"
        class="flex items-center gap-2 p-2 bg-gray-50 rounded-lg group"
      >
        <!-- Link type badge -->
        <span class="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
          {{ getLinkTypeLabel(link.link_id) }}
        </span>

        <!-- Linked task -->
        <div class="flex-1 min-w-0">
          <button
            @click="handleClickTask(link.opposite_task_id)"
            class="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate block"
          >
            <template v-if="getLinkedTask(link.opposite_task_id)">
              #{{ link.opposite_task_id }} - {{ getLinkedTask(link.opposite_task_id)?.title }}
            </template>
            <template v-else>
              #{{ link.opposite_task_id }}
            </template>
          </button>
        </div>

        <!-- Delete button -->
        <button
          @click="handleRemoveLink(link.id)"
          class="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          :title="t('link.remove')"
        >
          <ph-icon icon="xmark" class="w-4 h-4" />
        </button>
      </div>

      <!-- Empty state -->
      <div
        v-if="taskLinksStore.taskLinks.length === 0 && !isAdding"
        class="text-center py-4 text-gray-400 text-sm"
      >
        {{ t('link.noLinks') }}
      </div>
    </div>
  </div>
</template>
