<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTasksStore } from '@/stores/tasks'
import { useBoardStore } from '@/stores/board'
import { getTaskColorBgClass } from '@/utils/task'
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
const { t, tm } = useI18n()
const tasksStore = useTasksStore()
const boardStore = useBoardStore()

const projectId = computed(() => Number(route.params.id))

// Current viewing month
const currentDate = ref(new Date())

// Selected task for modal
const selectedTask = ref<Task | null>(null)
const isTaskModalOpen = ref(false)

// Get localized month names and week days from i18n
const monthNames = computed(() => tm('calendar.months') as string[])
const weekDays = computed(() => tm('calendar.weekDays') as string[])

const currentYear = computed(() => currentDate.value.getFullYear())
const currentMonth = computed(() => currentDate.value.getMonth())
const currentMonthName = computed(() => monthNames.value[currentMonth.value])

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
          {{ t('time.today') }}
        </button>
        <div class="flex items-center gap-2">
          <button
            data-testid="prev-month"
            @click="goToPrevMonth"
            class="p-1 hover:bg-surface-hover rounded text-content-secondary hover:text-content"
          >
            <ph-icon icon="chevron-left" class="w-5 h-5" />
          </button>
          <span class="text-lg font-medium min-w-[140px] text-center text-content">
            {{ currentYear }} {{ currentMonthName }}
          </span>
          <button
            data-testid="next-month"
            @click="goToNextMonth"
            class="p-1 hover:bg-surface-hover rounded text-content-secondary hover:text-content"
          >
            <ph-icon icon="chevron-right" class="w-5 h-5" />
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
                  getTaskColorBgClass(task.color_id),
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
