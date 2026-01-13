<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBoardStore } from '@/stores/board'
import { useNotificationsStore } from '@/stores/notifications'
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
    // Load project info if not loaded
    if (!boardStore.project || boardStore.project.id !== projectId.value) {
      await boardStore.fetchBoard(projectId.value)
    }
    // Load project activities
    await notificationsStore.fetchActivities()
    // Filter activities for this project
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
        <h1 class="text-2xl font-bold text-content">專案動態</h1>
        <p v-if="boardStore.project" class="text-content-secondary mt-1">
          {{ boardStore.project.name }} 的最近活動
        </p>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="flex justify-center py-12">
        <svg class="animate-spin h-8 w-8 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="bg-error/10 border border-error/20 rounded-lg p-4 text-error">
        {{ error }}
        <button @click="loadData" class="ml-4 underline">重試</button>
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
              <svg v-if="getEventIcon(activity.event_name) === 'plus'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <!-- Check Icon -->
              <svg v-else-if="getEventIcon(activity.event_name) === 'check'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <!-- Refresh Icon -->
              <svg v-else-if="getEventIcon(activity.event_name) === 'refresh'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <!-- Arrow Icon -->
              <svg v-else-if="getEventIcon(activity.event_name) === 'arrow'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              <!-- Chat Icon -->
              <svg v-else-if="getEventIcon(activity.event_name) === 'chat'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <!-- List Icon -->
              <svg v-else-if="getEventIcon(activity.event_name) === 'list'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <!-- Attachment Icon -->
              <svg v-else-if="getEventIcon(activity.event_name) === 'attachment'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <!-- Link Icon -->
              <svg v-else-if="getEventIcon(activity.event_name) === 'link'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <!-- Default Activity Icon -->
              <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
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
                {{ formatDate(activity.date_creation) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="activities.length === 0" class="bg-surface rounded-lg border border-edge p-12 text-center">
          <svg class="w-16 h-16 mx-auto mb-4 text-content-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
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
