<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationsStore } from '@/stores/notifications'
import type { Activity } from '@/types'

const router = useRouter()
const notificationsStore = useNotificationsStore()

const isOpen = ref(false)
let pollInterval: ReturnType<typeof setInterval> | null = null

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

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const closeDropdown = () => {
  isOpen.value = false
}

const handleActivityClick = (activity: Activity) => {
  notificationsStore.markAsRead(activity.id)
  if (activity.task_id && activity.project_id) {
    router.push({
      name: 'board',
      params: { projectId: activity.project_id },
      query: { task: activity.task_id.toString() }
    })
  }
  closeDropdown()
}

const handleMarkAllAsRead = () => {
  notificationsStore.markAllAsRead()
}

const startPolling = () => {
  pollInterval = setInterval(() => {
    notificationsStore.fetchActivities()
  }, 60000) // 60 seconds
}

const stopPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('[data-notifications-dropdown]')) {
    closeDropdown()
  }
}

onMounted(async () => {
  notificationsStore.loadReadIds()
  await notificationsStore.fetchActivities()
  startPolling()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  stopPolling()
  document.removeEventListener('click', handleClickOutside)
})

watch(() => isOpen.value, (open) => {
  if (open) {
    notificationsStore.fetchActivities()
  }
})
</script>

<template>
  <div class="relative" data-notifications-dropdown>
    <!-- Notification Button -->
    <button
      data-testid="notifications-btn"
      @click.stop="toggleDropdown"
      class="relative p-2 text-content-secondary hover:text-content hover:bg-surface-hover rounded-full transition-colors"
      title="通知"
    >
      <!-- Bell Icon -->
      <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>

      <!-- Unread Badge -->
      <span
        v-if="notificationsStore.unreadCount > 0"
        data-testid="unread-badge"
        class="absolute -top-1 -right-1 bg-error text-content-inverse text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
      >
        {{ notificationsStore.unreadCount > 99 ? '99+' : notificationsStore.unreadCount }}
      </span>
    </button>

    <!-- Dropdown Panel -->
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        data-testid="notifications-dropdown"
        class="absolute right-0 mt-2 w-80 bg-surface rounded-lg shadow-lg ring-1 ring-edge overflow-hidden z-50"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-edge bg-surface-secondary">
          <h3 class="text-sm font-semibold text-content">通知</h3>
          <button
            v-if="notificationsStore.unreadCount > 0"
            @click="handleMarkAllAsRead"
            class="text-xs text-accent hover:text-accent-hover"
          >
            全部標為已讀
          </button>
        </div>

        <!-- Loading -->
        <div v-if="notificationsStore.isLoading" class="px-4 py-8 text-center">
          <svg class="animate-spin h-6 w-6 text-accent mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>

        <!-- Activity List -->
        <div v-else class="max-h-96 overflow-y-auto">
          <div
            v-for="activity in notificationsStore.activities"
            :key="activity.id"
            @click="handleActivityClick(activity)"
            :class="[
              'px-4 py-3 cursor-pointer hover:bg-surface-hover border-b border-edge last:border-b-0 transition-colors',
              notificationsStore.isRead(activity.id) ? 'bg-surface' : 'bg-accent-light'
            ]"
          >
            <div class="flex items-start gap-3">
              <!-- Activity Icon -->
              <div
                :class="[
                  'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                  notificationsStore.isRead(activity.id) ? 'bg-surface-tertiary text-content-secondary' : 'bg-accent/20 text-accent'
                ]"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <p class="text-sm text-content">
                  <span class="font-medium">{{ getEventLabel(activity.event_name) }}</span>
                  <span v-if="getTaskTitle(activity)" class="text-content-secondary">
                    : {{ getTaskTitle(activity) }}
                  </span>
                </p>
                <p class="text-xs text-content-tertiary mt-1">
                  {{ formatDate(activity.date_creation) }}
                </p>
              </div>

              <!-- Unread Indicator -->
              <div
                v-if="!notificationsStore.isRead(activity.id)"
                class="flex-shrink-0 w-2 h-2 bg-accent rounded-full"
              ></div>
            </div>
          </div>

          <!-- Empty State -->
          <div
            v-if="notificationsStore.activities.length === 0 && !notificationsStore.isLoading"
            class="px-4 py-8 text-center text-content-secondary text-sm"
          >
            沒有通知
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
