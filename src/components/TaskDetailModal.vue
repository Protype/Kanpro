<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import SubtasksList from '@/components/SubtasksList.vue'
import type { BoardColumn } from '@/stores/board'
import type { Task } from '@/types'

const props = defineProps<{
  isOpen: boolean
  task: Task | null
  columns: BoardColumn[]
  projectId: number
}>()

const emit = defineEmits<{
  close: []
  updated: []
}>()

const tasksStore = useTasksStore()

// Edit states
const isEditingTitle = ref(false)
const isEditingDescription = ref(false)
const editTitle = ref('')
const editDescription = ref('')
const isUpdating = ref(false)

const colors = [
  { id: 'yellow', name: '黃色', class: 'bg-yellow-500' },
  { id: 'blue', name: '藍色', class: 'bg-blue-500' },
  { id: 'green', name: '綠色', class: 'bg-green-500' },
  { id: 'purple', name: '紫色', class: 'bg-purple-500' },
  { id: 'red', name: '紅色', class: 'bg-red-500' },
  { id: 'orange', name: '橘色', class: 'bg-orange-500' },
  { id: 'grey', name: '灰色', class: 'bg-gray-500' },
  { id: 'cyan', name: '青色', class: 'bg-cyan-500' },
  { id: 'lime', name: '萊姆綠', class: 'bg-lime-500' },
  { id: 'pink', name: '粉紅', class: 'bg-pink-500' },
  { id: 'teal', name: '藍綠', class: 'bg-teal-500' },
  { id: 'amber', name: '琥珀', class: 'bg-amber-500' },
  { id: 'brown', name: '棕色', class: 'bg-amber-800' },
  { id: 'deep_orange', name: '深橘', class: 'bg-orange-700' },
  { id: 'dark_grey', name: '深灰', class: 'bg-gray-700' },
  { id: 'white', name: '白色', class: 'bg-white border border-gray-300' }
]

const statusLabel = computed(() => props.task?.is_active ? '開啟' : '已關閉')

const formattedCreationDate = computed(() => {
  if (!props.task?.date_creation) return '-'
  return new Date(props.task.date_creation * 1000).toLocaleString('zh-TW')
})

const formattedModificationDate = computed(() => {
  if (!props.task?.date_modification) return '-'
  return new Date(props.task.date_modification * 1000).toLocaleString('zh-TW')
})

const formattedDueDate = computed(() => {
  if (!props.task?.date_due) return null
  return new Date(props.task.date_due * 1000).toLocaleDateString('zh-TW')
})

const currentColumn = computed(() => {
  if (!props.task) return null
  return props.columns.find(col => col.id === props.task?.column_id)
})

watch(() => props.isOpen, (open) => {
  if (open && props.task) {
    editTitle.value = props.task.title
    editDescription.value = props.task.description || ''
    isEditingTitle.value = false
    isEditingDescription.value = false
  }
})

const handleClose = () => {
  if (!isUpdating.value) {
    emit('close')
  }
}

const startEditTitle = () => {
  if (props.task) {
    editTitle.value = props.task.title
    isEditingTitle.value = true
  }
}

const cancelEditTitle = () => {
  isEditingTitle.value = false
  if (props.task) {
    editTitle.value = props.task.title
  }
}

const saveTitle = async () => {
  if (!props.task || !editTitle.value.trim()) return

  isUpdating.value = true
  try {
    await tasksStore.updateTask(props.task.id, { title: editTitle.value.trim() })
    isEditingTitle.value = false
    emit('updated')
  } catch (error) {
    console.error('Failed to update title:', error)
    alert('更新標題失敗')
  } finally {
    isUpdating.value = false
  }
}

const startEditDescription = () => {
  if (props.task) {
    editDescription.value = props.task.description || ''
    isEditingDescription.value = true
  }
}

const cancelEditDescription = () => {
  isEditingDescription.value = false
  if (props.task) {
    editDescription.value = props.task.description || ''
  }
}

const saveDescription = async () => {
  if (!props.task) return

  isUpdating.value = true
  try {
    await tasksStore.updateTask(props.task.id, { description: editDescription.value })
    isEditingDescription.value = false
    emit('updated')
  } catch (error) {
    console.error('Failed to update description:', error)
    alert('更新描述失敗')
  } finally {
    isUpdating.value = false
  }
}

const updateColor = async (colorId: string) => {
  if (!props.task || props.task.color_id === colorId) return

  isUpdating.value = true
  try {
    await tasksStore.updateTask(props.task.id, { color_id: colorId })
    emit('updated')
  } catch (error) {
    console.error('Failed to update color:', error)
    alert('更新顏色失敗')
  } finally {
    isUpdating.value = false
  }
}

const closeTask = async () => {
  if (!props.task) return

  isUpdating.value = true
  try {
    await tasksStore.closeTask(props.task.id)
    emit('updated')
  } catch (error) {
    console.error('Failed to close task:', error)
    alert('關閉任務失敗')
  } finally {
    isUpdating.value = false
  }
}

