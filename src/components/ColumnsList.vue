<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useColumnsStore } from '@/stores/columns'
import type { Column } from '@/types'

const props = defineProps<{
  projectId: number
}>()

const emit = defineEmits<{
  updated: []
}>()

const columnsStore = useColumnsStore()

// Form state
const isAdding = ref(false)
const isSubmitting = ref(false)
const newColumnTitle = ref('')
const newColumnTaskLimit = ref(0)
const newColumnDescription = ref('')

// Edit state
const editingColumnId = ref<number | null>(null)
const editTitle = ref('')
const editTaskLimit = ref(0)
const editDescription = ref('')

onMounted(async () => {
  await columnsStore.fetchColumns(props.projectId)
})

watch(() => props.projectId, async (newId) => {
  if (newId) {
    await columnsStore.fetchColumns(newId)
  }
})

const startAdding = () => {
  isAdding.value = true
  newColumnTitle.value = ''
  newColumnTaskLimit.value = 0
  newColumnDescription.value = ''
}

const cancelAdding = () => {
  isAdding.value = false
}

const handleAddColumn = async () => {
  if (!newColumnTitle.value.trim() || isSubmitting.value) return

  isSubmitting.value = true
  try {
    await columnsStore.addColumn(
      props.projectId,
      newColumnTitle.value.trim(),
      newColumnTaskLimit.value,
      newColumnDescription.value.trim()
    )
    await columnsStore.fetchColumns(props.projectId)
    cancelAdding()
    emit('updated')
  } catch (error) {
    console.error('Failed to add column:', error)
    alert('新增欄位失敗')
  } finally {
    isSubmitting.value = false
  }
}

const startEditing = (column: Column) => {
  editingColumnId.value = column.id
  editTitle.value = column.title
  editTaskLimit.value = column.task_limit
  editDescription.value = column.description || ''
}

const cancelEditing = () => {
  editingColumnId.value = null
}

const handleSaveColumn = async () => {
  if (!editingColumnId.value || !editTitle.value.trim() || isSubmitting.value) return

  isSubmitting.value = true
  try {
    await columnsStore.updateColumn(
      editingColumnId.value,
      editTitle.value.trim(),
      editTaskLimit.value,
      editDescription.value.trim()
    )
    await columnsStore.fetchColumns(props.projectId)
    cancelEditing()
    emit('updated')
  } catch (error) {
    console.error('Failed to update column:', error)
    alert('更新欄位失敗')
  } finally {
    isSubmitting.value = false
  }
}

const handleRemoveColumn = async (column: Column) => {
  if (!confirm(`確定要刪除欄位「${column.title}」嗎？此操作無法復原。`)) return

  try {
    await columnsStore.removeColumn(column.id)
    await columnsStore.fetchColumns(props.projectId)
    emit('updated')
  } catch (error) {
    console.error('Failed to remove column:', error)
    alert('刪除欄位失敗')
  }
}

const handleMoveUp = async (column: Column) => {
  if (column.position <= 1) return

  try {
    await columnsStore.changeColumnPosition(props.projectId, column.id, column.position - 1)
    await columnsStore.fetchColumns(props.projectId)
    emit('updated')
  } catch (error) {
    console.error('Failed to move column:', error)
    alert('移動欄位失敗')
  }
}

