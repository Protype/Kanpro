<template>
  <div class="h-full overflow-auto bg-surface-secondary">
    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="alert-error">
        <p>{{ error }}</p>
      </div>

      <!-- Analytics Content -->
      <div v-else class="space-y-8">
        <!-- Stats Overview -->
        <section class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="card p-6">
            <h3 class="text-sm font-medium text-content-tertiary">總活動數</h3>
            <p class="mt-2 text-3xl font-bold text-content">{{ activityStats.total }}</p>
          </div>
          <div class="card p-6">
            <h3 class="text-sm font-medium text-content-tertiary">建立任務</h3>
            <p class="mt-2 text-3xl font-bold text-success">{{ activityStats.taskCreated }}</p>
          </div>
          <div class="card p-6">
            <h3 class="text-sm font-medium text-content-tertiary">移動任務</h3>
            <p class="mt-2 text-3xl font-bold text-accent">{{ activityStats.taskMoved }}</p>
          </div>
          <div class="card p-6">
            <h3 class="text-sm font-medium text-content-tertiary">關閉任務</h3>
            <p class="mt-2 text-3xl font-bold text-info">{{ activityStats.taskClosed }}</p>
          </div>
        </section>

        <!-- Task Distribution -->
        <section class="card p-6">
          <h2 class="text-lg font-semibold text-content mb-4">任務分佈</h2>
          <div v-if="taskDistribution.length === 0" class="text-content-tertiary text-center py-8">
            沒有任務資料
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="item in taskDistribution"
              :key="item.column"
              class="flex items-center gap-4"
            >
              <span class="w-32 text-sm text-content-secondary">{{ item.column }}</span>
              <div class="flex-1 bg-surface-tertiary rounded-full h-6 overflow-hidden">
                <div
                  class="bg-accent h-full rounded-full transition-all duration-500"
                  :style="{ width: `${getDistributionPercentage(item.count)}%` }"
                ></div>
              </div>
              <span class="w-12 text-right text-sm font-medium text-content">{{ item.count }}</span>
            </div>
          </div>
        </section>

        <!-- User Workload -->
        <section class="card p-6">
          <h2 class="text-lg font-semibold text-content mb-4">成員工作量</h2>
          <div v-if="userWorkload.length === 0" class="text-content-tertiary text-center py-8">
            沒有成員資料
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="item in userWorkload"
              :key="item.username"
              class="flex items-center gap-4"
            >
              <span class="w-32 text-sm text-content-secondary truncate" :title="item.user">
                {{ item.user }}
              </span>
              <div class="flex-1 bg-surface-tertiary rounded-full h-6 overflow-hidden">
                <div
                  class="bg-success h-full rounded-full transition-all duration-500"
                  :style="{ width: `${getWorkloadPercentage(item.count)}%` }"
                ></div>
              </div>
              <span class="w-12 text-right text-sm font-medium text-content">{{ item.count }}</span>
            </div>
          </div>
        </section>

        <!-- Activity Timeline -->
        <section class="card p-6">
          <h2 class="text-lg font-semibold text-content mb-4">每日活動</h2>
          <div v-if="activityByDay.length === 0" class="text-content-tertiary text-center py-8">
            沒有活動資料
          </div>
          <div v-else class="overflow-x-auto">
            <div class="flex items-end gap-1 h-40 min-w-max">
              <div
                v-for="day in activityByDay"
                :key="day.date"
                class="flex flex-col items-center gap-1"
              >
                <div
                  class="w-8 bg-accent rounded-t transition-all duration-500"
                  :style="{ height: `${getActivityBarHeight(day.count)}px` }"
                  :title="`${day.date}: ${day.count} 活動`"
                ></div>
                <span class="text-xs text-content-tertiary transform -rotate-45 origin-top-left whitespace-nowrap">
                  {{ formatDate(day.date) }}
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- Recent Activity -->
        <section class="card p-6">
          <h2 class="text-lg font-semibold text-content mb-4">最近活動</h2>
          <div v-if="recentActivities.length === 0" class="text-content-tertiary text-center py-8">
            沒有活動紀錄
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="activity in recentActivities"
              :key="activity.id"
              class="flex items-center gap-4 py-2 border-b border-edge last:border-0"
            >
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center text-white"
                :class="getActivityColor(activity.event_name)"
              >
                <ph-icon v-if="activity.event_name.includes('create')" icon="plus" class="h-4 w-4" />
                <ph-icon v-else-if="activity.event_name.includes('move')" icon="arrows-left-right" class="h-4 w-4" />
                <ph-icon v-else-if="activity.event_name.includes('close')" icon="check" class="h-4 w-4" />
                <ph-icon v-else icon="circle-info" class="h-4 w-4" />
              </div>
              <div class="flex-1">
                <p class="text-sm text-content">{{ formatEventName(activity.event_name) }}</p>
                <p class="text-xs text-content-tertiary">
                  任務 #{{ activity.task_id }} · {{ formatDateTime(activity.date_creation) }}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- Search Modal -->
    <SearchModal
      v-if="showSearchModal"
      :project-id="projectId"
      @close="emit('close-search-modal')"
      @select="handleSearchSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAnalyticsStore } from '@/stores/analytics'
