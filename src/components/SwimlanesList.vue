<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useSwimlanesStore } from '@/stores/swimlanes'
import { useToast } from '@/stores/toast'
import draggable from 'vuedraggable'
import type { Swimlane } from '@/types'

const props = defineProps<{
  projectId: number
}>()

const emit = defineEmits<{
  updated: []
}>()

const swimlanesStore = useSwimlanesStore()
const toast = useToast()

// Form state
const isAdding = ref(false)
const isSubmitting = ref(false)
const newSwimlaneName = ref('')
const newSwimlaneDescription = ref('')

// Edit state
const editingSwimlaneId = ref<number | null>(null)
const editName = ref('')
const editDescription = ref('')

// Drag state
const localSwimlanes = ref<Swimlane[]>([])
const savingSwimlaneIds = ref<Set<number>>(new Set())

// Sync local swimlanes with store
const syncLocalSwimlanes = () => {
  localSwimlanes.value = [...swimlanesStore.swimlanes].sort((a, b) => a.position - b.position)
}

onMounted(async () => {
  await swimlanesStore.fetchSwimlanes(props.projectId)
  syncLocalSwimlanes()
})

watch(() => props.projectId, async (newId) => {
  if (newId) {
    await swimlanesStore.fetchSwimlanes(newId)
    syncLocalSwimlanes()
  }
})

watch(() => swimlanesStore.swimlanes, () => {
  // Only sync if not currently dragging/saving
  if (savingSwimlaneIds.value.size === 0) {
    syncLocalSwimlanes()
  }
}, { deep: true })

const startAdding = () => {
  isAdding.value = true
  newSwimlaneName.value = ''
  newSwimlaneDescription.value = ''
}

const cancelAdding = () => {
  isAdding.value = false
}

const handleAddSwimlane = async () => {
  if (!newSwimlaneName.value.trim() || isSubmitting.value) return

  isSubmitting.value = true
  const loadingToast = toast.loading('新增泳道中...')
  try {
    await swimlanesStore.addSwimlane(
      props.projectId,
      newSwimlaneName.value.trim(),
      newSwimlaneDescription.value.trim()
    )
    await swimlanesStore.fetchSwimlanes(props.projectId)
    syncLocalSwimlanes()
    toast.update(loadingToast, 'success', '泳道已新增')
    cancelAdding()
    emit('updated')
  } catch (error) {
    console.error('Failed to add swimlane:', error)
    toast.update(loadingToast, 'error', '新增泳道失敗')
  } finally {
    isSubmitting.value = false
  }
}

const startEditing = (swimlane: Swimlane) => {
  editingSwimlaneId.value = swimlane.id
  editName.value = swimlane.name
  editDescription.value = swimlane.description || ''
}

const cancelEditing = () => {
  editingSwimlaneId.value = null
}

const handleSaveSwimlane = async () => {
  if (!editingSwimlaneId.value || !editName.value.trim() || isSubmitting.value) return

  isSubmitting.value = true
  const loadingToast = toast.loading('更新泳道中...')
  try {
    await swimlanesStore.updateSwimlane(
      editingSwimlaneId.value,
      editName.value.trim(),
      editDescription.value.trim()
    )
    await swimlanesStore.fetchSwimlanes(props.projectId)
    syncLocalSwimlanes()
    toast.update(loadingToast, 'success', '泳道已更新')
    cancelEditing()
    emit('updated')
  } catch (error) {
    console.error('Failed to update swimlane:', error)
    toast.update(loadingToast, 'error', '更新泳道失敗')
  } finally {
    isSubmitting.value = false
  }
}

const handleRemoveSwimlane = async (swimlane: Swimlane) => {
  if (!confirm(`確定要刪除泳道「${swimlane.name}」嗎？此操作無法復原。`)) return

  savingSwimlaneIds.value.add(swimlane.id)
  const loadingToast = toast.loading('刪除泳道中...')
  try {
    await swimlanesStore.removeSwimlane(props.projectId, swimlane.id)
    await swimlanesStore.fetchSwimlanes(props.projectId)
    syncLocalSwimlanes()
    toast.update(loadingToast, 'success', '泳道已刪除')
    emit('updated')
  } catch (error) {
    console.error('Failed to remove swimlane:', error)
    toast.update(loadingToast, 'error', '刪除泳道失敗')
  } finally {
    savingSwimlaneIds.value.delete(swimlane.id)
  }
}

const handleToggleActive = async (swimlane: Swimlane) => {
  const action = swimlane.is_active ? '停用' : '啟用'
  savingSwimlaneIds.value.add(swimlane.id)
  const loadingToast = toast.loading(`${action}泳道中...`)
  try {
    if (swimlane.is_active) {
      await swimlanesStore.disableSwimlane(props.projectId, swimlane.id)
    } else {
      await swimlanesStore.enableSwimlane(props.projectId, swimlane.id)
    }
    await swimlanesStore.fetchSwimlanes(props.projectId)
    syncLocalSwimlanes()
    toast.update(loadingToast, 'success', `泳道已${action}`)
    emit('updated')
  } catch (error) {
    console.error('Failed to toggle swimlane status:', error)
    toast.update(loadingToast, 'error', `${action}泳道失敗`)
  } finally {
    savingSwimlaneIds.value.delete(swimlane.id)
  }
}

