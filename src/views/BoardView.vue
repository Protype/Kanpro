<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBoardStore } from '@/stores/board'
import { useTasksStore } from '@/stores/tasks'
import { useToast } from '@/stores/toast'
import draggable from 'vuedraggable'
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
const toast = useToast()

const projectId = computed(() => Number(route.params.id))

// Collapsed swimlanes state
const collapsedSwimlanes = ref<Set<number>>(new Set())

// Modal state
const showTaskModal = ref(false)
const defaultColumnId = ref<number>(0)
const defaultSwimlaneId = ref<number>(0)
const taskModalRef = ref<InstanceType<typeof TaskFormModal> | null>(null)

// Task detail modal state
const showTaskDetailModal = ref(false)
const selectedTask = ref<Task | null>(null)

// Drag state
const isDragging = ref(false)

onMounted(() => {
  boardStore.fetchBoard(projectId.value)
  loadCollapsedState()
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
      // Find task in board swimlanes
      for (const swimlane of boardStore.swimlanes) {
        for (const column of swimlane.columns) {
          const task = column.tasks.find(t => t.id === id)
          if (task) {
            selectedTask.value = task
            showTaskDetailModal.value = true
            break
          }
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
  await boardStore.fetchBoard(projectId.value)
}

const handleSearchSelect = (task: Task) => {
  selectedTask.value = task
  showTaskDetailModal.value = true
  emit('close-search-modal')
}

const openAddTaskModal = (columnId: number, swimlaneId: number) => {
  defaultColumnId.value = columnId
  defaultSwimlaneId.value = swimlaneId
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
      column_id: data.column_id,
      swimlane_id: defaultSwimlaneId.value || undefined
    })
    showTaskModal.value = false
    await boardStore.fetchBoard(projectId.value)
  } catch (error) {
    console.error('Failed to create task:', error)
    toast.error('建立任務失敗')
  } finally {
    taskModalRef.value?.setSubmitting(false)
  }
}

// Drag and drop handlers
const handleDragStart = () => {
  isDragging.value = true
}

const handleDragEnd = async (evt: { item: HTMLElement; to: HTMLElement; newIndex: number }) => {
  isDragging.value = false

  const taskId = Number(evt.item.dataset.taskId)
  const columnId = Number(evt.to.dataset.columnId)
  const swimlaneId = Number(evt.to.dataset.swimlaneId)
  const position = evt.newIndex + 1 // Kanboard uses 1-based position

  if (!taskId || !columnId || !swimlaneId) return

  // 顯示 loading 通知
  const loadingId = toast.loading('正在更新...')

  try {
    await tasksStore.moveTaskPosition(
      projectId.value,
      taskId,
      columnId,
      position,
      swimlaneId
    )
    // 將 loading 替換為成功通知（漸變動畫）
    toast.update(loadingId, 'success', '任務已移動')
    // 靜默刷新以同步伺服器狀態（不顯示 loading）
    await boardStore.fetchBoard(projectId.value, true)
  } catch (error) {
    console.error('Failed to move task:', error)
    // 將 loading 替換為失敗通知（漸變動畫）
    toast.update(loadingId, 'error', '移動任務失敗')
    // 靜默刷新以還原 UI 狀態
    await boardStore.fetchBoard(projectId.value, true)
  }
}

// Swimlane collapse/expand
const toggleSwimlane = (swimlaneId: number) => {
  if (collapsedSwimlanes.value.has(swimlaneId)) {
    collapsedSwimlanes.value.delete(swimlaneId)
  } else {
    collapsedSwimlanes.value.add(swimlaneId)
  }
  saveCollapsedState()
}

const isSwimlaneCollapsed = (swimlaneId: number) => {
  return collapsedSwimlanes.value.has(swimlaneId)
}

const getSwimlaneTaskCount = (swimlane: typeof boardStore.swimlanes[0]) => {
  return swimlane.columns.reduce((sum, col) => sum + col.tasks.length, 0)
}

