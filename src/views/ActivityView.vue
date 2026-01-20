<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
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
const notificationsStore = useNotificationsStore()
const projectsStore = useProjectsStore()

const isLoading = ref(false)
const activities = ref<Activity[]>([])
const error = ref<string | null>(null)

const eventLabels: Record<string, string> = {
  'task.create': '建立任務',
  'task.update': '更新任務',
  'task.close': '關閉任務',
  'task.open': '開啟任務',
  'task.move.column': '移動任務欄位',
  'task.move.swimlane': '移動任務泳道',
  'task.move.position': '調整任務位置',
  'task.assignee_change': '變更指派人',
  'comment.create': '新增評論',
  'comment.update': '更新評論',
  'comment.delete': '刪除評論',
  'subtask.create': '新增子任務',
  'subtask.update': '更新子任務',
  'subtask.delete': '刪除子任務',
  'task_file.create': '上傳附件',
  'task_internal_link.create_update': '建立任務連結',
  'task_internal_link.delete': '刪除任務連結'
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
    // Show all activities without filtering
    activities.value = notificationsStore.activities
  } catch (e) {
    error.value = e instanceof Error ? e.message : '載入動態失敗'
  } finally {
    isLoading.value = false
  }
}

const getEventLabel = (eventName: string): string => {
  return eventLabels[eventName] || eventName
}

const getProjectName = (projectId: number): string => {
  const project = projectsStore.projects.find(p => p.id === projectId)
  return project?.name || `專案 #${projectId}`
}

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '剛剛'
  if (diffMins < 60) return `${diffMins} 分鐘前`
  if (diffHours < 24) return `${diffHours} 小時前`
  if (diffDays < 7) return `${diffDays} 天前`

  return date.toLocaleDateString('zh-TW')
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
        <h1 class="text-2xl font-bold text-content">動態總覽</h1>
        <p class="text-content-secondary mt-1">所有專案的最近活動</p>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="flex justify-center py-12">
        <ph-icon icon="spinner" class="animate-spin h-8 w-8 text-accent" />
      </div>

      <!-- Error -->
      <div v-else-if="error" class="bg-error/10 border border-error/20 rounded-lg p-4 text-error">
        {{ error }}
        <button @click="loadData" class="ml-4 underline cursor-pointer">重試</button>
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
          <p class="text-content-secondary">沒有近期活動</p>
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