const handleDragEnd = async (event: any) => {
  const { oldIndex, newIndex } = event
  if (oldIndex === newIndex) return

  const movedSwimlane = localSwimlanes.value[newIndex]
  if (!movedSwimlane) return

  // New position is 1-based
  const newPosition = newIndex + 1

  // Mark as saving
  savingSwimlaneIds.value.add(movedSwimlane.id)

  try {
    await swimlanesStore.changeSwimlanePosition(props.projectId, movedSwimlane.id, newPosition)
    await swimlanesStore.fetchSwimlanes(props.projectId)
    syncLocalSwimlanes()
    emit('updated')
  } catch (error) {
    console.error('Failed to reorder swimlane:', error)
    toast.error('移動泳道失敗')
    // Revert on error
    syncLocalSwimlanes()
  } finally {
    savingSwimlaneIds.value.delete(movedSwimlane.id)
  }
}

const isSwimlaneSaving = (swimlaneId: number) => savingSwimlaneIds.value.has(swimlaneId)
</script>

<template>
  <div class="p-5">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4 h-8">
      <div class="flex items-center gap-2">
        <ph-icon icon="rows" class="w-5 h-5 text-content-tertiary" />
        <h3 class="text-base font-semibold text-content">
          泳道管理
        </h3>
        <span v-if="swimlanesStore.swimlanesCount > 0" class="text-xs text-content-tertiary bg-surface-secondary px-1.5 py-0.5 rounded">
          {{ swimlanesStore.swimlanesCount }}
        </span>
      </div>
      <button
        v-if="!isAdding"
        @click="startAdding"
        class="p-2 text-content-tertiary hover:text-content-secondary hover:bg-surface-hover rounded-md transition-colors"
        title="新增泳道"
      >
        <ph-icon icon="rows-plus-bottom" weight="fill" class="w-5 h-5" />
      </button>
    </div>

    <div class="space-y-3">
      <!-- Add swimlane form -->
      <div v-if="isAdding" class="bg-surface-secondary rounded-lg p-4 space-y-3 border border-edge">
        <div>
          <input
            v-model="newSwimlaneName"
            type="text"
            :disabled="isSubmitting"
            class="w-full px-3 py-2 text-sm bg-surface border border-edge rounded-lg text-content focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="輸入泳道名稱"
          />
        </div>
        <div>
          <input
            v-model="newSwimlaneDescription"
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
            @click="handleAddSwimlane"
            :disabled="!newSwimlaneName.trim() || isSubmitting"
            class="px-4 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <ph-icon v-if="isSubmitting" icon="spinner" class="w-4 h-4 animate-spin" />
            新增
          </button>
        </div>
      </div>

      <!-- Swimlanes list -->
      <draggable
        v-model="localSwimlanes"
        item-key="id"
        handle=".drag-handle"
        ghost-class="opacity-50"
        @end="handleDragEnd"
        class="space-y-2"
      >
        <template #item="{ element: swimlane }">
          <div
            class="group p-3 bg-surface-secondary/50 rounded-lg hover:bg-surface-secondary transition-colors"
          >
            <!-- View mode -->
            <div v-if="editingSwimlaneId !== swimlane.id" class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <!-- Drag handle / Loading indicator -->
                <div class="w-8 h-8 rounded-lg bg-surface-tertiary group-hover:bg-accent/15 flex items-center justify-center relative transition-colors">
                  <ph-icon
                    v-if="isSwimlaneSaving(swimlane.id)"
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

                <!-- Swimlane info -->
                <div class="min-w-0">
                  <div class="font-medium text-sm text-content truncate flex items-center gap-2">
                    {{ swimlane.name }}
                    <span
                      v-if="!swimlane.is_active"
                      class="text-xs px-1.5 py-0.5 bg-surface-tertiary text-content-tertiary rounded"
                    >
                      已停用
                    </span>
                  </div>
                  <div v-if="swimlane.description" class="text-xs text-content-tertiary truncate">
                    {{ swimlane.description }}
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-1">
                <!-- Toggle active button -->
                <button
                  @click="handleToggleActive(swimlane)"
                  :disabled="isSwimlaneSaving(swimlane.id)"
                  class="p-1.5 text-content-tertiary group-hover:text-content-secondary hover:!text-accent hover:bg-accent/10 rounded-md transition-colors disabled:opacity-50"
                  :title="swimlane.is_active ? '停用' : '啟用'"
                >
                  <ph-icon v-if="swimlane.is_active" icon="eye" class="w-4 h-4" />
                  <ph-icon v-else icon="eye-slash" class="w-4 h-4" />
                </button>
                <button
                  @click="startEditing(swimlane)"
                  :disabled="isSwimlaneSaving(swimlane.id)"
                  class="p-1.5 text-content-tertiary group-hover:text-content-secondary hover:!text-accent hover:bg-accent/10 rounded-md transition-colors disabled:opacity-50"
                  title="編輯"
                >
                  <ph-icon icon="pen-to-square" class="w-4 h-4" />
                </button>
                <button
                  @click="handleRemoveSwimlane(swimlane)"
                  :disabled="isSwimlaneSaving(swimlane.id)"
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
                  v-model="editName"
                  type="text"
                  :disabled="isSubmitting"
                  class="w-full px-3 py-2 text-sm bg-surface border border-edge rounded-lg text-content focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="輸入泳道名稱"
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
                  @click="handleSaveSwimlane"
                  :disabled="!editName.trim() || isSubmitting"
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
        v-if="localSwimlanes.length === 0"
        class="py-8 text-center text-content-tertiary text-sm"
      >
        <ph-icon icon="rows" class="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p>尚無泳道</p>
      </div>
    </div>
  </div>
</template>
