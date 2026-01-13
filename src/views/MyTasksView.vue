<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTasksStore } from '@/stores/tasks'
import { useProjectsStore } from '@/stores/projects'
import TaskDetailModal from '@/components/TaskDetailModal.vue'
import SearchModal from '@/components/SearchModal.vue'
import type { Task } from '@/types'

defineProps<{
  showSearchModal?: boolean
}>()

const emit = defineEmits<{
  'close-search-modal': []
}>()

const router = useRouter()
const tasksStore = useTasksStore()
const projectsStore = useProjectsStore()

const isLoading = ref(false)
const tasks = ref<Task[]>([])
const error = ref<string | null>(null)

// Task detail modal
const showTaskDetailModal = ref(false)
const selectedTask = ref<Task | null>(null)

// Sorting
const sortBy = ref<'date_creation' | 'date_due' | 'priority'>('date_due')
const sortOrder = ref<'asc' | 'desc'>('asc')

onMounted(async () => {
  // Load projects first, then tasks
  if (projectsStore.projects.length === 0) {
    await projectsStore.fetchProjects()
  }
  await loadTasks()
})

const loadTasks = async () => {
  isLoading.value = true
  error.value = null
  try {
    // Search for tasks assigned to me from all projects
    const allMyTasks: Task[] = []
    for (const project of projectsStore.projects) {
      try {
        const result = await tasksStore.searchTasks('assignee:me status:open', project.id)
        if (result && result.length > 0) {
          allMyTasks.push(...result)
        }
      } catch {
        // Skip projects that fail to load
      }
    }
    tasks.value = allMyTasks
  } catch (e) {
    error.value = e instanceof Error ? e.message : '載入任務失敗'
  } finally {
    isLoading.value = false
  }
}

const sortedTasks = computed(() => {
  const sorted = [...tasks.value]
  sorted.sort((a, b) => {
    let comparison = 0
    if (sortBy.value === 'date_creation') {
      comparison = (a.date_creation || 0) - (b.date_creation || 0)
    } else if (sortBy.value === 'date_due') {
      // Put tasks without due date at the end
      if (!a.date_due && !b.date_due) comparison = 0
      else if (!a.date_due) comparison = 1
      else if (!b.date_due) comparison = -1
      else comparison = a.date_due - b.date_due
    } else if (sortBy.value === 'priority') {
      comparison = (a.priority || 0) - (b.priority || 0)
    }
    return sortOrder.value === 'asc' ? comparison : -comparison
  })
  return sorted
})

const getProjectName = (projectId: number) => {
  const project = projectsStore.projects.find(p => p.id === projectId)
  return project?.name || `專案 #${projectId}`
}

const formatDate = (timestamp: number | null) => {
  if (!timestamp) return '-'
  return new Date(timestamp * 1000).toLocaleDateString('zh-TW')
}

const isOverdue = (task: Task) => {
  if (!task.date_due) return false
  return task.date_due * 1000 < Date.now()
}

const isDueSoon = (task: Task) => {
  if (!task.date_due) return false
  const dueDate = task.date_due * 1000
  const now = Date.now()
  const threeDays = 3 * 24 * 60 * 60 * 1000
  return dueDate > now && dueDate - now < threeDays
}

const handleTaskClick = (task: Task) => {
  selectedTask.value = task
  showTaskDetailModal.value = true
}

const handleTaskUpdated = async () => {
  await loadTasks()
}

const handleSearchSelect = (task: Task) => {
  selectedTask.value = task
  showTaskDetailModal.value = true
  emit('close-search-modal')
}

const goToProject = (projectId: number) => {
  router.push(`/projects/${projectId}`)
}

const toggleSort = (field: 'date_creation' | 'date_due' | 'priority') => {
  if (sortBy.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = field
    sortOrder.value = field === 'date_due' ? 'asc' : 'desc'
  }
}

const getSortIcon = (field: string) => {
  if (sortBy.value !== field) return null
  return sortOrder.value === 'asc' ? '↑' : '↓'
}

// Color mapping helper
const getColorValue = (colorId: string): string => {
  const colors: Record<string, string> = {
    yellow: '#eab308',
    blue: '#3b82f6',
    green: '#22c55e',
    purple: '#a855f7',
    red: '#ef4444',
    orange: '#f97316',
    grey: '#6b7280',
    cyan: '#06b6d4',
    lime: '#84cc16',
    pink: '#ec4899',
    teal: '#14b8a6',
    amber: '#f59e0b',
    brown: '#92400e',
    deep_orange: '#c2410c',
    dark_grey: '#374151',
    white: '#ffffff'
  }
  return colors[colorId] || '#6b7280'
}
</script>

