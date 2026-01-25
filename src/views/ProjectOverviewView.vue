<template>
  <div class="h-full overflow-auto bg-surface-secondary">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center h-64 gap-3">
      <div class="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      <span class="text-sm text-content-tertiary">載入中...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex flex-col items-center justify-center h-64">
        <ph-icon icon="warning" class="w-12 h-12 text-error mb-3" />
        <p class="text-error font-medium">{{ error }}</p>
        <button @click="loadData" class="btn-secondary mt-4">重試</button>
      </div>

      <!-- Content -->
      <div v-else class="max-w-6xl mx-auto px-6 py-6 animate-fadeIn">
      <!-- Progress Section -->
      <section class="mb-6">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xs font-semibold text-content-tertiary uppercase tracking-wider">任務進度</h2>
          <span class="text-sm text-content-secondary">共 {{ totalTasks }} 項任務</span>
        </div>

        <!-- Progress Bar -->
        <div class="mb-4">
          <div class="h-2 bg-surface-tertiary rounded-full overflow-hidden flex">
            <div
              v-for="(col, index) in columns"
              :key="col.id"
              class="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
              :style="{
                width: `${getColumnPercentage(col.nb_tasks)}%`,
                backgroundColor: columnColors[index % columnColors.length],
                minWidth: '2px'
              }"
              :title="`${col.title}: ${col.nb_tasks}`"
            ></div>
          </div>
        </div>

        <!-- Column Legend -->
        <div class="flex flex-wrap gap-x-5 gap-y-2">
          <div
            v-for="(col, index) in columns"
            :key="col.id"
            class="flex items-center gap-2 text-sm"
          >
            <span
              class="w-2.5 h-2.5 rounded-full flex-shrink-0"
              :style="{ backgroundColor: columnColors[index % columnColors.length] }"
            ></span>
            <span class="text-content-secondary">{{ col.title }}</span>
            <span class="text-content font-medium tabular-nums">{{ col.nb_tasks || 0 }}</span>
          </div>
        </div>
      </section>

      <!-- Main Grid -->
      <div class="grid gap-6 lg:grid-cols-[1fr_320px]">
        <!-- Left Column -->
        <div class="flex flex-col gap-5">
          <!-- Description Card -->
          <section class="bg-surface rounded-xl border border-edge shadow-sm">
            <div class="flex items-center justify-between px-5 py-4 border-b border-edge">
              <h3 class="flex items-center gap-2 text-sm font-semibold text-content">
                <ph-icon icon="file-text" class="w-4 h-4" />
                專案描述
              </h3>
            </div>
            <div class="px-5 py-4">
              <p v-if="project?.description" class="text-sm text-content-secondary leading-relaxed whitespace-pre-wrap">
                {{ project.description }}
              </p>
              <p v-else class="text-sm text-content-tertiary">尚未添加專案描述</p>
            </div>
          </section>

          <!-- Activity Timeline -->
          <section class="bg-surface rounded-xl border border-edge shadow-sm">
            <div class="flex items-center justify-between px-5 py-4 border-b border-edge">
              <h3 class="flex items-center gap-2 text-sm font-semibold text-content">
                <ph-icon icon="bolt" class="w-4 h-4" />
                最近活動
              </h3>
              <router-link
                v-if="activities.length > 0"
                :to="`/projects/${projectId}/activity`"
                class="text-xs text-accent hover:text-accent-hover font-medium"
              >
                查看全部
              </router-link>
            </div>
            <div class="px-5 py-4">
              <div v-if="activities.length === 0" class="flex flex-col items-center justify-center py-6 gap-2">
                <ph-icon icon="clock" class="w-8 h-8 text-content-tertiary" />
                <p class="text-sm text-content-tertiary">目前沒有活動紀錄</p>
              </div>
              <div v-else class="space-y-0">
                <div
                  v-for="(activity, index) in activities"
                  :key="activity.id"
                  class="flex gap-3 py-3 border-b border-edge last:border-0 animate-slideIn"
                  :style="{ animationDelay: `${index * 50}ms` }"
                >
                  <UserAvatar :name="activity.author_name || activity.author_username" size="sm" />
                  <div class="flex-1 min-w-0">
                    <div class="flex flex-wrap items-center gap-1 text-sm">
                      <span class="font-medium text-content">{{ activity.author_username }}</span>
                      <span class="text-content-secondary">{{ formatEventName(activity.event_name) }}</span>
                      <router-link
                        v-if="activity.task_id"
                        :to="`/projects/${projectId}?task=${activity.task_id}`"
                        class="text-accent hover:underline font-medium"
                      >
                        #{{ activity.task_id }}
                      </router-link>
                    </div>
                    <p v-if="activity.task?.title" class="text-sm text-content-tertiary truncate mt-0.5">
                      {{ activity.task.title }}
                    </p>
                    <time class="text-xs text-content-tertiary mt-1 block">{{ formatRelativeTime(activity.date_creation) }}</time>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Right Column (Sidebar) -->
        <div class="flex flex-col gap-5">
          <!-- Project Info Card -->
          <section class="bg-surface rounded-xl border border-edge p-5 shadow-sm">
            <h3 class="text-sm font-semibold text-content mb-4">專案資訊</h3>
            <dl class="space-y-3">
              <div class="flex items-center justify-between">
                <dt class="text-sm text-content-tertiary">狀態</dt>
                <dd>
                  <span
                    :class="[
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                      isProjectActive
                        ? 'bg-success/10 text-success'
                        : 'bg-surface-tertiary text-content-tertiary'
                    ]"
                  >
                    {{ isProjectActive ? '啟用中' : '已停用' }}
                  </span>
                </dd>
              </div>
              <div v-if="project?.identifier" class="flex items-center justify-between">
                <dt class="text-sm text-content-tertiary">識別碼</dt>
                <dd class="text-sm font-mono text-xs bg-surface-secondary px-2 py-0.5 rounded">{{ project.identifier }}</dd>
              </div>
              <div v-if="projectOwner" class="flex items-center justify-between">
                <dt class="text-sm text-content-tertiary">擁有者</dt>
                <dd class="text-sm text-content font-medium">{{ projectOwner }}</dd>
              </div>
            </dl>
          </section>

          <!-- Team Card -->
          <section class="bg-surface rounded-xl border border-edge p-5 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-semibold text-content">團隊成員</h3>
              <span class="text-xs text-content-tertiary bg-surface-secondary px-2 py-0.5 rounded-full">{{ membersList.length }}</span>
            </div>

            <div v-if="membersList.length === 0" class="flex flex-col items-center justify-center py-6 gap-2">
              <p class="text-sm text-content-tertiary">尚未添加成員</p>
            </div>

            <div v-else class="flex flex-wrap gap-2">
              <div
                v-for="member in membersList"
                :key="member.id"
                class="flex items-center gap-2 px-2 py-1.5 bg-surface-secondary rounded-lg"
                :title="getMemberName(member)"
              >
                <UserAvatar :user="member" size="xs" />
                <span class="text-sm text-content truncate max-w-24">{{ getMemberName(member) }}</span>
              </div>
            </div>
          </section>

          <!-- Quick Stats -->
          <section class="bg-surface rounded-xl border border-edge p-5 shadow-sm">
            <h3 class="text-sm font-semibold text-content mb-4">統計數據</h3>
            <div class="grid grid-cols-3 gap-3">
              <div class="flex flex-col items-center text-center">
                <span class="text-xl font-bold text-content tabular-nums">{{ activityStats.taskCreated }}</span>
                <span class="text-xs text-content-tertiary mt-0.5">已建立</span>
              </div>
              <div class="flex flex-col items-center text-center">
                <span class="text-xl font-bold text-content tabular-nums">{{ activityStats.taskClosed }}</span>
                <span class="text-xs text-content-tertiary mt-0.5">已完成</span>
              </div>
              <div class="flex flex-col items-center text-center">
                <span class="text-xl font-bold text-content tabular-nums">{{ activityStats.total }}</span>
                <span class="text-xs text-content-tertiary mt-0.5">總活動</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useBoardStore } from '@/stores/board'