// Persist collapsed state
const loadCollapsedState = () => {
  const saved = localStorage.getItem(`kanpro_collapsed_swimlanes_${projectId.value}`)
  if (saved) {
    try {
      const ids = JSON.parse(saved) as number[]
      collapsedSwimlanes.value = new Set(ids)
    } catch {
      // ignore
    }
  }
}

const saveCollapsedState = () => {
  const ids = Array.from(collapsedSwimlanes.value)
  localStorage.setItem(`kanpro_collapsed_swimlanes_${projectId.value}`, JSON.stringify(ids))
}

// Check if project has multiple swimlanes
const hasMultipleSwimlanes = computed(() => boardStore.swimlanes.length > 1)
</script>

<template>
  <div class="h-full flex flex-col bg-surface-secondary">
    <!-- Loading -->
    <div v-if="boardStore.isLoading" class="flex-1 flex items-center justify-center">
      <ph-icon icon="spinner" class="animate-spin h-8 w-8 text-accent" />
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
    <main v-else class="flex-1 overflow-auto p-4">
      <!-- Swimlanes -->
      <div class="space-y-4">
        <div
          v-for="swimlane in boardStore.swimlanes"
          :key="swimlane.id"
          class="swimlane"
        >
          <!-- Swimlane Header (only show if multiple swimlanes) -->
          <div
            v-if="hasMultipleSwimlanes"
            @click="toggleSwimlane(swimlane.id)"
            class="flex items-center gap-2 px-2 py-2 mb-2 cursor-pointer hover:bg-surface-hover rounded-lg transition-colors"
          >
            <ph-icon
              :icon="isSwimlaneCollapsed(swimlane.id) ? 'chevron-right' : 'chevron-down'"
              class="w-4 h-4 text-content-tertiary"
            />
            <span class="font-semibold text-content-secondary">{{ swimlane.name }}</span>
            <span class="text-xs text-content-tertiary bg-surface-active px-1.5 py-0.5 rounded">
              {{ getSwimlaneTaskCount(swimlane) }}
            </span>
          </div>

          <!-- Columns (collapsible) -->
          <div
            v-show="!isSwimlaneCollapsed(swimlane.id)"
            class="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
          >
            <div
              v-for="column in swimlane.columns"
              :key="column.id"
              class="w-72 flex-shrink-0 bg-surface-tertiary rounded-lg flex flex-col max-h-[calc(100vh-200px)]"
            >
              <!-- Column Header -->
              <div class="p-3 flex items-center justify-between border-b border-edge/50">
                <div class="flex items-center gap-2">
                  <h3 class="font-semibold text-content-secondary">{{ column.title }}</h3>
                  <span class="text-xs text-content-tertiary bg-surface-active px-1.5 py-0.5 rounded">
                    {{ column.tasks.length }}
                  </span>
                  <span
                    v-if="column.task_limit > 0 && column.tasks.length >= column.task_limit"
                    class="text-xs text-error font-medium"
                    title="已達 WIP 限制"
                  >
                    WIP
                  </span>
                </div>
                <button
                  @click.stop="openAddTaskModal(column.id, swimlane.id)"
                  class="text-content-tertiary hover:text-content-secondary"
                  title="新增任務"
                >
                  <ph-icon icon="plus" class="w-5 h-5" />
                </button>
              </div>

              <!-- Tasks (draggable) -->
              <draggable
                :list="column.tasks"
                :group="{ name: 'tasks', pull: true, put: true }"
                item-key="id"
                class="flex-1 overflow-y-auto p-2 space-y-2 min-h-[60px]"
                :data-column-id="column.id"
                :data-swimlane-id="swimlane.id"
                ghost-class="opacity-50"
                drag-class="shadow-lg"
                @start="handleDragStart"
                @end="handleDragEnd"
              >
                <template #item="{ element: task }">
                  <div :data-task-id="task.id">
                    <TaskCard
                      :task="task"
                      @click="handleTaskClick"
                    />
                  </div>
                </template>
              </draggable>

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
