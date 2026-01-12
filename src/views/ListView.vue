<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useBoardStore } from '@/stores/board'
import { useTasksStore } from '@/stores/tasks'
import TaskDetailModal from '@/components/TaskDetailModal.vue'
import type { Task } from '@/types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const boardStore = useBoardStore()
const tasksStore = useTasksStore()

const projectId = computed(() => Number(route.params.id))

// Sorting
type SortKey = 'id' | 'title' | 'column_id' | 'priority' | 'date_due' | 'date_creation'
const sortKey = ref<SortKey>('id')
const sortDirection = ref<'asc' | 'desc'>('desc')

// Filtering
const filterQuery = ref('')
const showClosedTasks = ref(false)

// Task detail modal
const showTaskDetailModal = ref(false)
const selectedTask = ref<Task | null>(null)

const colorClasses: Record<string, string> = {
  yellow: 'bg-yellow-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  grey: 'bg-gray-500',
  cyan: 'bg-cyan-500'
}

const getColorClass = (colorId: string) => {
  return colorClasses[colorId] || 'bg-yellow-500'
}

const formatDate = (timestamp?: number) => {
  if (!timestamp) return '-'
  return new Date(timestamp * 1000).toLocaleDateString('zh-TW')
}

const isOverdue = (task: Task) => {
  if (!task.date_due) return false
  return task.date_due * 1000 < Date.now() && task.is_active
}

const getColumnName = (columnId: number) => {
  const column = boardStore.columns.find(c => c.id === columnId)
  return column?.title || '-'
}

// Filtered and sorted tasks
const filteredTasks = computed(() => {
  let tasks = [...tasksStore.allTasks]

  // Filter by status
  if (!showClosedTasks.value) {
    tasks = tasks.filter(t => t.is_active)
  }

  // Filter by query
  if (filterQuery.value.trim()) {
    const query = filterQuery.value.toLowerCase()
    tasks = tasks.filter(t =>
      t.title.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query) ||
      `#${t.id}`.includes(query)
    )
  }

  // Sort
  tasks.sort((a, b) => {
    let aVal: unknown = a[sortKey.value]
    let bVal: unknown = b[sortKey.value]

    // Handle null/undefined
    if (aVal === null || aVal === undefined) aVal = ''
    if (bVal === null || bVal === undefined) bVal = ''

    // Compare
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection.value === 'asc' ? aVal - bVal : bVal - aVal
    }

    const aStr = String(aVal)
    const bStr = String(bVal)
    return sortDirection.value === 'asc'
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr)
  })

  return tasks
})

const toggleSort = (key: SortKey) => {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDirection.value = 'desc'
  }
}

const getSortIcon = (key: SortKey) => {
  if (sortKey.value !== key) return ''
  return sortDirection.value === 'asc' ? '↑' : '↓'
}

onMounted(async () => {
  await Promise.all([
    boardStore.fetchBoard(projectId.value),
    tasksStore.fetchAllTasks(projectId.value)
  ])
})

watch(() => route.params.id, async (newId) => {
  if (newId) {
    const id = Number(newId)
    await Promise.all([
      boardStore.fetchBoard(id),
      tasksStore.fetchAllTasks(id)
    ])
  }
})

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

const goToProjects = () => {
  router.push('/')
}

const goToBoard = () => {
  router.push(`/projects/${projectId.value}`)
}

const openTaskDetail = (task: Task) => {
  selectedTask.value = task
  showTaskDetailModal.value = true
}

const handleTaskUpdated = async () => {
  await tasksStore.fetchAllTasks(projectId.value)
  await boardStore.fetchBoard(projectId.value)
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex flex-col">
    <!-- Header -->
    <header class="bg-white shadow flex-shrink-0">
      <div class="mx-auto max-w-full px-4 py-3 flex justify-between items-center">
        <div class="flex items-center gap-4">
          <button
            @click="goToProjects"
            class="text-gray-600 hover:text-gray-900"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 class="text-xl font-bold text-gray-900">
            {{ boardStore.project?.name || '載入中...' }}
          </h1>
          <div class="flex border rounded-md overflow-hidden">
            <button
              @click="goToBoard"
              class="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200"
            >
              看板
            </button>
            <button
              class="px-3 py-1 text-sm bg-blue-600 text-white"
            >
              清單
            </button>
          </div>
        </div>
        <div class="flex items-center gap-4">
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

    <!-- Loading -->
    <div v-if="tasksStore.isLoading" class="flex-1 flex items-center justify-center">
      <svg class="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <!-- Content -->
    <main v-else class="flex-1 p-4">
      <!-- Toolbar -->
      <div class="bg-white rounded-lg shadow mb-4 p-4 flex items-center gap-4">
        <input
          v-model="filterQuery"
          type="text"
          placeholder="搜尋任務..."
          class="flex-1 max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <label class="flex items-center gap-2 text-sm text-gray-600">
          <input
            v-model="showClosedTasks"
            type="checkbox"
            class="rounded border-gray-300"
          />
          顯示已關閉任務
        </label>
        <span class="text-sm text-gray-500">
          共 {{ filteredTasks.length }} 個任務
        </span>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50 border-b">
            <tr>
              <th
                @click="toggleSort('id')"
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
              >
                # {{ getSortIcon('id') }}
              </th>
              <th
                @click="toggleSort('title')"
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
              >
                標題 {{ getSortIcon('title') }}
              </th>
              <th
                @click="toggleSort('column_id')"
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
              >
                欄位 {{ getSortIcon('column_id') }}
              </th>
              <th
                @click="toggleSort('priority')"
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
              >
                優先級 {{ getSortIcon('priority') }}
              </th>
              <th
                @click="toggleSort('date_due')"
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
              >
                到期日 {{ getSortIcon('date_due') }}
              </th>
              <th
                @click="toggleSort('date_creation')"
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
              >
                建立日期 {{ getSortIcon('date_creation') }}
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                狀態
              </th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr
              v-for="task in filteredTasks"
              :key="task.id"
              @click="openTaskDetail(task)"
              class="hover:bg-gray-50 cursor-pointer"
            >
              <td class="px-4 py-3 text-sm text-gray-500">
                #{{ task.id }}
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <div :class="['w-3 h-3 rounded-full', getColorClass(task.color_id)]"></div>
                  <span class="font-medium text-gray-900">{{ task.title }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ getColumnName(task.column_id) }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ task.priority || '-' }}
              </td>
              <td class="px-4 py-3 text-sm">
                <span
                  :class="isOverdue(task) ? 'text-red-600 font-medium' : 'text-gray-600'"
                >
                  {{ formatDate(task.date_due) }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ formatDate(task.date_creation) }}
              </td>
              <td class="px-4 py-3">
                <span
                  :class="[
                    'px-2 py-1 text-xs rounded',
                    task.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  ]"
                >
                  {{ task.is_active ? '開啟' : '已關閉' }}
                </span>
              </td>
            </tr>
            <tr v-if="filteredTasks.length === 0">
              <td colspan="7" class="px-4 py-8 text-center text-gray-500">
                沒有符合條件的任務
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>

    <!-- Task Detail Modal -->
    <TaskDetailModal
      :is-open="showTaskDetailModal"
      :task="selectedTask"
      :columns="boardStore.columns"
      :project-id="projectId"
      @close="showTaskDetailModal = false"
      @updated="handleTaskUpdated"
    />
  </div>
</template>
