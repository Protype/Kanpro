<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationsStore } from '@/stores/notifications'
import type { Activity } from '@/types'

const router = useRouter()
const notificationsStore = useNotificationsStore()

const isOpen = ref(false)
let pollInterval: ReturnType<typeof setInterval> | null = null

// Settings Storage Key (與 AdminSettingsView 相同)
const SETTINGS_KEY = 'kanpro_settings'

// 讀取通知檢查間隔設定
function getNotificationCheckInterval(): number {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (saved) {
      const settings = JSON.parse(saved)
      return settings.notificationCheckInterval ?? 300
    }
  } catch {
    // 使用預設值
  }
  return 300 // 預設 5 分鐘
}

// 檢查桌面通知是否啟用
function isDesktopNotificationsEnabled(): boolean {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (saved) {
      const settings = JSON.parse(saved)
      return settings.enableDesktopNotifications ?? false
    }
  } catch {
    // 使用預設值
  }
  return false
}

// 發送桌面通知
function sendDesktopNotification(activity: Activity): void {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  if (!isDesktopNotificationsEnabled()) return

  const title = getEventLabel(activity.event_name)
  const taskTitle = getTaskTitle(activity)
  const body = taskTitle ? `${taskTitle}` : '您有新的通知'

  const notification = new Notification(title, {
    body,
    icon: '/favicon.ico',
    tag: `kanpro-${activity.id}` // 避免重複通知
  })

  notification.onclick = () => {
    window.focus()
    if (activity.task_id && activity.project_id) {
      router.push({
        name: 'board',
        params: { projectId: activity.project_id },
        query: { task: activity.task_id.toString() }
      })
    }
    notification.close()
  }
}

// 追蹤已處理過的活動 ID（避免重複發送桌面通知）
const processedActivityIds = new Set<number>()

const eventLabels: Record<string, string> = {
  'task.create': '建立任務',
  'task.update': '更新任務',
  'task.close': '關閉任務',
  'task.open': '開啟任務',
  'task.move.column': '移動任務清單',
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

// 檢查並發送新通知的桌面通知
async function checkAndNotify(): Promise<void> {
  const previousIds = new Set(notificationsStore.activities.map(a => a.id))
  await notificationsStore.fetchActivities()

  // 找出新的未讀活動並發送桌面通知
  for (const activity of notificationsStore.activities) {
    if (
      !previousIds.has(activity.id) &&
      !notificationsStore.isRead(activity.id) &&
      !processedActivityIds.has(activity.id)
    ) {
      processedActivityIds.add(activity.id)
      sendDesktopNotification(activity)
    }
  }

  // 清理過舊的 processedActivityIds（保留最近 1000 筆）
  if (processedActivityIds.size > 1000) {
    const idsToKeep = notificationsStore.activities.map(a => a.id)
    processedActivityIds.clear()
    idsToKeep.forEach(id => processedActivityIds.add(id))
  }
}

const startPolling = () => {
  stopPolling() // 先停止現有輪詢

  const intervalSeconds = getNotificationCheckInterval()
  if (intervalSeconds === 0) return // 停用輪詢

  const intervalMs = intervalSeconds * 1000

  // 通知檢查在背景分頁也持續運作（不受 page visibility 影響）
  pollInterval = setInterval(() => {
    checkAndNotify()
  }, intervalMs)
}

const stopPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

// 監聽設定變更（透過 storage 事件）
const handleStorageChange = (event: StorageEvent) => {
  if (event.key === SETTINGS_KEY) {
    // 設定變更時重新啟動輪詢
    startPolling()
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

  // 初始化已處理活動 ID（避免首次載入時發送舊通知）
  notificationsStore.activities.forEach(a => processedActivityIds.add(a.id))

  startPolling()
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('storage', handleStorageChange)
})

onUnmounted(() => {
  stopPolling()
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('storage', handleStorageChange)
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
      class="relative p-2 text-content-tertiary hover:text-content hover:bg-surface-hover rounded-lg transition-colors"
      title="通知"
    >
      <!-- Bell Icon -->
      <ph-icon icon="bell" class="w-5 h-5" />

      <!-- Unread Badge -->
      <span
        v-if="notificationsStore.unreadCount > 0"
        data-testid="unread-badge"
        class="absolute -top-0.5 -right-0.5 bg-error text-content-inverse text-xs font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1 text-[10px]"
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
          <ph-icon icon="spinner" class="animate-spin h-6 w-6 text-accent mx-auto" />
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
                <ph-icon icon="clipboard-list" class="w-4 h-4" />
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