import { useMembersStore } from '@/stores/members'
import { useProjectsStore } from '@/stores/projects'
import { useAnalyticsStore } from '@/stores/analytics'
import UserAvatar from '@/components/UserAvatar.vue'
import type { ProjectMember } from '@/types'

const route = useRoute()
const boardStore = useBoardStore()
const membersStore = useMembersStore()
const projectsStore = useProjectsStore()
const analyticsStore = useAnalyticsStore()

const projectId = computed(() => Number(route.params.id))
const isLoading = ref(true)
const error = ref<string | null>(null)

// Column colors for progress bar
const columnColors = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#14b8a6'  // teal
]

// Data
const project = computed(() => projectsStore.getProjectById(projectId.value) || boardStore.project)
const columns = computed(() => boardStore.columns)
const members = computed(() => membersStore.members)
const activities = computed(() => analyticsStore.activities.slice(0, 8))
const activityStats = computed(() => analyticsStore.getActivityStats())

const totalTasks = computed(() => {
  return columns.value.reduce((sum, col) => sum + (col.nb_tasks || 0), 0)
})

// Check if project is active (handles both boolean and number/string values from API)
const isProjectActive = computed(() => {
  const isActive = project.value?.is_active
  // API 可能回傳 boolean、number 或 string
  return Boolean(isActive) && isActive !== 0 && isActive !== '0'
})

