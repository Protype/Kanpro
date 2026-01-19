<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBoardStore } from '@/stores/board'
import { useTasksStore } from '@/stores/tasks'
import TaskCard from '@/components/TaskCard.vue'
import TaskFormModal from '@/components/TaskFormModal.vue'
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

// Modal state
const showTaskModal = ref(false)
const defaultColumnId = ref<number>(0)
const taskModalRef = ref<InstanceType<typeof TaskFormModal> | null>(null)

// Task detail modal state
const showTaskDetailModal = ref(false)
const selectedTask = ref<Task | null>(null)

onMounted(() => {
  boardStore.fetchBoard(projectId.value)
})

watch(() => route.params.id, (newId) => {
  if (newId) {
    boardStore.fetchBoard(Number(newId))
  }
})

// Handle task query param for deep linking
watch(
  () => route.query.task,
  async (taskId) => {
    if (taskId) {
      const id = Number(taskId)
      // Find task in board columns
      for (const column of boardStore.columns) {
        const task = column.tasks.find(t => t.id === id)
        if (task) {
          selectedTask.value = task
          showTaskDetailModal.value = true
          break
        }
      }
      // Clear query param
      router.replace({ query: {} })
    }
  },
  { immediate: true }
)

const handleTaskClick = (task: Task) => {
  selectedTask.value = task
  showTaskDetailModal.value = true
}

const handleTaskUpdated = async () => {
  // Refresh board to get updated task data
  await boardStore.fetchBoard(projectId.value)
}

const handleSearchSelect = (task: Task) => {
  selectedTask.value = task
  showTaskDetailModal.value = true
  emit('close-search-modal')
}

const openAddTaskModal = (columnId: number) => {
  defaultColumnId.value = columnId
  showTaskModal.value = true
}

const handleCreateTask = async (data: {
  title: string
  description: string
  color_id: string
  column_id: number
}) => {
  try {
    await tasksStore.createTask({
      project_id: projectId.value,
      title: data.title,
      description: data.description || undefined,
      color_id: data.color_id,
      column_id: data.column_id
    })
    showTaskModal.value = false
    // Refresh board
    await boardStore.fetchBoard(projectId.value)
  } catch (error) {
    console.error('Failed to create task:', error)
    alert('建立任務失敗')
  } finally {
    taskModalRef.value?.setSubmitting(false)
  }
}
</script>

<template>
  <div class="h-full flex flex-col bg-surface-secondary">
    <!-- Loading -->
    <div v-if="boardStore.isLoading" class="flex-1 flex items-center justify-center">
      <svg class="animate-spin h-8 w-8 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <!-- Error -->
    <div v-else-if="boardStore.error" class="flex-1 flex items-center justify-center">
      <div class="alert-error max-w-md">
        <p>{{ boardStore.error }}</p>
        <button
          @click="boardStore.fetchBoard(projectId)"
          class="mt-3 text-sm text-error hover:underline"
        >
          重試
        </button>
      </div>
    </div>

    <!-- Board -->
    <main v-else class="flex-1 overflow-x-auto p-4">
      <div class="flex gap-4 h-full min-w-max">
        <!-- Columns -->
        <div
          v-for="column in boardStore.columns"
          :key="column.id"
          class="w-72 flex-shrink-0 bg-surface-tertiary rounded-lg flex flex-col max-h-full"
        >
          <!-- Column Header -->
          <div class="p-3 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <h3 class="font-semibold text-content-secondary">{{ column.title }}</h3>
              <span class="text-xs text-content-tertiary bg-surface-active px-1.5 py-0.5 rounded">
                {{ column.nb_tasks }}
              </span>
            </div>
            <button
              @click="openAddTaskModal(column.id)"
              class="text-content-tertiary hover:text-content-secondary"
              title="新增任務"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <!-- Tasks -->
          <div class="flex-1 overflow-y-auto p-2 space-y-2">
            <TaskCard
              v-for="task in column.tasks"
              :key="task.id"
              :task="task"
              @click="handleTaskClick"
            />

            <!-- Empty state -->
            <div
              v-if="column.tasks.length === 0"
              class="text-center py-8 text-content-tertiary text-sm"
            >
              無任務
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Task Form Modal -->
    <TaskFormModal
      ref="taskModalRef"
      :is-open="showTaskModal"
      :project-id="projectId"
      :columns="boardStore.columns"
      :default-column-id="defaultColumnId"
      @close="showTaskModal = false"
      @submit="handleCreateTask"
    />

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
