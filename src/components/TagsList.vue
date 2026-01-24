<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useTagsStore } from '@/stores/tags'
import { useToast } from '@/stores/toast'
import type { Tag } from '@/types'

const props = defineProps<{
  projectId: number
}>()

const emit = defineEmits<{
  updated: []
}>()

const tagsStore = useTagsStore()
const toast = useToast()

// Form state
const isAdding = ref(false)
const isSubmitting = ref(false)
const newTagName = ref('')
const newTagColor = ref('yellow')

// Edit state
const editingTagId = ref<number | null>(null)
const editName = ref('')
const editColor = ref('yellow')

// Available colors (Kanboard standard colors)
const colorOptions = [
  { id: 'yellow', label: '黃色', class: 'bg-yellow-400' },
  { id: 'blue', label: '藍色', class: 'bg-blue-500' },
  { id: 'green', label: '綠色', class: 'bg-green-500' },
  { id: 'purple', label: '紫色', class: 'bg-purple-500' },
  { id: 'red', label: '紅色', class: 'bg-red-500' },
  { id: 'orange', label: '橙色', class: 'bg-orange-500' },
  { id: 'grey', label: '灰色', class: 'bg-gray-500' },
  { id: 'brown', label: '棕色', class: 'bg-amber-700' },
  { id: 'deep_orange', label: '深橙', class: 'bg-orange-700' },
  { id: 'dark_grey', label: '深灰', class: 'bg-gray-700' },
  { id: 'pink', label: '粉紅', class: 'bg-pink-500' },
  { id: 'teal', label: '青色', class: 'bg-teal-500' },
  { id: 'cyan', label: '青藍', class: 'bg-cyan-500' },
  { id: 'lime', label: '萊姆', class: 'bg-lime-500' },
  { id: 'light_green', label: '淺綠', class: 'bg-green-400' },
  { id: 'amber', label: '琥珀', class: 'bg-amber-500' }
]

const getColorClass = (colorId: string | null | undefined): string => {
  const color = colorOptions.find(c => c.id === colorId)
  return color?.class || 'bg-yellow-400'
}

onMounted(async () => {
  await tagsStore.fetchProjectTags(props.projectId)
})

watch(() => props.projectId, async (newId) => {
  if (newId) {
    await tagsStore.fetchProjectTags(newId)
  }
})

const startAdding = () => {
  isAdding.value = true
  newTagName.value = ''
  newTagColor.value = 'yellow'
}

const cancelAdding = () => {
  isAdding.value = false
}

const handleAddTag = async () => {
  if (!newTagName.value.trim() || isSubmitting.value) return

  isSubmitting.value = true
  const loadingToast = toast.loading('新增標籤中...')
  try {
    await tagsStore.createTag(
      props.projectId,
      newTagName.value.trim(),
      newTagColor.value
    )
    await tagsStore.fetchProjectTags(props.projectId)
    toast.update(loadingToast, 'success', '標籤已新增')
    cancelAdding()
    emit('updated')
  } catch (error) {
    console.error('Failed to add tag:', error)
    toast.update(loadingToast, 'error', '新增標籤失敗')
  } finally {
    isSubmitting.value = false
  }
}

const startEditing = (tag: Tag) => {
  editingTagId.value = tag.id
  editName.value = tag.name
  editColor.value = tag.color_id || 'yellow'
}

const cancelEditing = () => {
  editingTagId.value = null
}

const handleSaveTag = async () => {
  if (!editingTagId.value || !editName.value.trim() || isSubmitting.value) return

  isSubmitting.value = true
  const loadingToast = toast.loading('更新標籤中...')
  try {
    await tagsStore.updateTag(
      editingTagId.value,
      editName.value.trim(),
      editColor.value
    )
    await tagsStore.fetchProjectTags(props.projectId)
    toast.update(loadingToast, 'success', '標籤已更新')
    cancelEditing()
    emit('updated')
  } catch (error) {
    console.error('Failed to update tag:', error)
    toast.update(loadingToast, 'error', '更新標籤失敗')
  } finally {
    isSubmitting.value = false
  }
}

const handleRemoveTag = async (tag: Tag) => {
  if (!confirm(`確定要刪除標籤「${tag.name}」嗎？此操作無法復原。`)) return

  const loadingToast = toast.loading('刪除標籤中...')
  try {
    await tagsStore.removeTag(tag.id)
    await tagsStore.fetchProjectTags(props.projectId)
    toast.update(loadingToast, 'success', '標籤已刪除')
    emit('updated')
  } catch (error) {
    console.error('Failed to remove tag:', error)
    toast.update(loadingToast, 'error', '刪除標籤失敗')
  }
}
</script>