import { useBoardStore } from '@/stores/board'
import { useMembersStore } from '@/stores/members'
import SearchModal from '@/components/SearchModal.vue'
import type { Task } from '@/types'

defineProps<{
  showSearchModal?: boolean
}>()

const emit = defineEmits<{
  'close-search-modal': []
}>()

const route = useRoute()
const router = useRouter()
const analyticsStore = useAnalyticsStore()
const boardStore = useBoardStore()
const membersStore = useMembersStore()

const projectId = computed(() => Number(route.params.id))
const isLoading = ref(true)
const error = ref<string | null>(null)

const activityStats = computed(() => analyticsStore.getActivityStats())
const activityByDay = computed(() => analyticsStore.calculateActivityByDay())

const taskDistribution = computed(() => {
  if (boardStore.columns.length === 0) return []
  const tasks = boardStore.columns.flatMap(col => col.tasks || [])
  return analyticsStore.calculateTaskDistribution(tasks, boardStore.columns)
})

const userWorkload = computed(() => {
  if (boardStore.columns.length === 0) return []
  const tasks = boardStore.columns.flatMap(col => col.tasks || [])
  return analyticsStore.calculateUserWorkload(tasks, membersStore.members)
})

const recentActivities = computed(() => {
  return analyticsStore.activities.slice(0, 10)
})

const maxTaskCount = computed(() => {
  if (taskDistribution.value.length === 0) return 1
  return Math.max(...taskDistribution.value.map(d => d.count), 1)
})

const maxWorkloadCount = computed(() => {
  if (userWorkload.value.length === 0) return 1
  return Math.max(...userWorkload.value.map(w => w.count), 1)
})

const maxActivityCount = computed(() => {
  if (activityByDay.value.length === 0) return 1
  return Math.max(...activityByDay.value.map(a => a.count), 1)
})

function getDistributionPercentage(count: number): number {
  return (count / maxTaskCount.value) * 100
}

function getWorkloadPercentage(count: number): number {
  return (count / maxWorkloadCount.value) * 100
}

function getActivityBarHeight(count: number): number {
  return (count / maxActivityCount.value) * 120
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  return date.toLocaleString('zh-TW', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatEventName(eventName: string): string {
  const eventMap: Record<string, string> = {
    'task.create': '建立任務',
    'task.update': '更新任務',
    'task.close': '關閉任務',
    'task.open': '開啟任務',
    'task.move.column': '移動任務至其他欄位',
    'task.move.swimlane': '移動任務至其他泳道',
    'task.move.position': '調整任務位置',
    'comment.create': '新增評論',
    'subtask.create': '新增子任務',
    'subtask.update': '更新子任務',
    'file.create': '上傳附件'
  }
  return eventMap[eventName] || eventName
}

function getActivityColor(eventName: string): string {
  if (eventName.includes('create')) return 'bg-success'
  if (eventName.includes('close')) return 'bg-info'
  if (eventName.includes('move')) return 'bg-accent'
  if (eventName.includes('update')) return 'bg-warning'
  return 'bg-surface-tertiary'
}

async function loadAnalytics() {
  isLoading.value = true
  error.value = null

  try {
    await Promise.all([
      analyticsStore.fetchProjectActivity(projectId.value),
      boardStore.fetchBoard(projectId.value),
      membersStore.fetchProjectMembers(projectId.value)
    ])
  } catch (err) {
    error.value = err instanceof Error ? err.message : '載入分析資料失敗'
  } finally {
    isLoading.value = false
  }
}

watch(
  () => route.params.id,
  () => {
    if (route.params.id) {
      loadAnalytics()
    }
  }
)

onMounted(() => {
  loadAnalytics()
})

const handleSearchSelect = (task: Task) => {
  router.push(`/projects/${task.project_id}?task=${task.id}`)
  emit('close-search-modal')
}
</script>
