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
      <svg class="animate-spin h-6 w-6 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
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
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  @click="handleMoveDown(swimlane)"
                  :disabled="swimlane.position >= swimlanesStore.swimlanesCount"
                  class="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  title="下移"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
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
                <svg v-if="swimlane.is_active" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>
              <button
                @click="startEditing(swimlane)"
                class="p-2 text-gray-400 hover:text-gray-600"
                title="編輯"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                @click="handleRemoveSwimlane(swimlane)"
                class="p-2 text-gray-400 hover:text-red-500"
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