// Get project owner name
const projectOwner = computed(() => {
  if (!project.value?.owner_id) return null
  // Members store uses membersMap which preserves ID->name mapping
  const membersMap = membersStore.membersMap
  if (membersMap && membersMap[project.value.owner_id]) {
    return membersMap[project.value.owner_id]
  }
  // Fallback: try to find in members list
  const ownerName = getMemberName(members.value.find((m: unknown) => {
    if (typeof m === 'object' && m !== null && 'id' in m) {
      return String((m as { id: unknown }).id) === String(project.value?.owner_id)
    }
    return false
  }))
  return ownerName || null
})

// Get members list from store - filter out invalid entries
const membersList = computed<ProjectMember[]>(() => {
  return members.value.filter((m): m is ProjectMember => {
    return m !== null && m !== undefined && typeof m === 'object' && 'id' in m
  })
})

// Helper to get member display name
function getMemberName(member: ProjectMember): string {
  if (!member) return ''
  return member.name || member.username || ''
}

function getColumnPercentage(count: number | undefined): number {
  if (totalTasks.value === 0) return 0
  return ((count || 0) / totalTasks.value) * 100
}

function formatEventName(eventName: string): string {
  const eventMap: Record<string, string> = {
    'task.create': '建立了任務',
    'task.update': '更新了任務',
    'task.close': '完成了任務',
    'task.open': '重新開啟任務',
    'task.move.column': '移動了任務',
    'task.move.swimlane': '移動了任務',
    'task.move.position': '調整了位置',
    'comment.create': '評論了',
    'subtask.create': '新增子任務',
    'subtask.update': '更新子任務',
    'file.create': '上傳了附件'
  }
  return eventMap[eventName] || eventName.replace(/\./g, ' ')
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now() / 1000
  const diff = now - timestamp

  if (diff < 60) return '剛剛'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分鐘前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小時前`
  if (diff < 604800) return `${Math.floor(diff / 86400)} 天前`

  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })
}

async function loadData() {
  isLoading.value = true
  error.value = null

  try {
    await Promise.all([
      projectsStore.fetchProjects(),
      boardStore.fetchBoard(projectId.value),
      membersStore.fetchProjectMembers(projectId.value),
      analyticsStore.fetchProjectActivity(projectId.value)
    ])
  } catch (err) {
    error.value = err instanceof Error ? err.message : '載入專案資料失敗'
  } finally {
    isLoading.value = false
  }
}

watch(
  () => route.params.id,
  () => {
    if (route.params.id) {
      loadData()
    }
  }
)

onMounted(() => {
  loadData()
})
</script>

<style>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}

.animate-slideIn {
  animation: slideIn 0.3s ease-out both;
}
</style>
