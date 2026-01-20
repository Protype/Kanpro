<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { useDashboardStore } from '@/stores/dashboard'
import SearchModal from '@/components/SearchModal.vue'
import type { Task } from '@/types'

defineProps<{
  showSearchModal?: boolean
}>()

const emit = defineEmits<{
  'close-search-modal': []
}>()

const router = useRouter()
const projectsStore = useProjectsStore()
const dashboardStore = useDashboardStore()

const colorClasses: Record<string, string> = {
  yellow: 'bg-yellow-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  grey: 'bg-gray-500',
  cyan: 'bg-cyan-500',
  lime: 'bg-lime-500',
  pink: 'bg-pink-500',
  teal: 'bg-teal-500',
  amber: 'bg-amber-500'
}

const getColorClass = (colorId: string) => {
  return colorClasses[colorId] || 'bg-yellow-500'
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleDateString('zh-TW')
}

const isOverdue = (task: Task) => {
  if (!task.date_due) return false
  return task.date_due * 1000 < Date.now()
}

onMounted(async () => {
  await Promise.all([
    projectsStore.fetchProjects(),
    dashboardStore.fetchDashboardData()
  ])
})

const goToProject = (projectId: number) => {
  router.push(`/projects/${projectId}`)
}

const goToProjects = () => {
  router.push('/projects')
}

const handleSearchSelect = (task: Task) => {
  router.push(`/projects/${task.project_id}?task=${task.id}`)
  emit('close-search-modal')
}
</script>

<template>
  <div class="h-full overflow-auto bg-surface-secondary">
    <main class="mx-auto max-w-7xl px-4 py-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-content">儀表板</h1>
        <p class="text-content-secondary mt-1">所有專案的活動總覽</p>
      </div>

      <!-- Loading -->
      <div v-if="dashboardStore.isLoading" class="flex items-center justify-center py-12">
        <ph-icon icon="spinner" class="spinner h-8 w-8" />
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Column: My Tasks -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Overdue Tasks Alert -->
          <div v-if="dashboardStore.hasOverdueTasks" class="alert-error">
            <div class="flex items-center gap-2 mb-3">
              <ph-icon icon="triangle-exclamation" class="w-5 h-5" />
              <h2 class="text-lg font-semibold">逾期任務 ({{ dashboardStore.overdueTasks.length }})</h2>
            </div>
            <div class="space-y-2">
              <div
                v-for="task in dashboardStore.overdueTasks"
                :key="task.id"
                @click="goToProject(task.project_id)"
                class="bg-surface rounded p-3 cursor-pointer hover:bg-surface-hover"
              >
                <div class="flex items-center gap-2">
                  <div :class="['w-3 h-3 rounded-full', getColorClass(task.color_id)]"></div>
                  <span class="text-content-tertiary text-sm">#{{ task.id }}</span>
                  <span class="font-medium text-content">{{ task.title }}</span>
                </div>
                <div class="mt-1 text-sm text-error">
                  到期日: {{ task.date_due ? formatDate(task.date_due) : '-' }}
                </div>
              </div>
            </div>
          </div>

          <!-- My Tasks -->
          <div class="card">
            <div class="p-4 border-b border-edge">
              <h2 class="text-lg font-semibold text-content">我的任務</h2>
              <p class="text-sm text-content-secondary">指派給您的開啟中任務</p>
            </div>
            <div class="divide-y divide-edge">
              <div
                v-for="task in dashboardStore.myTasks"
                :key="task.id"
                @click="goToProject(task.project_id)"
                class="p-4 hover:bg-surface-hover cursor-pointer"
              >
                <div class="flex items-center gap-3">
                  <div :class="['w-3 h-3 rounded-full', getColorClass(task.color_id)]"></div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="text-content-tertiary text-sm">#{{ task.id }}</span>
                      <span class="font-medium text-content truncate">{{ task.title }}</span>
                    </div>
                    <p v-if="task.description" class="text-sm text-content-secondary truncate mt-0.5">
                      {{ task.description }}
                    </p>
                  </div>
                  <div v-if="task.date_due" class="flex-shrink-0">
                    <span
                      :class="[
                        'px-2 py-1 text-xs rounded',
                        isOverdue(task) ? 'bg-error/10 text-error' : 'bg-surface-tertiary text-content-secondary'
                      ]"
                    >
                      {{ formatDate(task.date_due) }}
                    </span>
                  </div>
                </div>
              </div>
              <div v-if="dashboardStore.myTasks.length === 0" class="empty-state">
                <ph-icon icon="clipboard-list" class="empty-state-icon" />
                <p class="empty-state-description">目前沒有指派給您的任務</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Projects -->
        <div class="space-y-6">
          <!-- Quick Access: Projects -->
          <div class="card">
            <div class="p-4 border-b border-edge flex justify-between items-center">
              <h2 class="text-lg font-semibold text-content">專案</h2>
              <button @click="goToProjects" class="link text-sm">
                查看全部
              </button>
            </div>
            <div class="divide-y divide-edge">
              <div
                v-for="project in projectsStore.activeProjects.slice(0, 5)"
                :key="project.id"
                @click="goToProject(project.id)"
                class="p-4 hover:bg-surface-hover cursor-pointer"
              >
                <div class="font-medium text-content">{{ project.name }}</div>
                <p v-if="project.description" class="text-sm text-content-secondary truncate mt-0.5">
                  {{ project.description }}
                </p>
              </div>
              <div v-if="projectsStore.activeProjects.length === 0" class="p-4 text-center text-content-secondary">
                沒有專案
              </div>
            </div>
          </div>

          <!-- Stats -->
          <div class="card p-4">
            <h2 class="text-lg font-semibold text-content mb-4">統計</h2>
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-info/10 rounded-lg p-3 text-center">
                <div class="text-2xl font-bold text-info">{{ dashboardStore.myTasks.length }}</div>
                <div class="text-sm text-info">我的任務</div>
              </div>
              <div class="bg-error/10 rounded-lg p-3 text-center">
                <div class="text-2xl font-bold text-error">{{ dashboardStore.overdueTasks.length }}</div>
                <div class="text-sm text-error">逾期任務</div>
              </div>
              <div class="bg-success/10 rounded-lg p-3 text-center">
                <div class="text-2xl font-bold text-success">{{ projectsStore.activeProjects.length }}</div>
                <div class="text-sm text-success">啟用專案</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Search Modal -->
    <SearchModal
      v-if="showSearchModal"
      @close="emit('close-search-modal')"
      @select="handleSearchSelect"
    />
  </div>
</template>
