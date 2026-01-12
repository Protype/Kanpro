<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { BoardColumn } from '@/stores/board'

const props = defineProps<{
  isOpen: boolean
  projectId: number
  columns: BoardColumn[]
  defaultColumnId?: number
}>()

const emit = defineEmits<{
  close: []
  submit: [data: {
    title: string
    description: string
    color_id: string
    column_id: number
  }]
}>()

const title = ref('')
const description = ref('')
const colorId = ref('yellow')
const columnId = ref<number>(0)
const isSubmitting = ref(false)

const colors = [
  { id: 'yellow', name: '黃色', class: 'bg-yellow-500' },
  { id: 'blue', name: '藍色', class: 'bg-blue-500' },
  { id: 'green', name: '綠色', class: 'bg-green-500' },
  { id: 'purple', name: '紫色', class: 'bg-purple-500' },
  { id: 'red', name: '紅色', class: 'bg-red-500' },
  { id: 'orange', name: '橘色', class: 'bg-orange-500' },
  { id: 'grey', name: '灰色', class: 'bg-gray-500' },
  { id: 'cyan', name: '青色', class: 'bg-cyan-500' }
]

const isValid = computed(() => title.value.trim().length > 0)

watch(() => props.isOpen, (open) => {
  if (open) {
    title.value = ''
    description.value = ''
    colorId.value = 'yellow'
    columnId.value = props.defaultColumnId || props.columns[0]?.id || 0
  }
})

watch(() => props.defaultColumnId, (id) => {
  if (id) {
    columnId.value = id
  }
})

const handleSubmit = () => {
  if (!isValid.value || isSubmitting.value) return

  isSubmitting.value = true
  emit('submit', {
    title: title.value.trim(),
    description: description.value.trim(),
    color_id: colorId.value,
    column_id: columnId.value
  })
}

const handleClose = () => {
  if (!isSubmitting.value) {
    emit('close')
  }
}

defineExpose({
  setSubmitting: (value: boolean) => {
    isSubmitting.value = value
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 overflow-y-auto"
    >
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        @click="handleClose"
      ></div>

      <!-- Modal -->
      <div class="flex min-h-full items-center justify-center p-4">
        <div
          class="relative bg-white rounded-lg shadow-xl w-full max-w-lg"
          @click.stop
        >
          <!-- Header -->
          <div class="flex items-center justify-between p-4 border-b">
            <h3 class="text-lg font-semibold text-gray-900">新增任務</h3>
            <button
              @click="handleClose"
              class="text-gray-400 hover:text-gray-500"
              :disabled="isSubmitting"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleSubmit" class="p-4 space-y-4">
            <!-- Title -->
            <div>
              <label for="title" class="block text-sm font-medium text-gray-700 mb-1">
                標題 <span class="text-red-500">*</span>
              </label>
              <input
                id="title"
                v-model="title"
                type="text"
                required
                :disabled="isSubmitting"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="輸入任務標題"
              />
            </div>

            <!-- Description -->
            <div>
              <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
                描述
              </label>
              <textarea
                id="description"
                v-model="description"
                rows="3"
                :disabled="isSubmitting"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                placeholder="輸入任務描述（選填）"
              ></textarea>
            </div>

            <!-- Column -->
            <div>
              <label for="column" class="block text-sm font-medium text-gray-700 mb-1">
                欄位
              </label>
              <select
                id="column"
                v-model="columnId"
                :disabled="isSubmitting"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option
                  v-for="column in columns"
                  :key="column.id"
                  :value="column.id"
                >
                  {{ column.title }}
                </option>
              </select>
            </div>

            <!-- Color -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                顏色
              </label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="color in colors"
                  :key="color.id"
                  type="button"
                  @click="colorId = color.id"
                  :disabled="isSubmitting"
                  :class="[
                    'w-8 h-8 rounded-full transition-transform',
                    color.class,
                    colorId === color.id ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'
                  ]"
                  :title="color.name"
                ></button>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                @click="handleClose"
                :disabled="isSubmitting"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="submit"
                :disabled="!isValid || isSubmitting"
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <svg v-if="isSubmitting" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ isSubmitting ? '建立中...' : '建立任務' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>
