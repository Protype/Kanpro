<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useBoardStore } from '@/stores/board'
import { useTasksStore } from '@/stores/tasks'
import TaskCard from '@/components/TaskCard.vue'
import TaskFormModal from '@/components/TaskFormModal.vue'
import TaskDetailModal from '@/components/TaskDetailModal.vue'
import SearchModal from '@/components/SearchModal.vue'
import NotificationsDropdown from '@/components/NotificationsDropdown.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import type { Task } from '@/types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const boardStore = useBoardStore()
const tasksStore = useTasksStore()

const projectId = Number(route.params.id)

// Modal state
const showTaskModal = ref(false)
const defaultColumnId = ref<number>(0)
const taskModalRef = ref<InstanceType<typeof TaskFormModal> | null>(null)

// Task detail modal state
const showTaskDetailModal = ref(false)
const selectedTask = ref<Task | null>(null)

// Search modal state
const showSearchModal = ref(false)

// Keyboard shortcut handler
const handleKeydown = (e: KeyboardEvent) => {
  // Cmd/Ctrl + K to open search
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    showSearchModal.value = true
  }
}

onMounted(() => {
  boardStore.fetchBoard(projectId)
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

watch(() => route.params.id, (newId) => {
  if (newId) {
    boardStore.fetchBoard(Number(newId))
  }
})

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

const goToProjects = () => {
  router.push('/')
}

const handleTaskClick = (task: Task) => {
  selectedTask.value = task
  showTaskDetailModal.value = true
}

const handleTaskUpdated = async () => {
  // Refresh board to get updated task data
  await boardStore.fetchBoard(projectId)
}

const handleSearchSelect = (task: Task) => {
  selectedTask.value = task
  showTaskDetailModal.value = true
  showSearchModal.value = false
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
      project_id: projectId,
      title: data.title,
      description: data.description || undefined,
      color_id: data.color_id,
      column_id: data.column_id
    })
    showTaskModal.value = false
    // Refresh board
    await boardStore.fetchBoard(projectId)
  } catch (error) {
    console.error('Failed to create task:', error)
    alert('建立任務失敗')
  } finally {
    taskModalRef.value?.setSubmitting(false)
  }
}
</script>

<template>
  <div class="min-h-screen bg-surface-secondary flex flex-col">
    <!-- Header -->
    <header class="page-header flex-shrink-0">
      <div class="mx-auto max-w-full px-4 py-3 flex justify-between items-center">
        <div class="flex items-center gap-4">
          <button
            @click="goToProjects"
            class="text-content-secondary hover:text-content"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 class="text-xl font-bold text-content">
            {{ boardStore.project?.name || '載入中...' }}
          </h1>
          <div class="flex border border-edge rounded-md overflow-hidden">
            <button
              class="px-3 py-1 text-sm bg-accent text-content-inverse"
            >
              看板
            </button>
            <button
              @click="router.push(`/projects/${projectId}/list`)"
              class="px-3 py-1 text-sm bg-surface-secondary text-content hover:bg-surface-hover"
            >
              清單
            </button>
            <button
              @click="router.push(`/projects/${projectId}/calendar`)"
              class="px-3 py-1 text-sm bg-surface-secondary text-content hover:bg-surface-hover"
            >
              日曆
            </button>
          </div>
          <!-- Settings button -->
          <button
            @click="router.push(`/projects/${projectId}/settings`)"
            class="p-2 text-content-tertiary hover:text-content-secondary hover:bg-surface-hover rounded"
            title="專案設定"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
        <div class="flex items-center gap-4">
          <!-- Search button -->
          <button
            @click="showSearchModal = true"
            class="flex items-center gap-2 px-3 py-1.5 text-sm text-content-tertiary bg-surface-secondary hover:bg-surface-hover rounded-md"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>搜尋</span>
            <kbd class="hidden sm:inline-block px-1.5 py-0.5 text-xs bg-surface-tertiary rounded">⌘K</kbd>
          </button>
          <ThemeToggle />
          <NotificationsDropdown />
          <span class="text-content-secondary text-sm">
            {{ authStore.user?.name || authStore.user?.username }}
          </span>
          <button
            @click="handleLogout"
            class="btn-secondary btn-sm"
          >
            登出
          </button>
        </div>
      </div>
    </header>

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
      :is-open="showSearchModal"
      :project-id="projectId"
      @close="showSearchModal = false"
      @select="handleSearchSelect"
    />
  </div>
</template>
