<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBoardStore } from '@/stores/board'
import { useNotificationsStore } from '@/stores/notifications'
import UserAvatar from '@/components/UserAvatar.vue'
import SearchModal from '@/components/SearchModal.vue'
import type { Activity, Task } from '@/types'

defineProps<{
  showSearchModal?: boolean
}>()

const emit = defineEmits<{
  'close-search-modal': []
}>()

const route = useRoute()
const router = useRouter()
const boardStore = useBoardStore()
const notificationsStore = useNotificationsStore()

const projectId = ref(Number(route.params.id))
const isLoading = ref(false)
const activities = ref<Activity[]>([])
const error = ref<string | null>(null)

const eventLabels: Record<string, string> = {
  'task.create': '建立了任務',
  'task.update': '更新了任務',
  'task.close': '關閉了任務',
  'task.open': '重新開啟了任務',
  'task.move.column': '移動了任務至',
  'task.move.swimlane': '將任務移至泳道',
  'task.move.position': '調整了任務位置',
  'task.assignee_change': '變更了任務指派人',
  'comment.create': '發表了評論於',
  'comment.update': '更新了評論於',
  'comment.delete': '刪除了評論於',
  'subtask.create': '新增了子任務',
  'subtask.update': '更新了子任務',
  'subtask.delete': '刪除了子任務',
  'task_file.create': '上傳了附件至',
  'task_internal_link.create_update': '建立了任務連結',
  'task_internal_link.delete': '刪除了任務連結'
}

watch(() => route.params.id, async (newId) => {
  if (newId) {
    projectId.value = Number(newId)
    await loadData()
  }
})

onMounted(async () => {
  await loadData()
})

const loadData = async () => {
  isLoading.value = true
  error.value = null
  try {
    if (!boardStore.project || boardStore.project.id !== projectId.value) {
      await boardStore.fetchBoard(projectId.value)
    }
    await notificationsStore.fetchActivities()
    activities.value = notificationsStore.activities.filter(
      a => a.project_id === projectId.value
    )
  } catch (e) {
    error.value = e instanceof Error ? e.message : '載入專案動態失敗'
  } finally {
    isLoading.value = false
  }
}

const getEventLabel = (eventName: string): string => {
  return eventLabels[eventName] || eventName
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

  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Helper to safely extract nested data from activity
function getActivityTaskData(activity: Activity): Record<string, unknown> | null {
  if (activity.data?.task && typeof activity.data.task === 'object') {
    return activity.data.task as Record<string, unknown>
  }
  return null
}

function getActivityCommentData(activity: Activity): Record<string, unknown> | null {
  if (activity.data?.comment && typeof activity.data.comment === 'object') {
    return activity.data.comment as Record<string, unknown>
  }
  return null
}

function getTaskTitle(activity: Activity): string {
  const task = getActivityTaskData(activity)
  if (task?.title && typeof task.title === 'string') return task.title
  return activity.task_id ? `#${activity.task_id}` : ''
}

function getAuthorName(activity: Activity): string {
  return activity.author_name || activity.author_username || '未知使用者'
}

function getAssigneeName(activity: Activity): string | null {
  const task = getActivityTaskData(activity)
  if (!task) return null
  const name = task.assignee_name || task.assignee_username
  return typeof name === 'string' ? name : null
}

function getColumnName(activity: Activity): string | null {
  const task = getActivityTaskData(activity)
  return task?.column_title && typeof task.column_title === 'string' ? task.column_title : null
}

function getCommentContent(activity: Activity): string | null {
  const comment = getActivityCommentData(activity)
  if (!comment?.comment || typeof comment.comment !== 'string') return null
  const content = comment.comment
  return content.length > 100 ? content.substring(0, 100) + '...' : content
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

// Event icon and color mappings
const eventIconMap: Record<string, string> = {
  'task.create': 'plus-circle',
  'task.close': 'check-circle',
  'task.open': 'rotate',
  'task.move': 'arrow-right',
  'task.assignee': 'user',
  'task.update': 'pencil',
  'comment': 'chat',
  'subtask': 'list-check',
  'task_file': 'paperclip',
  'task_internal_link': 'link'
}

const eventColorMap: Record<string, string> = {
  'task.create': 'text-success bg-success/10',
  'task.close': 'text-info bg-info/10',
  'task.open': 'text-warning bg-warning/10',
  'comment': 'text-accent bg-accent/10'
}

function getEventIcon(eventName: string): string {
  for (const [prefix, icon] of Object.entries(eventIconMap)) {
    if (eventName.startsWith(prefix)) return icon
  }
  return 'bolt'
}

function getEventIconColor(eventName: string): string {
  for (const [prefix, color] of Object.entries(eventColorMap)) {
    if (eventName.startsWith(prefix)) return color
  }
  return 'text-content-secondary bg-surface-tertiary'
}

// Group activities by date
const groupedActivities = computed(() => {
  const groups: { date: string; activities: Activity[] }[] = []
  const dateMap = new Map<string, Activity[]>()

  for (const activity of activities.value) {
    const date = new Date(activity.date_creation * 1000)
    const dateKey = date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, [])
    }
    dateMap.get(dateKey)!.push(activity)
  }

  for (const [date, acts] of dateMap) {
    groups.push({ date, activities: acts })
  }

  return groups
})
</script>

