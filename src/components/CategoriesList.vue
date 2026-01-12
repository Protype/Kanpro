<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useCategoriesStore } from '@/stores/categories'
import type { Category } from '@/types'

const props = defineProps<{
  projectId: number
}>()

const emit = defineEmits<{
  updated: []
}>()

const categoriesStore = useCategoriesStore()

// Form state
const isAdding = ref(false)
const isSubmitting = ref(false)
const newCategoryName = ref('')

// Edit state
const editingCategoryId = ref<number | null>(null)
const editName = ref('')

onMounted(async () => {
  await categoriesStore.fetchCategories(props.projectId)
})

watch(() => props.projectId, async (newId) => {
  if (newId) {
    await categoriesStore.fetchCategories(newId)
  }
})

const startAdding = () => {
  isAdding.value = true
  newCategoryName.value = ''
}

const cancelAdding = () => {
  isAdding.value = false
}

const handleAddCategory = async () => {
  if (!newCategoryName.value.trim() || isSubmitting.value) return

  isSubmitting.value = true
  try {
    await categoriesStore.addCategory(
      props.projectId,
      newCategoryName.value.trim()
    )
    await categoriesStore.fetchCategories(props.projectId)
    cancelAdding()
    emit('updated')
  } catch (error) {
    console.error('Failed to add category:', error)
    alert('新增類別失敗')
  } finally {
    isSubmitting.value = false
  }
}

const startEditing = (category: Category) => {
  editingCategoryId.value = category.id
  editName.value = category.name
}

const cancelEditing = () => {
  editingCategoryId.value = null
}

const handleSaveCategory = async () => {
  if (!editingCategoryId.value || !editName.value.trim() || isSubmitting.value) return

  isSubmitting.value = true
  try {
    await categoriesStore.updateCategory(
      editingCategoryId.value,
      editName.value.trim()
    )
    await categoriesStore.fetchCategories(props.projectId)
    cancelEditing()
    emit('updated')
  } catch (error) {
    console.error('Failed to update category:', error)
    alert('更新類別失敗')
  } finally {
    isSubmitting.value = false
  }
}

const handleRemoveCategory = async (category: Category) => {
  if (!confirm(`確定要刪除類別「${category.name}」嗎？此操作無法復原。`)) return

  try {
    await categoriesStore.removeCategory(category.id)
    await categoriesStore.fetchCategories(props.projectId)
    emit('updated')
  } catch (error) {
    console.error('Failed to remove category:', error)
    alert('刪除類別失敗')
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900">
        類別管理
        <span v-if="categoriesStore.categoriesCount > 0" class="text-gray-400 text-sm font-normal">
          ({{ categoriesStore.categoriesCount }})
        </span>
      </h3>
      <button
        v-if="!isAdding"
        @click="startAdding"
        class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        + 新增類別
      </button>
    </div>

    <!-- Loading -->
    <div v-if="categoriesStore.isLoading" class="text-center py-4">
      <svg class="animate-spin h-6 w-6 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <div v-else class="space-y-3">
      <!-- Add category form -->
      <div v-if="isAdding" class="bg-gray-50 rounded-lg p-4 space-y-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">類別名稱 *</label>
          <input
            v-model="newCategoryName"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="輸入類別名稱"
          />
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
            @click="handleAddCategory"
            :disabled="!newCategoryName.trim() || isSubmitting"
            class="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            新增
          </button>
        </div>
      </div>

      <!-- Categories list -->
      <div class="bg-white rounded-lg border divide-y">
        <div
          v-for="category in categoriesStore.categories"
          :key="category.id"
          class="p-4"
        >
          <!-- View mode -->
          <div v-if="editingCategoryId !== category.id" class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <!-- Category icon -->
              <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <svg class="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>

              <!-- Category info -->
              <div>
                <div class="font-medium text-gray-900">{{ category.name }}</div>
                <div v-if="category.description" class="text-sm text-gray-500">
                  {{ category.description }}
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button
                @click="startEditing(category)"
                class="p-2 text-gray-400 hover:text-gray-600"
                title="編輯"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                @click="handleRemoveCategory(category)"
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
              <label class="block text-sm font-medium text-gray-700 mb-1">類別名稱 *</label>
              <input
                v-model="editName"
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
                @click="handleSaveCategory"
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
          v-if="categoriesStore.categories.length === 0 && !categoriesStore.isLoading"
          class="p-8 text-center text-gray-500"
        >
          沒有類別
        </div>
      </div>
    </div>
  </div>
</template>
