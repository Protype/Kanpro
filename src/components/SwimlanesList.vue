<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSwimlanesStore } from '@/stores/swimlanes'
import type { Swimlane } from '@/types'

const props = defineProps<{
  projectId: number
}>()

const emit = defineEmits<{
  updated: []
}>()

const swimlanesStore = useSwimlanesStore()

// Form state
const isAdding = ref(false)
const isSubmitting = ref(false)
const newSwimlaneName = ref('')
const newSwimlaneDescription = ref('')

// Edit state
const editingSwimlaneId = ref<number | null>(null)
const editName = ref('')
const editDescription = ref('')

onMounted(async () => {
  await swimlanesStore.fetchSwimlanes(props.projectId)
})

watch(() => props.projectId, async (newId) => {
  if (newId) {
    await swimlanesStore.fetchSwimlanes(newId)
  }
})

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
  try {
    await swimlanesStore.addSwimlane(
      props.projectId,
      newSwimlaneName.value.trim(),
      newSwimlaneDescription.value.trim()
    )
    await swimlanesStore.fetchSwimlanes(props.projectId)
    cancelAdding()
    emit('updated')
  } catch (error) {
    console.error('Failed to add swimlane:', error)
    alert('新增泳道失敗')
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
  try {
    await swimlanesStore.updateSwimlane(
      editingSwimlaneId.value,
      editName.value.trim(),
      editDescription.value.trim()
    )
    await swimlanesStore.fetchSwimlanes(props.projectId)
    cancelEditing()
    emit('updated')
  } catch (error) {
    console.error('Failed to update swimlane:', error)
    alert('更新泳道失敗')
  } finally {
    isSubmitting.value = false
  }
}

const handleRemoveSwimlane = async (swimlane: Swimlane) => {
  if (!confirm(`確定要刪除泳道「${swimlane.name}」嗎？此操作無法復原。`)) return

  try {
    await swimlanesStore.removeSwimlane(props.projectId, swimlane.id)
    await swimlanesStore.fetchSwimlanes(props.projectId)
    emit('updated')
  } catch (error) {
    console.error('Failed to remove swimlane:', error)
    alert('刪除泳道失敗')
  }
}

const handleToggleActive = async (swimlane: Swimlane) => {
  try {
    if (swimlane.is_active) {
      await swimlanesStore.disableSwimlane(props.projectId, swimlane.id)
    } else {
      await swimlanesStore.enableSwimlane(props.projectId, swimlane.id)
    }
    await swimlanesStore.fetchSwimlanes(props.projectId)
    emit('updated')
  } catch (error) {
    console.error('Failed to toggle swimlane status:', error)
    alert('切換泳道狀態失敗')
  }
}

const handleMoveUp = async (swimlane: Swimlane) => {
  if (swimlane.position <= 1) return

  try {
    await swimlanesStore.changeSwimlanePosition(props.projectId, swimlane.id, swimlane.position - 1)
    await swimlanesStore.fetchSwimlanes(props.projectId)
    emit('updated')
  } catch (error) {
    console.error('Failed to move swimlane:', error)
    alert('移動泳道失敗')
  }
}

const handleMoveDown = async (swimlane: Swimlane) => {
  if (swimlane.position >= swimlanesStore.swimlanesCount) return

  try {
    await swimlanesStore.changeSwimlanePosition(props.projectId, swimlane.id, swimlane.position + 1)
    await swimlanesStore.fetchSwimlanes(props.projectId)
    emit('updated')
  } catch (error) {
    console.error('Failed to move swimlane:', error)
    alert('移動泳道失敗')
  }
}