<template>
  <div class="p-6">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-content">我的任務</h1>
        <p class="text-content-secondary mt-1">指派給我的開啟中任務</p>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="bg-surface rounded-lg border border-edge p-4">
          <div class="text-2xl font-bold text-content">{{ tasks.length }}</div>
          <div class="text-sm text-content-secondary">總任務數</div>
        </div>
        <div class="bg-surface rounded-lg border border-edge p-4">
          <div class="text-2xl font-bold text-error">{{ tasks.filter(isOverdue).length }}</div>
          <div class="text-sm text-content-secondary">逾期任務</div>
        </div>
        <div class="bg-surface rounded-lg border border-edge p-4">
          <div class="text-2xl font-bold text-warning">{{ tasks.filter(isDueSoon).length }}</div>
          <div class="text-sm text-content-secondary">即將到期</div>
        </div>
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
        <button @click="loadTasks" class="ml-4 underline">重試</button>
      </div>

      <!-- Tasks Table -->
      <div v-else class="bg-surface rounded-lg border border-edge overflow-hidden">
        <table class="w-full">
          <thead class="bg-surface-secondary">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-content-secondary uppercase tracking-wider">
                任務
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-content-secondary uppercase tracking-wider">
                專案
              </th>
              <th
                @click="toggleSort('date_due')"
                class="px-4 py-3 text-left text-xs font-medium text-content-secondary uppercase tracking-wider cursor-pointer hover:text-content"
              >
                到期日 {{ getSortIcon('date_due') }}
              </th>
              <th
                @click="toggleSort('priority')"
                class="px-4 py-3 text-left text-xs font-medium text-content-secondary uppercase tracking-wider cursor-pointer hover:text-content"
              >
                優先級 {{ getSortIcon('priority') }}
              </th>
              <th
                @click="toggleSort('date_creation')"
                class="px-4 py-3 text-left text-xs font-medium text-content-secondary uppercase tracking-wider cursor-pointer hover:text-content"
              >
                建立日期 {{ getSortIcon('date_creation') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-edge">
            <tr
              v-for="task in sortedTasks"
              :key="task.id"
              @click="handleTaskClick(task)"
              class="hover:bg-surface-hover cursor-pointer transition-colors"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <span
                    v-if="task.color_id"
                    class="w-3 h-3 rounded-full flex-shrink-0"
                    :style="{ backgroundColor: getColorValue(task.color_id) }"
                  />
                  <div>
                    <span class="text-content font-medium">{{ task.title }}</span>
                    <span class="text-content-tertiary text-sm ml-2">#{{ task.id }}</span>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3">
                <button
                  @click.stop="goToProject(task.project_id)"
                  class="text-sm text-accent hover:text-accent-hover"
                >
                  {{ getProjectName(task.project_id) }}
                </button>
              </td>
              <td class="px-4 py-3">
                <span
                  :class="[
                    'text-sm',
                    isOverdue(task) ? 'text-error font-medium' : isDueSoon(task) ? 'text-warning font-medium' : 'text-content-secondary'
                  ]"
                >
                  {{ formatDate(task.date_due) }}
                  <span v-if="isOverdue(task)" class="ml-1">(逾期)</span>
                  <span v-else-if="isDueSoon(task)" class="ml-1">(即將到期)</span>
                </span>
              </td>
              <td class="px-4 py-3">
                <span v-if="task.priority" class="text-sm text-content-secondary">
                  {{ task.priority }}
                </span>
                <span v-else class="text-sm text-content-tertiary">-</span>
              </td>
              <td class="px-4 py-3 text-sm text-content-secondary">
                {{ formatDate(task.date_creation) }}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty State -->
        <div v-if="sortedTasks.length === 0" class="p-12 text-center text-content-secondary">
          <svg class="w-16 h-16 mx-auto mb-4 text-content-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>沒有指派給你的任務</p>
          <p class="text-sm text-content-tertiary mt-1">太棒了！你已完成所有任務</p>
        </div>
      </div>
    </div>

    <!-- Task Detail Modal -->
    <TaskDetailModal
      :is-open="showTaskDetailModal"
      :task="selectedTask"
      :columns="[]"
      :project-id="selectedTask?.project_id || 0"
      @close="showTaskDetailModal = false"
      @updated="handleTaskUpdated"
    />

    <!-- Search Modal -->
    <SearchModal
      v-if="showSearchModal"
      @close="emit('close-search-modal')"
      @select="handleSearchSelect"
    />
  </div>
</template>
