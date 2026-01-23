<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBoardStore } from '@/stores/board'
import { useTasksStore } from '@/stores/tasks'
import { isTaskOverdue, formatTaskDate, getTaskColorDotClass } from '@/utils/task'
import TaskDetailModal from '@/components/TaskDetailModal.vue'
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

// Handle task query param for deep linking
watch(
  () => route.query.task,
  async (taskId) => {
    if (taskId) {
      const id = Number(taskId)
      const task = tasksStore.allTasks.find(t => t.id === id)
      if (task) {
        selectedTask.value = task
        showTaskDetailModal.value = true
      }
      // Clear query param
      router.replace({ query: {} })
    }
  },
  { immediate: true }
)

const openTaskDetail = (task: Task) => {
  selectedTask.value = task
  showTaskDetailModal.value = true
}

const handleTaskUpdated = async () => {
  await tasksStore.fetchAllTasks(projectId.value)
  await boardStore.fetchBoard(projectId.value)
}

const handleSearchSelect = (task: Task) => {
  selectedTask.value = task
  showTaskDetailModal.value = true
  emit('close-search-modal')
}
</script>

<template>
  <div class="h-full flex flex-col bg-surface-secondary">
    <!-- Loading -->
    <div v-if="tasksStore.isLoading" class="flex-1 flex items-center justify-center">
      <ph-icon icon="spinner" class="animate-spin h-8 w-8 text-accent" />
    </div>

    <!-- Content -->
    <main v-else class="flex-1 p-4 overflow-auto">
      <!-- Toolbar -->
      <div class="mb-4 flex items-center gap-4">
        <span class="text-sm text-content-tertiary whitespace-nowrap">
          共 {{ filteredTasks.length }} 個任務
        </span>
        <div class="flex-1" />
        <label class="flex items-center gap-2 text-sm text-content-secondary">
          <input
            v-model="showClosedTasks"
            type="checkbox"
            class="checkbox"
          />
          顯示已關閉任務
        </label>
        <input
          v-model="filterQuery"
          type="text"
          :placeholder="`搜尋任務...`"
          class="input w-64"
        />
      </div>

      <!-- Table -->
      <div class="card overflow-hidden">
        <table class="table">
          <thead class="table-header">
            <tr>
              <th
                @click="toggleSort('id')"
                class="table-header-cell cursor-pointer hover:bg-surface-hover uppercase"
              >
                # {{ getSortIcon('id') }}
              </th>
              <th
                @click="toggleSort('title')"
                class="table-header-cell cursor-pointer hover:bg-surface-hover uppercase"
              >
                標題 {{ getSortIcon('title') }}
              </th>
              <th
                @click="toggleSort('column_id')"
                class="table-header-cell cursor-pointer hover:bg-surface-hover uppercase"
              >
                欄位 {{ getSortIcon('column_id') }}
              </th>
              <th
                @click="toggleSort('priority')"
                class="table-header-cell cursor-pointer hover:bg-surface-hover uppercase"
              >
                優先級 {{ getSortIcon('priority') }}
              </th>
              <th
                @click="toggleSort('date_due')"
                class="table-header-cell cursor-pointer hover:bg-surface-hover uppercase"
              >
                到期日 {{ getSortIcon('date_due') }}
              </th>
              <th
                @click="toggleSort('date_creation')"
                class="table-header-cell cursor-pointer hover:bg-surface-hover uppercase"
              >
                建立日期 {{ getSortIcon('date_creation') }}
              </th>
              <th class="table-header-cell uppercase">
                狀態
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-edge">
            <tr
              v-for="task in filteredTasks"
              :key="task.id"
              @click="openTaskDetail(task)"
              class="table-row cursor-pointer"
            >
              <td class="table-cell text-content-tertiary">
                #{{ task.id }}
              </td>
              <td class="table-cell">
                <div class="flex items-center gap-2">
                  <div :class="['w-3 h-3 rounded-full', getTaskColorDotClass(task.color_id)]"></div>
                  <span class="font-medium text-content">{{ task.title }}</span>
                </div>
              </td>
              <td class="table-cell text-content-secondary">
                {{ getColumnName(task.column_id) }}
              </td>
              <td class="table-cell text-content-secondary">
                {{ task.priority || '-' }}
              </td>
              <td class="table-cell">
                <span
                  :class="isTaskOverdue(task.date_due, task.is_active) ? 'text-error font-medium' : 'text-content-secondary'"
                >
                  {{ formatTaskDate(task.date_due) }}
                </span>
              </td>
              <td class="table-cell text-content-secondary">
                {{ formatTaskDate(task.date_creation) }}
              </td>
              <td class="table-cell">
                <span
                  :class="[
                    'px-2 py-1 text-xs rounded',
                    task.is_active ? 'badge-success' : 'badge-neutral'
                  ]"
                >
                  {{ task.is_active ? '開啟' : '已關閉' }}
                </span>
              </td>
            </tr>
            <tr v-if="filteredTasks.length === 0">
              <td colspan="7" class="px-4 py-8 text-center text-content-tertiary">
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

    <!-- Search Modal -->
    <SearchModal
      v-if="showSearchModal"
      :project-id="projectId"
      @close="emit('close-search-modal')"
      @select="handleSearchSelect"
    />
  </div>
</template>
