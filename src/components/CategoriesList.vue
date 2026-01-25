<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCategoriesStore } from '@/stores/categories'
import { useToast } from '@/stores/toast'
import type { Category } from '@/types'

const props = defineProps<{
  projectId: number
}>()

const emit = defineEmits<{
  updated: []
}>()

const { t } = useI18n()
const categoriesStore = useCategoriesStore()
const toast = useToast()

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
  const loadingToast = toast.loading(t('category.addingCategory'))
  try {
    await categoriesStore.addCategory(
      props.projectId,
      newCategoryName.value.trim()
    )
    await categoriesStore.fetchCategories(props.projectId)
    toast.update(loadingToast, 'success', t('category.categoryAdded'))
    cancelAdding()
    emit('updated')
  } catch (error) {
    console.error('Failed to add category:', error)
    toast.update(loadingToast, 'error', t('category.addCategoryFailed'))
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
  const loadingToast = toast.loading(t('category.updatingCategory'))
  try {
    await categoriesStore.updateCategory(
      editingCategoryId.value,
      editName.value.trim()
    )
    await categoriesStore.fetchCategories(props.projectId)
    toast.update(loadingToast, 'success', t('category.categoryUpdated'))
    cancelEditing()
    emit('updated')
  } catch (error) {
    console.error('Failed to update category:', error)
    toast.update(loadingToast, 'error', t('category.updateCategoryFailed'))
  } finally {
    isSubmitting.value = false
  }
}

const handleRemoveCategory = async (category: Category) => {
  if (!confirm(t('category.confirmRemoveCategory', { name: category.name }))) return

  const loadingToast = toast.loading(t('category.removingCategory'))
  try {
    await categoriesStore.removeCategory(category.id)
    await categoriesStore.fetchCategories(props.projectId)
    toast.update(loadingToast, 'success', t('category.categoryRemoved'))
    emit('updated')
  } catch (error) {
    console.error('Failed to remove category:', error)
    toast.update(loadingToast, 'error', t('category.removeCategoryFailed'))
  }
}
</script>

<template>
  <div class="p-5">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4 h-8">
      <div class="flex items-center gap-2">
        <ph-icon icon="tag" class="w-5 h-5 text-content-tertiary" />
        <h3 class="text-base font-semibold text-content">
          {{ t('category.categoryManagement') }}
        </h3>
        <span v-if="categoriesStore.categoriesCount > 0" class="text-xs text-content-tertiary bg-surface-secondary px-1.5 py-0.5 rounded">
          {{ categoriesStore.categoriesCount }}
        </span>
      </div>
      <button
        v-if="!isAdding"
        @click="startAdding"
        class="p-2 text-content-tertiary hover:text-content-secondary hover:bg-surface-hover rounded-md transition-colors"
        :title="t('category.addCategory')"
      >
        <ph-icon icon="stack-plus" weight="fill" class="w-5 h-5" />
      </button>
    </div>

    <div class="space-y-3">
      <!-- Add category form -->
      <div v-if="isAdding" class="bg-surface-secondary rounded-lg p-4 space-y-3 border border-edge">
        <div>
          <input
            v-model="newCategoryName"
            type="text"
            :disabled="isSubmitting"
            class="w-full px-3 py-2 text-sm bg-surface border border-edge rounded-lg text-content focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
            :placeholder="t('category.enterCategoryName')"
          />
        </div>
        <div class="flex gap-2 justify-end">
          <button
            @click="cancelAdding"
            :disabled="isSubmitting"
            class="px-4 py-2 text-sm text-content-secondary hover:text-content transition-colors disabled:opacity-50"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            @click="handleAddCategory"
            :disabled="!newCategoryName.trim() || isSubmitting"
            class="px-4 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <ph-icon v-if="isSubmitting" icon="spinner" class="w-4 h-4 animate-spin" />
            {{ t('common.add') }}
          </button>
        </div>
      </div>

      <!-- Categories list -->
      <div class="space-y-2">
        <div
          v-for="category in categoriesStore.categories"
          :key="category.id"
          class="group p-3 bg-surface-secondary/50 rounded-lg hover:bg-surface-secondary transition-colors"
        >
          <!-- View mode -->
          <div v-if="editingCategoryId !== category.id" class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <!-- Category icon -->
              <div class="w-8 h-8 rounded-lg bg-surface-tertiary group-hover:bg-accent/15 flex items-center justify-center transition-colors">
                <ph-icon icon="tag" class="w-4 h-4 text-content-tertiary group-hover:text-accent transition-colors" />
              </div>

              <!-- Category info -->
              <div class="min-w-0">
                <div class="font-medium text-sm text-content truncate">{{ category.name }}</div>
                <div v-if="category.description" class="text-xs text-content-tertiary truncate">
                  {{ category.description }}
                </div>
              </div>
            </div>

            <div class="flex items-center gap-1">
              <button
                @click="startEditing(category)"
                class="p-1.5 text-content-tertiary group-hover:text-content-secondary hover:!text-accent hover:bg-accent/10 rounded-md transition-colors"
                :title="t('common.edit')"
              >
                <ph-icon icon="pen-to-square" class="w-4 h-4" />
              </button>
              <button
                @click="handleRemoveCategory(category)"
                class="p-1.5 text-content-tertiary group-hover:text-content-secondary hover:!text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"
                :title="t('common.delete')"
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
                :placeholder="t('category.enterCategoryName')"
              />
            </div>
            <div class="flex gap-2 justify-end">
              <button
                @click="cancelEditing"
                :disabled="isSubmitting"
                class="px-4 py-2 text-sm text-content-secondary hover:text-content transition-colors disabled:opacity-50"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                @click="handleSaveCategory"
                :disabled="!editName.trim() || isSubmitting"
                class="px-4 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <ph-icon v-if="isSubmitting" icon="spinner" class="w-4 h-4 animate-spin" />
                {{ t('common.save') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div
          v-if="categoriesStore.categories.length === 0"
          class="py-8 text-center text-content-tertiary text-sm"
        >
          <ph-icon icon="tag" class="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>{{ t('category.noCategories') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
