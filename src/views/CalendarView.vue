<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTasksStore } from '@/stores/tasks'
import { useBoardStore } from '@/stores/board'
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
const tasksStore = useTasksStore()
const boardStore = useBoardStore()

const projectId = computed(() => Number(route.params.id))

// Current viewing month
const currentDate = ref(new Date())

// Selected task for modal
const selectedTask = ref<Task | null>(null)
const isTaskModalOpen = ref(false)

const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月',
                   '七月', '八月', '九月', '十月', '十一月', '十二月']

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

const currentYear = computed(() => currentDate.value.getFullYear())
const currentMonth = computed(() => currentDate.value.getMonth())
const currentMonthName = computed(() => monthNames[currentMonth.value])

// Get first day of the month (0 = Sunday)
const firstDayOfMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value, 1).getDay()
})

// Get number of days in the month
const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
})

// Get number of days in previous month
const daysInPrevMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value, 0).getDate()
})

// Generate calendar days
const calendarDays = computed(() => {
  const days: { date: number; month: 'prev' | 'current' | 'next'; fullDate: Date }[] = []

  // Previous month's days
  for (let i = firstDayOfMonth.value - 1; i >= 0; i--) {
    const date = daysInPrevMonth.value - i
    days.push({
      date,
      month: 'prev',
      fullDate: new Date(currentYear.value, currentMonth.value - 1, date)
    })
  }

  // Current month's days
  for (let i = 1; i <= daysInMonth.value; i++) {
    days.push({
      date: i,
      month: 'current',
      fullDate: new Date(currentYear.value, currentMonth.value, i)
    })
  }

  // Next month's days to fill the grid (6 rows)
  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      date: i,
      month: 'next',
      fullDate: new Date(currentYear.value, currentMonth.value + 1, i)
    })
  }

  return days
})

// Tasks with due dates
const tasksWithDueDate = computed(() => {
  return tasksStore.allTasks.filter(task => task.date_due && task.date_due > 0)
})

// Get tasks for a specific date
const getTasksForDate = (date: Date): Task[] => {
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() / 1000
  const endOfDay = startOfDay + 86400 - 1

  return tasksWithDueDate.value.filter(task => {
    return task.date_due && task.date_due >= startOfDay && task.date_due <= endOfDay
  })
}

// Check if date is today
const isToday = (date: Date): boolean => {
  const today = new Date()
  return date.getFullYear() === today.getFullYear() &&
         date.getMonth() === today.getMonth() &&
         date.getDate() === today.getDate()
}

// Navigation
const goToPrevMonth = () => {
  currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1)
}

const goToNextMonth = () => {
  currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1)
}

const goToToday = () => {
  currentDate.value = new Date()
}

// Task color mapping
const getTaskColor = (colorId: string): string => {
  const colorMap: Record<string, string> = {
    yellow: 'bg-yellow-400',
    blue: 'bg-blue-400',
    green: 'bg-green-400',
    purple: 'bg-purple-400',
    red: 'bg-red-400',
    orange: 'bg-orange-400',
    grey: 'bg-gray-400',
    cyan: 'bg-cyan-400',
    lime: 'bg-lime-400',
    pink: 'bg-pink-400',
    teal: 'bg-teal-400',
    amber: 'bg-amber-400',
    brown: 'bg-amber-700',
    deep_orange: 'bg-orange-600',
    dark_grey: 'bg-gray-600',
    white: 'bg-gray-200'
  }
  return colorMap[colorId] || 'bg-gray-400'
}

// Open task modal
const openTaskModal = (task: Task) => {
  selectedTask.value = task
  isTaskModalOpen.value = true
}

const closeTaskModal = () => {
  isTaskModalOpen.value = false
  selectedTask.value = null
}

const handleTaskUpdated = async () => {
  await loadData()
}

const loadData = async () => {
  await boardStore.fetchBoard(projectId.value)
  await tasksStore.fetchAllTasks(projectId.value)
}

const handleSearchSelect = (task: Task) => {
  selectedTask.value = task
  isTaskModalOpen.value = true
  emit('close-search-modal')
}

onMounted(() => {
  loadData()
})

watch(projectId, () => {
  loadData()
})
</script>

<template>
  <div class="h-full flex flex-col bg-surface-secondary">
    <!-- Calendar Header -->
    <div
      data-testid="calendar-header"
      class="px-6 py-4 flex items-center justify-between bg-surface border-b border-edge"
    >
      <!-- Month/Year Navigation -->
      <div class="flex items-center gap-4">
        <button
          data-testid="today-btn"
          @click="goToToday"
          class="btn-secondary btn-sm"
        >
          今天
        </button>
        <div class="flex items-center gap-2">
          <button
            data-testid="prev-month"
            @click="goToPrevMonth"
            class="p-1 hover:bg-surface-hover rounded text-content-secondary hover:text-content"
          >
            <font-awesome-icon icon="chevron-left" class="w-5 h-5" />
          </button>
          <span class="text-lg font-medium min-w-[140px] text-center text-content">
            {{ currentYear }} {{ currentMonthName }}
          </span>
          <button
            data-testid="next-month"
            @click="goToNextMonth"
            class="p-1 hover:bg-surface-hover rounded text-content-secondary hover:text-content"
          >
            <font-awesome-icon icon="chevron-right" class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Calendar -->
    <div class="flex-1 p-6 overflow-auto">
      <div class="card h-full flex flex-col">
        <!-- Weekday headers -->
        <div class="grid grid-cols-7 border-b border-edge">
          <div
            v-for="day in weekDays"
            :key="day"
            class="px-2 py-3 text-center text-sm font-medium text-content-tertiary"
          >
            {{ day }}
          </div>
        </div>

        <!-- Calendar grid -->
        <div class="flex-1 grid grid-cols-7 grid-rows-6">
          <div
            v-for="(day, index) in calendarDays"
            :key="index"
            :class="[
              'min-h-[100px] border-r border-b border-edge p-1 overflow-hidden',
              day.month !== 'current' ? 'bg-surface-secondary' : 'bg-surface'
            ]"
          >
            <!-- Date number -->
            <div
              :data-testid="isToday(day.fullDate) ? 'today' : undefined"
              :class="[
                'text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full',
                isToday(day.fullDate) ? 'bg-accent text-content-inverse' : '',
                day.month !== 'current' ? 'text-content-tertiary' : 'text-content'
              ]"
            >
              {{ day.date }}
            </div>

            <!-- Tasks for this day -->
            <div class="space-y-1">
              <div
                v-for="task in getTasksForDate(day.fullDate)"
                :key="task.id"
                @click="openTaskModal(task)"
                :class="[
                  'calendar-task text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80',
                  getTaskColor(task.color_id),
                  task.color_id === 'white' ? 'text-content-secondary' : 'text-white'
                ]"
                :title="task.title"
              >
                {{ task.title }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Task Detail Modal -->
    <TaskDetailModal
      :is-open="isTaskModalOpen"
      :task="selectedTask"
      :columns="boardStore.columns"
      :project-id="projectId"
      @close="closeTaskModal"
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