<template>
  <div class="p-5">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4 h-8">
      <div class="flex items-center gap-2">
        <ph-icon icon="hash" class="w-5 h-5 text-content-tertiary" />
        <h3 class="text-base font-semibold text-content">
          標籤管理
        </h3>
        <span v-if="tagsStore.projectTags.length > 0" class="text-xs text-content-tertiary bg-surface-secondary px-1.5 py-0.5 rounded">
          {{ tagsStore.projectTags.length }}
        </span>
      </div>
      <button
        v-if="!isAdding"
        @click="startAdding"
        class="p-2 text-content-tertiary hover:text-content-secondary hover:bg-surface-hover rounded-md transition-colors"
        title="新增標籤"
      >
        <ph-icon icon="plus" weight="bold" class="w-5 h-5" />
      </button>
    </div>

    <div class="space-y-3">
      <!-- Add tag form -->
      <div v-if="isAdding" class="bg-surface-secondary rounded-lg p-4 space-y-3 border border-edge">
        <div>
          <input
            v-model="newTagName"
            type="text"
            :disabled="isSubmitting"
            class="w-full px-3 py-2 text-sm bg-surface border border-edge rounded-lg text-content focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="標籤名稱"
          />
        </div>
        <!-- Color picker -->
        <div>
          <label class="block text-xs text-content-tertiary mb-2">顏色</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="color in colorOptions"
              :key="color.id"
              type="button"
              @click="newTagColor = color.id"
              :disabled="isSubmitting"
              class="w-6 h-6 rounded-full transition-all disabled:opacity-50"
              :class="[
                color.class,
                newTagColor === color.id ? 'ring-2 ring-offset-2 ring-accent' : 'hover:scale-110'
              ]"
              :title="color.label"
            />
          </div>
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
            @click="handleAddTag"
            :disabled="!newTagName.trim() || isSubmitting"
            class="px-4 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <ph-icon v-if="isSubmitting" icon="spinner" class="w-4 h-4 animate-spin" />
            新增
          </button>
        </div>
      </div>

      <!-- Tags list -->
      <div class="space-y-2">
        <div
          v-for="tag in tagsStore.projectTags"
          :key="tag.id"
          class="group p-3 bg-surface-secondary/50 rounded-lg hover:bg-surface-secondary transition-colors"
        >
          <!-- View mode -->
          <div v-if="editingTagId !== tag.id" class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <!-- Color indicator -->
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                :class="getColorClass(tag.color_id)"
              >
                <ph-icon icon="hash" class="w-4 h-4 text-white" />
              </div>

              <!-- Tag info -->
              <div class="min-w-0">
                <div class="font-medium text-sm text-content truncate">{{ tag.name }}</div>
              </div>
            </div>

            <div class="flex items-center gap-1">
              <button
                @click="startEditing(tag)"
                class="p-1.5 text-content-tertiary group-hover:text-content-secondary hover:!text-accent hover:bg-accent/10 rounded-md transition-colors"
                title="編輯"
              >
                <ph-icon icon="pen-to-square" class="w-4 h-4" />
              </button>
              <button
                @click="handleRemoveTag(tag)"
                class="p-1.5 text-content-tertiary group-hover:text-content-secondary hover:!text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"
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
                placeholder="標籤名稱"
              />
            </div>
            <!-- Color picker -->
            <div>
              <label class="block text-xs text-content-tertiary mb-2">顏色</label>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="color in colorOptions"
                  :key="color.id"
                  type="button"
                  @click="editColor = color.id"
                  :disabled="isSubmitting"
                  class="w-6 h-6 rounded-full transition-all disabled:opacity-50"
                  :class="[
                    color.class,
                    editColor === color.id ? 'ring-2 ring-offset-2 ring-accent' : 'hover:scale-110'
                  ]"
                  :title="color.label"
                />
              </div>
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
                @click="handleSaveTag"
                :disabled="!editName.trim() || isSubmitting"
                class="px-4 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <ph-icon v-if="isSubmitting" icon="spinner" class="w-4 h-4 animate-spin" />
                儲存
              </button>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div
          v-if="tagsStore.projectTags.length === 0"
          class="py-8 text-center text-content-tertiary text-sm"
        >
          <ph-icon icon="hash" class="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>尚無標籤</p>
        </div>
      </div>
    </div>
  </div>
</template>
