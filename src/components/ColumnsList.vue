<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useColumnsStore } from '@/stores/columns'
import { useToast } from '@/stores/toast'
import draggable from 'vuedraggable'
import type { Column } from '@/types'

const props = defineProps<{
  projectId: number
}>()

const emit = defineEmits<{
  updated: []
}>()

const columnsStore = useColumnsStore()
const toast = useToast()

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

// Drag state
const localColumns = ref<Column[]>([])
const savingColumnIds = ref<Set<number>>(new Set())

// Sync local columns with store
const syncLocalColumns = () => {
  localColumns.value = [...columnsStore.sortedColumns]
}

onMounted(async () => {
  await columnsStore.fetchColumns(props.projectId)
  syncLocalColumns()
})

watch(() => props.projectId, async (newId) => {
  if (newId) {
    await columnsStore.fetchColumns(newId)
    syncLocalColumns()
  }
})

watch(() => columnsStore.sortedColumns, () => {
  // Only sync if not currently dragging/saving
  if (savingColumnIds.value.size === 0) {
    syncLocalColumns()
  }
}, { deep: true })

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
  const loadingToast = toast.loading('新增清單中...')
  try {
    await columnsStore.addColumn(
      props.projectId,
      newColumnTitle.value.trim(),
      newColumnTaskLimit.value,
      newColumnDescription.value.trim()
    )
    await columnsStore.fetchColumns(props.projectId)
    syncLocalColumns()
    toast.update(loadingToast, 'success', '清單已新增')
    cancelAdding()
    emit('updated')
  } catch (error) {
    console.error('Failed to add column:', error)
    toast.update(loadingToast, 'error', '新增清單失敗')
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
  const loadingToast = toast.loading('更新清單中...')
  try {
    await columnsStore.updateColumn(
      editingColumnId.value,
      editTitle.value.trim(),
      editTaskLimit.value,
      editDescription.value.trim()
    )
    await columnsStore.fetchColumns(props.projectId)
    syncLocalColumns()
    toast.update(loadingToast, 'success', '清單已更新')
    cancelEditing()
    emit('updated')
  } catch (error) {
    console.error('Failed to update column:', error)
    toast.update(loadingToast, 'error', '更新清單失敗')
  } finally {
    isSubmitting.value = false
  }
}

const handleRemoveColumn = async (column: Column) => {
  if (!confirm(`確定要刪除清單「${column.title}」嗎？此操作無法復原。`)) return

  savingColumnIds.value.add(column.id)
  const loadingToast = toast.loading('刪除清單中...')
  try {
    await columnsStore.removeColumn(column.id)
    await columnsStore.fetchColumns(props.projectId)
    syncLocalColumns()
    toast.update(loadingToast, 'success', '清單已刪除')
    emit('updated')
  } catch (error) {
    console.error('Failed to remove column:', error)
    toast.update(loadingToast, 'error', '刪除清單失敗')
  } finally {
    savingColumnIds.value.delete(column.id)
  }
}

const handleDragEnd = async (event: any) => {
  const { oldIndex, newIndex } = event
  if (oldIndex === newIndex) return

  const movedColumn = localColumns.value[newIndex]
  if (!movedColumn) return

  // New position is 1-based
  const newPosition = newIndex + 1

  // Mark as saving
  savingColumnIds.value.add(movedColumn.id)

  try {
    await columnsStore.changeColumnPosition(props.projectId, movedColumn.id, newPosition)
    await columnsStore.fetchColumns(props.projectId)
    syncLocalColumns()
    emit('updated')
  } catch (error) {
    console.error('Failed to reorder column:', error)
    toast.error('移動清單失敗')
    // Revert on error
    syncLocalColumns()
  } finally {
    savingColumnIds.value.delete(movedColumn.id)
  }
}

const isColumnSaving = (columnId: number) => savingColumnIds.value.has(columnId)
</script>

