<script setup lang="ts">
import type { Task } from '@/types'

defineProps<{
  task: Task
}>()

const emit = defineEmits<{
  click: [task: Task]
}>()

const colorClasses: Record<string, string> = {
  yellow: 'border-l-yellow-500 bg-yellow-50',
  blue: 'border-l-blue-500 bg-blue-50',
  green: 'border-l-green-500 bg-green-50',
  purple: 'border-l-purple-500 bg-purple-50',
  red: 'border-l-red-500 bg-red-50',
  orange: 'border-l-orange-500 bg-orange-50',
  grey: 'border-l-gray-500 bg-gray-50',
  brown: 'border-l-amber-700 bg-amber-50',
  deep_orange: 'border-l-orange-600 bg-orange-50',
  dark_grey: 'border-l-gray-600 bg-gray-50',
  pink: 'border-l-pink-500 bg-pink-50',
  teal: 'border-l-teal-500 bg-teal-50',
  cyan: 'border-l-cyan-500 bg-cyan-50',
  lime: 'border-l-lime-500 bg-lime-50',
  light_green: 'border-l-green-400 bg-green-50',
  amber: 'border-l-amber-500 bg-amber-50'
}

function getColorClass(colorId: string): string {
  return colorClasses[colorId] || 'border-l-gray-300 bg-white'
}

function isOverdue(dateDue?: number): boolean {
  if (!dateDue) return false
  return dateDue * 1000 < Date.now()
}

function formatDate(timestamp?: number): string {
  if (!timestamp) return ''
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString('zh-TW', {
    month: 'short',
    day: 'numeric'
  })
}
</script>

<template>
  <div
    @click="emit('click', task)"
    :class="[
      'border-l-4 rounded shadow-sm hover:shadow-md transition-shadow cursor-pointer p-3',
      getColorClass(task.color_id)
    ]"
  >
    <!-- Task ID -->
    <div class="text-xs text-gray-400 mb-1">#{{ task.id }}</div>

    <!-- Title -->
    <h4 class="text-sm font-medium text-gray-900 line-clamp-2">
      {{ task.title }}
    </h4>

    <!-- Meta info -->
    <div class="mt-2 flex items-center justify-between text-xs text-gray-500">
      <!-- Assignee -->
      <div v-if="task.owner_id" class="flex items-center">
        <div class="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-[10px] text-white">
          {{ task.owner_id }}
        </div>
      </div>
      <div v-else></div>

      <!-- Due date -->
      <div
        v-if="task.date_due"
        :class="[
          'flex items-center',
          isOverdue(task.date_due) ? 'text-red-600 font-medium' : ''
        ]"
      >
        <ph-icon icon="calendar" class="w-3 h-3 mr-1" />
        {{ formatDate(task.date_due) }}
      </div>
    </div>
  </div>
</template>