const sortedSwimlanes = computed(() => {
  return [...swimlanesStore.swimlanes].sort((a, b) => a.position - b.position)
})
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900">
        泳道管理
        <span v-if="swimlanesStore.swimlanesCount > 0" class="text-gray-400 text-sm font-normal">
          ({{ swimlanesStore.swimlanesCount }})
        </span>
      </h3>
      <button
        v-if="!isAdding"
        @click="startAdding"
        class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        + 新增泳道
      </button>
    </div>

    <!-- Loading -->
    <div v-if="swimlanesStore.isLoading" class="text-center py-4">
      <font-awesome-icon icon="spinner" class="animate-spin h-6 w-6 text-blue-600 mx-auto" />
    </div>

    <div v-else class="space-y-3">
      <!-- Add swimlane form -->
      <div v-if="isAdding" class="bg-gray-50 rounded-lg p-4 space-y-3">
        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">泳道名稱 *</label>
            <input
              v-model="newSwimlaneName"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="輸入泳道名稱"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <input
              v-model="newSwimlaneDescription"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="選填"
            />
          </div>
        </div>
        <div class="flex gap-2 justify-end">
          <button
            @click="cancelAdding"
            :disabled="isSubmitting"
            class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            取消
          </button>
          <button
            @click="handleAddSwimlane"
            :disabled="!newSwimlaneName.trim() || isSubmitting"
            class="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            新增
          </button>
        </div>
      </div>

      <!-- Swimlanes list -->
      <div class="bg-white rounded-lg border divide-y">
        <div
          v-for="swimlane in sortedSwimlanes"
          :key="swimlane.id"
          class="p-4"
        >
          <!-- View mode -->
          <div v-if="editingSwimlaneId !== swimlane.id" class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <!-- Position controls -->
              <div class="flex flex-col">
                <button
                  @click="handleMoveUp(swimlane)"
                  :disabled="swimlane.position <= 1"
                  class="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  title="上移"
                >
                  <font-awesome-icon icon="chevron-up" class="w-4 h-4" />
                </button>
                <button
                  @click="handleMoveDown(swimlane)"
                  :disabled="swimlane.position >= swimlanesStore.swimlanesCount"
                  class="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  title="下移"
                >
                  <font-awesome-icon icon="chevron-down" class="w-4 h-4" />
                </button>
              </div>

              <!-- Swimlane info -->
              <div>
                <div class="font-medium text-gray-900 flex items-center gap-2">
                  {{ swimlane.name }}
                  <span
                    v-if="!swimlane.is_active"
                    class="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded"
                  >
                    已停用
                  </span>
                </div>
                <div v-if="swimlane.description" class="text-sm text-gray-500">
                  {{ swimlane.description }}
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <!-- Toggle active button -->
              <button
                @click="handleToggleActive(swimlane)"
                class="p-2 text-gray-400 hover:text-gray-600"
                :title="swimlane.is_active ? '停用' : '啟用'"
              >
                <font-awesome-icon v-if="swimlane.is_active" icon="eye" class="w-4 h-4" />
                <font-awesome-icon v-else icon="eye-slash" class="w-4 h-4" />
              </button>
              <button
                @click="startEditing(swimlane)"
                class="p-2 text-gray-400 hover:text-gray-600"
                title="編輯"
              >
                <font-awesome-icon icon="pen-to-square" class="w-4 h-4" />
              </button>
              <button
                @click="handleRemoveSwimlane(swimlane)"
                class="p-2 text-gray-400 hover:text-red-500"
                title="刪除"
              >
                <font-awesome-icon icon="trash" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Edit mode -->
          <div v-else class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">泳道名稱 *</label>
              <input
                v-model="editName"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
              <input
                v-model="editDescription"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div class="flex gap-2 justify-end">
              <button
                @click="cancelEditing"
                :disabled="isSubmitting"
                class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                取消
              </button>
              <button
                @click="handleSaveSwimlane"
                :disabled="!editName.trim() || isSubmitting"
                class="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                儲存
              </button>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div
          v-if="swimlanesStore.swimlanes.length === 0 && !swimlanesStore.isLoading"
          class="p-8 text-center text-gray-500"
        >
          沒有泳道
        </div>
      </div>
    </div>
  </div>
</template>