<template>
  <div class="p-5">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4 h-8">
      <div class="flex items-center gap-2">
        <ph-icon icon="columns" class="w-5 h-5 text-content-tertiary" />
        <h3 class="text-base font-semibold text-content">
          清單管理
        </h3>
        <span v-if="columnsStore.columnsCount > 0" class="text-xs text-content-tertiary bg-surface-secondary px-1.5 py-0.5 rounded">
          {{ columnsStore.columnsCount }}
        </span>
      </div>
      <button
        v-if="!isAdding"
        @click="startAdding"
        class="p-2 text-content-tertiary hover:text-content-secondary hover:bg-surface-hover rounded-md transition-colors"
        title="新增清單"
      >
        <ph-icon icon="columns-plus-right" weight="fill" class="w-5 h-5" />
      </button>
    </div>
    <p class="text-xs text-content-tertiary mb-4 -mt-2">專案中流程階段清單</p>

    <div class="space-y-3">
      <!-- Add column form -->
      <div v-if="isAdding" class="bg-surface-secondary rounded-lg p-4 space-y-3 border border-edge">
        <div>
          <input
            v-model="newColumnTitle"
            type="text"
            :disabled="isSubmitting"
            class="w-full px-3 py-2 text-sm bg-surface border border-edge rounded-lg text-content focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="輸入清單名稱"
          />
        </div>
        <div>
          <input
            v-model.number="newColumnTaskLimit"
            type="number"
            min="0"
            :disabled="isSubmitting"
            class="w-full px-3 py-2 text-sm bg-surface border border-edge rounded-lg text-content focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="WIP 限制（0 表示不限制）"
          />
        </div>
        <div>
          <input
            v-model="newColumnDescription"
            type="text"
            :disabled="isSubmitting"
            class="w-full px-3 py-2 text-sm bg-surface border border-edge rounded-lg text-content focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="描述（選填）"
          />
        </div>
        <div class="flex gap-2 justify-end">
          <button
            @click="cancelAdding"
            :disabled="isSubmitting"
            class="px-4 py-2 text-sm text-content-secondary hover:text-content transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            @click="handleAddColumn"
            :disabled="!newColumnTitle.trim() || isSubmitting"
            class="px-4 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <ph-icon v-if="isSubmitting" icon="spinner" class="w-4 h-4 animate-spin" />
            新增
          </button>
        </div>
      </div>

      <!-- Columns list -->
      <draggable
        v-model="localColumns"
        item-key="id"
        handle=".drag-handle"
        ghost-class="opacity-50"
        @end="handleDragEnd"
        class="space-y-2"
      >
        <template #item="{ element: column }">
          <div
            class="group p-3 bg-surface-secondary/50 rounded-lg hover:bg-surface-secondary transition-colors"
          >
            <!-- View mode -->
            <div v-if="editingColumnId !== column.id" class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <!-- Drag handle / Loading indicator -->
                <div class="w-8 h-8 rounded-lg bg-surface-tertiary group-hover:bg-accent/15 flex items-center justify-center relative transition-colors">
                  <ph-icon
                    v-if="isColumnSaving(column.id)"
                    icon="spinner"
                    class="w-4 h-4 text-accent animate-spin"
                  />
                  <ph-icon
                    v-else
                    icon="dots-six-vertical"
                    weight="bold"
                    class="w-4 h-4 text-content-tertiary group-hover:text-accent drag-handle cursor-grab active:cursor-grabbing transition-colors"
                  />
                </div>

                <!-- Column info -->
                <div class="min-w-0">
                  <div class="font-medium text-sm text-content truncate flex items-center gap-2">
                    {{ column.title }}
                    <span v-if="column.task_limit > 0" class="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded">
                      WIP: {{ column.task_limit }}
                    </span>
                  </div>
                  <div v-if="column.description" class="text-xs text-content-tertiary truncate">
                    {{ column.description }}
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-1">
                <button
                  @click="startEditing(column)"
                  :disabled="isColumnSaving(column.id)"
                  class="p-1.5 text-content-tertiary group-hover:text-content-secondary hover:!text-accent hover:bg-accent/10 rounded-md transition-colors disabled:opacity-50"
                  title="編輯"
                >
                  <ph-icon icon="pen-to-square" class="w-4 h-4" />
                </button>
                <button
                  @click="handleRemoveColumn(column)"
                  :disabled="isColumnSaving(column.id)"
                  class="p-1.5 text-content-tertiary group-hover:text-content-secondary hover:!text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors disabled:opacity-50"
                  title="刪除"
                >
                  <ph-icon icon="trash" class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Edit mode -->
            <div v-else class="space-y-3">
              <div>
                <input
                  v-model="editTitle"
                  type="text"
                  :disabled="isSubmitting"
                  class="w-full px-3 py-2 text-sm bg-surface border border-edge rounded-lg text-content focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="輸入清單名稱"
                />
              </div>
              <div>
                <input
                  v-model.number="editTaskLimit"
                  type="number"
                  min="0"
                  :disabled="isSubmitting"
                  class="w-full px-3 py-2 text-sm bg-surface border border-edge rounded-lg text-content focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="WIP 限制（0 表示不限制）"
                />
              </div>
              <div>
                <input
                  v-model="editDescription"
                  type="text"
                  :disabled="isSubmitting"
                  class="w-full px-3 py-2 text-sm bg-surface border border-edge rounded-lg text-content focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="描述（選填）"
                />
              </div>
              <div class="flex gap-2 justify-end">
                <button
                  @click="cancelEditing"
                  :disabled="isSubmitting"
                  class="px-4 py-2 text-sm text-content-secondary hover:text-content transition-colors disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  @click="handleSaveColumn"
                  :disabled="!editTitle.trim() || isSubmitting"
                  class="px-4 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  <ph-icon v-if="isSubmitting" icon="spinner" class="w-4 h-4 animate-spin" />
                  儲存
                </button>
              </div>
            </div>
          </div>
        </template>
      </draggable>

      <!-- Empty state -->
      <div
        v-if="localColumns.length === 0"
        class="py-8 text-center text-content-tertiary text-sm"
      >
        <ph-icon icon="columns" class="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p>尚無清單</p>
      </div>
    </div>
  </div>
</template>
