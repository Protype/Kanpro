<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <router-link
              :to="`/projects/${projectId}`"
              class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </router-link>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">專案分析</h1>
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-400">
            {{ projectName }}
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
        <p class="text-red-600 dark:text-red-400">{{ error }}</p>
      </div>

      <!-- Analytics Content -->
      <div v-else class="space-y-8">
        <!-- Stats Overview -->
        <section class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">總活動數</h3>
            <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{{ activityStats.total }}</p>
          </div>
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">建立任務</h3>
            <p class="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">{{ activityStats.taskCreated }}</p>
          </div>
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">移動任務</h3>
            <p class="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">{{ activityStats.taskMoved }}</p>
          </div>
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">關閉任務</h3>
            <p class="mt-2 text-3xl font-bold text-purple-600 dark:text-purple-400">{{ activityStats.taskClosed }}</p>
          </div>
        </section>

        <!-- Task Distribution -->
        <section class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">任務分佈</h2>
          <div v-if="taskDistribution.length === 0" class="text-gray-500 dark:text-gray-400 text-center py-8">
            沒有任務資料
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="item in taskDistribution"
              :key="item.column"
              class="flex items-center gap-4"
            >
              <span class="w-32 text-sm text-gray-600 dark:text-gray-400">{{ item.column }}</span>
              <div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                <div
                  class="bg-blue-600 h-full rounded-full transition-all duration-500"
                  :style="{ width: `${getDistributionPercentage(item.count)}%` }"
                ></div>
              </div>
              <span class="w-12 text-right text-sm font-medium text-gray-900 dark:text-white">{{ item.count }}</span>
            </div>
          </div>
        </section>

        <!-- User Workload -->
        <section class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">成員工作量</h2>
          <div v-if="userWorkload.length === 0" class="text-gray-500 dark:text-gray-400 text-center py-8">
            沒有成員資料
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="item in userWorkload"
              :key="item.username"
              class="flex items-center gap-4"
            >
              <span class="w-32 text-sm text-gray-600 dark:text-gray-400 truncate" :title="item.user">
                {{ item.user }}
              </span>
              <div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                <div
                  class="bg-green-600 h-full rounded-full transition-all duration-500"
                  :style="{ width: `${getWorkloadPercentage(item.count)}%` }"
                ></div>
              </div>
              <span class="w-12 text-right text-sm font-medium text-gray-900 dark:text-white">{{ item.count }}</span>
            </div>
          </div>
        </section>

        <!-- Activity Timeline -->
        <section class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">每日活動</h2>
          <div v-if="activityByDay.length === 0" class="text-gray-500 dark:text-gray-400 text-center py-8">
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
                  class="w-8 bg-blue-600 rounded-t transition-all duration-500"
                  :style="{ height: `${getActivityBarHeight(day.count)}px` }"
                  :title="`${day.date}: ${day.count} 活動`"
                ></div>
                <span class="text-xs text-gray-500 dark:text-gray-400 transform -rotate-45 origin-top-left whitespace-nowrap">
                  {{ formatDate(day.date) }}
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- Recent Activity -->
        <section class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">最近活動</h2>
          <div v-if="recentActivities.length === 0" class="text-gray-500 dark:text-gray-400 text-center py-8">
            沒有活動紀錄
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="activity in recentActivities"
              :key="activity.id"
              class="flex items-center gap-4 py-2 border-b border-gray-200 dark:border-gray-700 last:border-0"
            >
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center text-white"
                :class="getActivityColor(activity.event_name)"
              >
                <svg v-if="activity.event_name.includes('create')" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                <svg v-else-if="activity.event_name.includes('move')" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <svg v-else-if="activity.event_name.includes('close')" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-sm text-gray-900 dark:text-white">{{ formatEventName(activity.event_name) }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  任務 #{{ activity.task_id }} · {{ formatDateTime(activity.date_creation) }}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAnalyticsStore } from '@/stores/analytics'
import { useBoardStore } from '@/stores/board'
import { useMembersStore } from '@/stores/members'
import { useProjectsStore } from '@/stores/projects'
import type { Activity } from '@/types'

const route = useRoute()
const analyticsStore = useAnalyticsStore()
const boardStore = useBoardStore()
const membersStore = useMembersStore()
const projectsStore = useProjectsStore()

const projectId = computed(() => Number(route.params.id))
const projectName = ref('')
const isLoading = ref(true)
const error = ref<string | null>(null)

const activityStats = computed(() => analyticsStore.getActivityStats())
const activityByDay = computed(() => analyticsStore.calculateActivityByDay())

const taskDistribution = computed(() => {
  if (!boardStore.board) return []
  const tasks = boardStore.board.columns.flatMap(col => col.tasks || [])
  return analyticsStore.calculateTaskDistribution(tasks, boardStore.board.columns)
})

const userWorkload = computed(() => {
  if (!boardStore.board) return []
  const tasks = boardStore.board.columns.flatMap(col => col.tasks || [])
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
  if (eventName.includes('create')) return 'bg-green-600'
  if (eventName.includes('close')) return 'bg-purple-600'
  if (eventName.includes('move')) return 'bg-blue-600'
  if (eventName.includes('update')) return 'bg-yellow-600'
  return 'bg-gray-600'
}

async function loadAnalytics() {
  isLoading.value = true
  error.value = null

  try {
    await projectsStore.fetchProjects()
    const project = projectsStore.getProjectById(projectId.value)
    if (project) {
      projectName.value = project.name
    }

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
</script>