const handleMoveDown = async (column: Column) => {
  if (column.position >= columnsStore.columnsCount) return

  try {
    await columnsStore.changeColumnPosition(props.projectId, column.id, column.position + 1)
    await columnsStore.fetchColumns(props.projectId)
    emit('updated')
  } catch (error) {
    console.error('Failed to move column:', error)
    alert('移動欄位失敗')
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-content">
        欄位管理
        <span v-if="columnsStore.columnsCount > 0" class="text-content-tertiary text-sm font-normal">
          ({{ columnsStore.columnsCount }})
        </span>
      </h3>
      <button
        v-if="!isAdding"
        @click="startAdding"
        class="px-3 py-1.5 text-sm bg-accent text-content-inverse rounded-md hover:bg-accent-hover"
      >
        + 新增欄位
      </button>
    </div>

    <!-- Loading -->
    <div v-if="columnsStore.isLoading" class="text-center py-4">
      <svg class="animate-spin h-6 w-6 text-accent mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <div v-else class="space-y-3">
      <!-- Add column form -->
      <div v-if="isAdding" class="bg-surface-secondary rounded-lg p-4 space-y-3">
        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-content-secondary mb-1">欄位名稱 *</label>
            <input
              v-model="newColumnTitle"
              type="text"
              class="w-full px-3 py-2 border border-edge rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-surface text-content"
              placeholder="輸入欄位名稱"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-content-secondary mb-1">WIP 限制</label>
            <input
              v-model.number="newColumnTaskLimit"
              type="number"
              min="0"
              class="w-full px-3 py-2 border border-edge rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-surface text-content"
              placeholder="0 表示不限制"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-content-secondary mb-1">描述</label>
            <input
              v-model="newColumnDescription"
              type="text"
              class="w-full px-3 py-2 border border-edge rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-surface text-content"
              placeholder="選填"
            />
          </div>
        </div>
        <div class="flex gap-2 justify-end">
          <button
            @click="cancelAdding"
            :disabled="isSubmitting"
            class="px-4 py-2 text-sm text-content-secondary hover:text-content"
          >
            取消
          </button>
          <button
            @click="handleAddColumn"
            :disabled="!newColumnTitle.trim() || isSubmitting"
            class="px-4 py-2 text-sm bg-accent text-content-inverse rounded-md hover:bg-accent-hover disabled:opacity-50"
          >
            新增
          </button>
        </div>
      </div>

      <!-- Columns list -->
      <div class="bg-surface rounded-lg border border-edge divide-y divide-edge">
        <div
          v-for="column in columnsStore.sortedColumns"
          :key="column.id"
          class="p-4"
        >
          <!-- View mode -->
          <div v-if="editingColumnId !== column.id" class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <!-- Position controls -->
              <div class="flex flex-col">
                <button
                  @click="handleMoveUp(column)"
                  :disabled="column.position <= 1"
                  class="p-1 text-content-tertiary hover:text-content-secondary disabled:opacity-30"
                  title="上移"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  @click="handleMoveDown(column)"
                  :disabled="column.position >= columnsStore.columnsCount"
                  class="p-1 text-content-tertiary hover:text-content-secondary disabled:opacity-30"
                  title="下移"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              <!-- Column info -->
              <div>
                <div class="font-medium text-content">
                  {{ column.title }}
                  <span v-if="column.task_limit > 0" class="text-sm text-content-secondary ml-2">
                    (WIP: {{ column.task_limit }})
                  </span>
                </div>
                <div v-if="column.description" class="text-sm text-content-secondary">
                  {{ column.description }}
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button
                @click="startEditing(column)"
                class="p-2 text-content-tertiary hover:text-content-secondary"
                title="編輯"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                @click="handleRemoveColumn(column)"
                class="p-2 text-content-tertiary hover:text-error"
                title="刪除"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Edit mode -->
          <div v-else class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-content-secondary mb-1">欄位名稱 *</label>
              <input
                v-model="editTitle"
                type="text"
                class="w-full px-3 py-2 border border-edge rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-surface text-content"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-content-secondary mb-1">WIP 限制</label>
              <input
                v-model.number="editTaskLimit"
                type="number"
                min="0"
                class="w-full px-3 py-2 border border-edge rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-surface text-content"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-content-secondary mb-1">描述</label>
              <input
                v-model="editDescription"
                type="text"
                class="w-full px-3 py-2 border border-edge rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-surface text-content"
              />
            </div>
            <div class="flex gap-2 justify-end">
              <button
                @click="cancelEditing"
                :disabled="isSubmitting"
                class="px-4 py-2 text-sm text-content-secondary hover:text-content"
              >
                取消
              </button>
              <button
                @click="handleSaveColumn"
                :disabled="!editTitle.trim() || isSubmitting"
                class="px-4 py-2 text-sm bg-accent text-content-inverse rounded-md hover:bg-accent-hover disabled:opacity-50"
              >
                儲存
              </button>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div
          v-if="columnsStore.columns.length === 0 && !columnsStore.isLoading"
          class="p-8 text-center text-content-secondary"
        >
          沒有欄位
        </div>
      </div>
    </div>
  </div>
</template>