<template>
  <div class="h-full flex flex-col bg-surface-secondary overflow-auto">
    <div class="p-6">
      <!-- Loading -->
      <div v-if="isLoading" class="flex justify-center py-12">
        <ph-icon icon="spinner" class="animate-spin h-8 w-8 text-accent" />
      </div>

      <!-- Error -->
      <div v-else-if="error" class="bg-error/10 border border-error/20 rounded-lg p-4 text-error max-w-2xl mx-auto">
        {{ error }}
        <button @click="loadData" class="ml-4 underline">重試</button>
      </div>

      <!-- Activities Timeline -->
      <div v-else class="max-w-3xl mx-auto">
        <!-- Empty State -->
        <div v-if="activities.length === 0" class="card p-12 text-center">
          <ph-icon icon="bolt" class="w-16 h-16 mx-auto mb-4 text-content-tertiary" />
          <p class="text-content-secondary">沒有近期活動</p>
        </div>

        <!-- Grouped Activities -->
        <div v-else class="space-y-8">
          <div v-for="group in groupedActivities" :key="group.date">
            <!-- Date Header -->
            <div class="flex items-center gap-4 mb-4">
              <div class="h-px flex-1 bg-edge"></div>
              <span class="text-sm font-medium text-content-tertiary px-2">{{ group.date }}</span>
              <div class="h-px flex-1 bg-edge"></div>
            </div>

            <!-- Activities for this date -->
            <div class="space-y-3">
              <div
                v-for="activity in group.activities"
                :key="activity.id"
                @click="handleActivityClick(activity)"
                class="card p-4 cursor-pointer hover:bg-surface-hover transition-colors"
              >
                <div class="flex gap-4">
                  <!-- Icon -->
                  <div
                    :class="[
                      'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                      getEventIconColor(activity.event_name)
                    ]"
                  >
                    <ph-icon :icon="getEventIcon(activity.event_name)" class="w-5 h-5" />
                  </div>

                  <!-- Content -->
                  <div class="flex-1 min-w-0">
                    <!-- Main info line -->
                    <p class="text-content">
                      <span class="font-semibold">{{ getAuthorName(activity) }}</span>
                      <span class="text-content-secondary"> {{ getEventLabel(activity.event_name) }} </span>
                      <span v-if="getTaskTitle(activity)" class="font-medium text-accent">
                        {{ getTaskTitle(activity) }}
                      </span>
                    </p>

                    <!-- Additional context -->
                    <div class="mt-1 text-sm text-content-tertiary space-y-0.5">
                      <!-- Column info for move events -->
                      <p v-if="activity.event_name === 'task.move.column' && getColumnName(activity)">
                        <ph-icon icon="arrow-right" class="w-3.5 h-3.5 inline mr-1" />
                        欄位：{{ getColumnName(activity) }}
                      </p>

                      <!-- Assignee info -->
                      <p v-if="activity.event_name === 'task.assignee_change' && getAssigneeName(activity)">
                        <ph-icon icon="user" class="w-3.5 h-3.5 inline mr-1" />
                        指派給：{{ getAssigneeName(activity) }}
                      </p>

                      <!-- Comment preview -->
                      <p v-if="activity.event_name === 'comment.create' && getCommentContent(activity)" class="italic">
                        「{{ getCommentContent(activity) }}」
                      </p>
                    </div>

                    <!-- Timestamp -->
                    <p class="text-xs text-content-tertiary mt-2">
                      {{ formatDate(activity.date_creation) }}
                    </p>
                  </div>

                  <!-- Author avatar -->
                  <div class="flex-shrink-0">
                    <UserAvatar :name="getAuthorName(activity)" size="sm" />
                  </div>
                </div>
              </div>
            </div>
          </div>
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