const openTask = async () => {
  if (!props.task) return

  isUpdating.value = true
  try {
    await tasksStore.openTask(props.task.id)
    emit('updated')
  } catch (error) {
    console.error('Failed to open task:', error)
    alert('重新開啟任務失敗')
  } finally {
    isUpdating.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen && task"
      data-testid="task-detail-modal"
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
          class="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          @click.stop
        >
          <!-- Header -->
          <div class="flex items-start justify-between p-4 border-b">
            <div class="flex-1 min-w-0">
              <!-- Task ID -->
              <div class="text-sm text-gray-500 mb-1">#{{ task.id }}</div>

              <!-- Title -->
              <div v-if="!isEditingTitle" class="flex items-center gap-2">
                <h2 class="text-xl font-semibold text-gray-900 truncate">{{ task.title }}</h2>
                <button
                  data-testid="edit-title-btn"
                  @click="startEditTitle"
                  class="text-gray-400 hover:text-gray-600"
                  title="編輯標題"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
              <div v-else class="flex items-center gap-2">
                <input
                  data-testid="title-input"
                  v-model="editTitle"
                  type="text"
                  class="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  @keyup.enter="saveTitle"
                  @keyup.escape="cancelEditTitle"
                />
                <button
                  data-testid="save-title-btn"
                  @click="saveTitle"
                  :disabled="isUpdating"
                  class="text-green-600 hover:text-green-800"
                >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button
                  @click="cancelEditTitle"
                  class="text-gray-400 hover:text-gray-600"
                >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Close button -->
            <button
              data-testid="close-modal-btn"
              @click="handleClose"
              class="text-gray-400 hover:text-gray-500 ml-4"
              :disabled="isUpdating"
            >
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-4">
            <div class="grid grid-cols-3 gap-6">
              <!-- Main content (left side) -->
              <div class="col-span-2 space-y-6">
                <!-- Description -->
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="text-sm font-medium text-gray-700">描述</h3>
                    <button
                      v-if="!isEditingDescription"
                      @click="startEditDescription"
                      class="text-gray-400 hover:text-gray-600 text-sm"
                    >
                      編輯
                    </button>
                  </div>
                  <div v-if="!isEditingDescription">
                    <p v-if="task.description" class="text-gray-600 whitespace-pre-wrap">{{ task.description }}</p>
                    <p v-else class="text-gray-400 italic">無描述</p>
                  </div>
                  <div v-else class="space-y-2">
                    <textarea
                      v-model="editDescription"
                      rows="4"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="輸入任務描述..."
                    ></textarea>
                    <div class="flex gap-2">
                      <button
                        @click="saveDescription"
                        :disabled="isUpdating"
                        class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        儲存
                      </button>
                      <button
                        @click="cancelEditDescription"
                        class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Subtasks -->
                <div class="border-t pt-4">
                  <SubtasksList
                    :task-id="task.id"
                    @updated="emit('updated')"
                  />
                </div>
              </div>

              <!-- Sidebar (right side) -->
              <div class="space-y-4">
                <!-- Status -->
                <div>
                  <h3 class="text-sm font-medium text-gray-700 mb-2">狀態</h3>
                  <div class="flex items-center gap-2">
                    <span
                      :class="[
                        'px-2 py-1 text-xs font-medium rounded',
                        task.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      ]"
                    >
                      {{ statusLabel }}
                    </span>
                    <button
                      v-if="task.is_active"
                      data-testid="close-task-btn"
                      @click="closeTask"
                      :disabled="isUpdating"
                      class="text-xs text-gray-500 hover:text-gray-700"
                    >
                      關閉任務
                    </button>
                    <button
                      v-else
                      data-testid="open-task-btn"
                      @click="openTask"
                      :disabled="isUpdating"
                      class="text-xs text-blue-500 hover:text-blue-700"
                    >
                      重新開啟
                    </button>
                  </div>
                </div>

                <!-- Column -->
                <div>
                  <h3 class="text-sm font-medium text-gray-700 mb-2">欄位</h3>
                  <span class="text-sm text-gray-600">{{ currentColumn?.title || '-' }}</span>
                </div>

                <!-- Color -->
                <div data-testid="color-selector">
                  <h3 class="text-sm font-medium text-gray-700 mb-2">顏色</h3>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="color in colors"
                      :key="color.id"
                      :data-testid="`color-${color.id}`"
                      @click="updateColor(color.id)"
                      :disabled="isUpdating"
                      :class="[
                        'w-6 h-6 rounded-full transition-transform',
                        color.class,
                        task.color_id === color.id ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : 'hover:scale-105'
                      ]"
                      :title="color.name"
                    ></button>
                  </div>
                </div>

                <!-- Due Date -->
                <div data-testid="due-date" v-if="formattedDueDate">
                  <h3 class="text-sm font-medium text-gray-700 mb-2">到期日</h3>
                  <span class="text-sm text-gray-600">{{ formattedDueDate }}</span>
                </div>

                <!-- Priority -->
                <div v-if="task.priority">
                  <h3 class="text-sm font-medium text-gray-700 mb-2">優先級</h3>
                  <span class="text-sm text-gray-600">{{ task.priority }}</span>
                </div>

                <!-- Dates -->
                <div class="pt-4 border-t space-y-2">
                  <div>
                    <span class="text-xs text-gray-500">建立於</span>
                    <span class="text-xs text-gray-600 ml-1">{{ formattedCreationDate }}</span>
                  </div>
                  <div>
                    <span class="text-xs text-gray-500">更新於</span>
                    <span class="text-xs text-gray-600 ml-1">{{ formattedModificationDate }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
