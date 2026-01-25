<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useNotificationsStore } from '@/stores/notifications'
import { useProjectsStore } from '@/stores/projects'
import SearchModal from '@/components/SearchModal.vue'
import type { Activity, Task } from '@/types'

defineProps<{
  showSearchModal?: boolean
}>()

const emit = defineEmits<{
  'close-search-modal': []
}>()

const router = useRouter()
const { t } = useI18n()
const notificationsStore = useNotificationsStore()
const projectsStore = useProjectsStore()

const isLoading = ref(false)
const activities = ref<Activity[]>([])
const error = ref<string | null>(null)

const eventLabelKeys: Record<string, string> = {
  'task.create': 'activity.eventTaskCreate',
  'task.update': 'activity.eventTaskUpdate',
  'task.close': 'activity.eventTaskClose',
  'task.open': 'activity.eventTaskOpen',
  'task.move.column': 'activity.eventTaskMoveColumn',
  'task.move.swimlane': 'activity.eventTaskMoveSwimlane',
  'task.move.position': 'activity.eventTaskMovePosition',
  'task.assignee_change': 'activity.eventTaskAssigneeChange',
  'comment.create': 'activity.eventCommentCreate',
  'comment.update': 'activity.eventCommentUpdate',
  'comment.delete': 'activity.eventCommentDelete',
  'subtask.create': 'activity.eventSubtaskCreate',
  'subtask.update': 'activity.eventSubtaskUpdate',
  'subtask.delete': 'activity.eventSubtaskDelete',
  'task_file.create': 'activity.eventFileCreate',
  'task_internal_link.create_update': 'activity.eventLinkCreate',
  'task_internal_link.delete': 'activity.eventLinkDelete'
}

onMounted(async () => {
  // Load projects first for project name lookup
  if (projectsStore.projects.length === 0) {
    await projectsStore.fetchProjects()
  }
  await loadData()
})

const loadData = async () => {
  isLoading.value = true
  error.value = null
  try {
    await notificationsStore.fetchActivities()
    activities.value = notificationsStore.activities
  } catch (e) {
    error.value = e instanceof Error ? e.message : t('activity.loadFailed')
  } finally {
    isLoading.value = false
  }
}

const getEventLabel = (eventName: string): string => {
  const key = eventLabelKeys[eventName]
  return key ? t(key) : eventName
}

const getProjectName = (projectId: number): string => {
  const project = projectsStore.projects.find(p => p.id === projectId)
  return project?.name || t('task.projectNumber', { id: projectId })
}

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return t('time.justNow')
  if (diffMins < 60) return t('time.minutesAgo', { n: diffMins })
  if (diffHours < 24) return t('time.hoursAgo', { n: diffHours })
  if (diffDays < 7) return t('time.daysAgo', { n: diffDays })

  return date.toLocaleDateString()
}

const getTaskTitle = (activity: Activity): string => {
  if (activity.data?.task && typeof activity.data.task === 'object') {
    const task = activity.data.task as { title?: string }
    if (task.title) return task.title
  }
  return activity.task_id ? `#${activity.task_id}` : ''
}

const handleActivityClick = (activity: Activity) => {
  if (activity.task_id) {
    router.push({
      name: 'project-list',
      params: { id: activity.project_id },
      query: { task: activity.task_id.toString() }
    })
  }
}

const handleSearchSelect = (task: Task) => {
  router.push({
    name: 'project-list',
    params: { id: task.project_id },
    query: { task: task.id.toString() }
  })
  emit('close-search-modal')
}

const getEventIcon = (eventName: string): string => {
  if (eventName.startsWith('task.create')) return 'plus'
  if (eventName.startsWith('task.close')) return 'check'
  if (eventName.startsWith('task.open')) return 'refresh'
  if (eventName.startsWith('task.move')) return 'arrow'
  if (eventName.startsWith('comment')) return 'chat'
  if (eventName.startsWith('subtask')) return 'list'
  if (eventName.startsWith('task_file')) return 'attachment'
  if (eventName.startsWith('task_internal_link')) return 'link'
  return 'activity'
}
</script>

<template>
  <div class="p-6">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-content">{{ t('activity.activityOverview') }}</h1>
        <p class="text-content-secondary mt-1">{{ t('activity.activityOverviewDesc') }}</p>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="flex justify-center py-12">
        <ph-icon icon="spinner" class="animate-spin h-8 w-8 text-accent" />
      </div>

      <!-- Error -->
      <div v-else-if="error" class="bg-error/10 border border-error/20 rounded-lg p-4 text-error">
        {{ error }}
        <button @click="loadData" class="ml-4 underline cursor-pointer">{{ t('common.retry') }}</button>
      </div>

      <!-- Activities -->
      <div v-else class="space-y-4">
        <div
          v-for="activity in activities"
          :key="activity.id"
          @click="handleActivityClick(activity)"
          class="bg-surface rounded-lg border border-edge p-4 cursor-pointer hover:bg-surface-hover transition-colors"
        >
          <div class="flex items-start gap-4">
            <!-- Icon -->
            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <!-- Plus Icon -->
              <ph-icon v-if="getEventIcon(activity.event_name) === 'plus'" icon="plus" class="w-5 h-5" />
              <!-- Check Icon -->
              <ph-icon v-else-if="getEventIcon(activity.event_name) === 'check'" icon="check" class="w-5 h-5" />
              <!-- Refresh Icon -->
              <ph-icon v-else-if="getEventIcon(activity.event_name) === 'refresh'" icon="rotate" class="w-5 h-5" />
              <!-- Arrow Icon -->
              <ph-icon v-else-if="getEventIcon(activity.event_name) === 'arrow'" icon="arrow-right" class="w-5 h-5" />
              <!-- Chat Icon -->
              <ph-icon v-else-if="getEventIcon(activity.event_name) === 'chat'" icon="comment" class="w-5 h-5" />
              <!-- List Icon -->
              <ph-icon v-else-if="getEventIcon(activity.event_name) === 'list'" icon="clipboard-check" class="w-5 h-5" />
              <!-- Attachment Icon -->
              <ph-icon v-else-if="getEventIcon(activity.event_name) === 'attachment'" icon="paperclip" class="w-5 h-5" />
              <!-- Link Icon -->
              <ph-icon v-else-if="getEventIcon(activity.event_name) === 'link'" icon="link" class="w-5 h-5" />
              <!-- Default Activity Icon -->
              <ph-icon v-else icon="bolt" class="w-5 h-5" />
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <p class="text-content">
                <span class="font-medium">{{ getEventLabel(activity.event_name) }}</span>
                <span v-if="getTaskTitle(activity)" class="text-content-secondary">
                  : {{ getTaskTitle(activity) }}
                </span>
              </p>
              <p class="text-sm text-content-tertiary mt-1">
                <span class="text-accent">{{ getProjectName(activity.project_id) }}</span>
                <span class="mx-2">·</span>
                {{ formatDate(activity.date_creation) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="activities.length === 0" class="bg-surface rounded-lg border border-edge p-12 text-center">
          <ph-icon icon="bolt" class="w-16 h-16 mx-auto mb-4 text-content-tertiary" />
          <p class="text-content-secondary">{{ t('activity.noRecentActivity') }}</p>
        </div>
      </div>
    </div>

    <!-- Search Modal -->
    <SearchModal
      v-if="showSearchModal"
      @close="emit('close-search-modal')"
      @select="handleSearchSelect"
    />
  </div>
</template>
