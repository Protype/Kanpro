<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProjectsStore } from '@/stores/projects'
import { useDashboardStore } from '@/stores/dashboard'
import NotificationsDropdown from '@/components/NotificationsDropdown.vue'
import type { Task } from '@/types'

const router = useRouter()
const authStore = useAuthStore()
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

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

const goToProject = (projectId: number) => {
  router.push(`/projects/${projectId}`)
}

const goToProjects = () => {
  router.push('/')
}

const goToSettings = () => {
  router.push('/settings')
}
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Header -->
    <header class="bg-white shadow">
      <div class="mx-auto max-w-7xl px-4 py-4 flex justify-between items-center">
        <div class="flex items-center gap-4">
          <h1 class="text-2xl font-bold text-gray-900">儀表板</h1>
        </div>
        <div class="flex items-center gap-4">
          <NotificationsDropdown />
          <button
            @click="goToSettings"
            class="text-gray-600 hover:text-gray-900"
            title="使用者設定"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <span class="text-gray-600 text-sm">
            {{ authStore.user?.name || authStore.user?.username }}
          </span>
          <button
            @click="handleLogout"
            class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            登出
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-7xl px-4 py-6">
      <!-- Loading -->
      <div v-if="dashboardStore.isLoading" class="flex items-center justify-center py-12">
        <svg class="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Column: My Tasks -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Overdue Tasks Alert -->
          <div v-if="dashboardStore.hasOverdueTasks" class="bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="flex items-center gap-2 mb-3">
              <svg class="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 class="text-lg font-semibold text-red-800">逾期任務 ({{ dashboardStore.overdueTasks.length }})</h2>
            </div>
            <div class="space-y-2">
              <div
                v-for="task in dashboardStore.overdueTasks"
                :key="task.id"
                @click="goToProject(task.project_id)"
                class="bg-white rounded p-3 cursor-pointer hover:bg-red-100 transition-colors"
              >
                <div class="flex items-center gap-2">
                  <div :class="['w-3 h-3 rounded-full', getColorClass(task.color_id)]"></div>
                  <span class="text-gray-500 text-sm">#{{ task.id }}</span>
                  <span class="font-medium text-gray-900">{{ task.title }}</span>
                </div>
                <div class="mt-1 text-sm text-red-600">
                  到期日: {{ task.date_due ? formatDate(task.date_due) : '-' }}
                </div>
              </div>
            </div>
          </div>

          <!-- My Tasks -->
          <div class="bg-white rounded-lg shadow">
            <div class="p-4 border-b">
              <h2 class="text-lg font-semibold text-gray-900">我的任務</h2>
              <p class="text-sm text-gray-500">指派給您的開啟中任務</p>
            </div>
            <div class="divide-y">
              <div
                v-for="task in dashboardStore.myTasks"
                :key="task.id"
                @click="goToProject(task.project_id)"
                class="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div class="flex items-center gap-3">
                  <div :class="['w-3 h-3 rounded-full', getColorClass(task.color_id)]"></div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="text-gray-400 text-sm">#{{ task.id }}</span>
                      <span class="font-medium text-gray-900 truncate">{{ task.title }}</span>
                    </div>
                    <p v-if="task.description" class="text-sm text-gray-500 truncate mt-0.5">
                      {{ task.description }}
                    </p>
                  </div>
                  <div v-if="task.date_due" class="flex-shrink-0">
                    <span
                      :class="[
                        'px-2 py-1 text-xs rounded',
                        isOverdue(task) ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                      ]"
                    >
                      {{ formatDate(task.date_due) }}
                    </span>
                  </div>
                </div>
              </div>
              <div v-if="dashboardStore.myTasks.length === 0" class="p-8 text-center text-gray-500">
                <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <p>目前沒有指派給您的任務</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Projects -->
        <div class="space-y-6">
          <!-- Quick Access: Projects -->
          <div class="bg-white rounded-lg shadow">
            <div class="p-4 border-b flex justify-between items-center">
              <h2 class="text-lg font-semibold text-gray-900">專案</h2>
              <button
                @click="goToProjects"
                class="text-sm text-blue-600 hover:text-blue-800"
              >
                查看全部
              </button>
            </div>
            <div class="divide-y">
              <div
                v-for="project in projectsStore.activeProjects.slice(0, 5)"
                :key="project.id"
                @click="goToProject(project.id)"
                class="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div class="font-medium text-gray-900">{{ project.name }}</div>
                <p v-if="project.description" class="text-sm text-gray-500 truncate mt-0.5">
                  {{ project.description }}
                </p>
              </div>
              <div v-if="projectsStore.activeProjects.length === 0" class="p-4 text-center text-gray-500">
                沒有專案
              </div>
            </div>
          </div>

          <!-- Stats -->
          <div class="bg-white rounded-lg shadow p-4">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">統計</h2>
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-blue-50 rounded-lg p-3 text-center">
                <div class="text-2xl font-bold text-blue-600">{{ dashboardStore.myTasks.length }}</div>
                <div class="text-sm text-blue-700">我的任務</div>
              </div>
              <div class="bg-red-50 rounded-lg p-3 text-center">
                <div class="text-2xl font-bold text-red-600">{{ dashboardStore.overdueTasks.length }}</div>
                <div class="text-sm text-red-700">逾期任務</div>
              </div>
              <div class="bg-green-50 rounded-lg p-3 text-center">
                <div class="text-2xl font-bold text-green-600">{{ projectsStore.activeProjects.length }}</div>
                <div class="text-sm text-green-700">啟用專案</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
