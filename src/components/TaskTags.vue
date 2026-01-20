<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useTagsStore } from '@/stores/tags'

const props = defineProps<{
  taskId: number
  projectId: number
}>()

const emit = defineEmits<{
  updated: []
}>()

const tagsStore = useTagsStore()

const isEditing = ref(false)
const isSubmitting = ref(false)
const newTagName = ref('')
const selectedTags = ref<string[]>([])

// Available tags from project that are not already on the task
const availableTags = computed(() => {
  return tagsStore.projectTags.filter(
    tag => !selectedTags.value.includes(tag.name)
  )
})

onMounted(async () => {
  await Promise.all([
    tagsStore.fetchProjectTags(props.projectId),
    tagsStore.fetchTaskTags(props.taskId)
  ])
  selectedTags.value = [...tagsStore.taskTags]
})

watch(() => props.taskId, async (newId) => {
  if (newId) {
    await tagsStore.fetchTaskTags(newId)
    selectedTags.value = [...tagsStore.taskTags]
  }
})

const startEditing = () => {
  selectedTags.value = [...tagsStore.taskTags]
  isEditing.value = true
}

const cancelEditing = () => {
  selectedTags.value = [...tagsStore.taskTags]
  newTagName.value = ''
  isEditing.value = false
}

const addTag = (tagName: string) => {
  if (!selectedTags.value.includes(tagName)) {
    selectedTags.value.push(tagName)
  }
}

const removeTag = (tagName: string) => {
  selectedTags.value = selectedTags.value.filter(t => t !== tagName)
}

const addNewTag = () => {
  const trimmed = newTagName.value.trim()
  if (trimmed && !selectedTags.value.includes(trimmed)) {
    selectedTags.value.push(trimmed)
    newTagName.value = ''
  }
}

const saveTags = async () => {
  if (isSubmitting.value) return

  isSubmitting.value = true
  try {
    await tagsStore.setTaskTags(props.taskId, props.projectId, selectedTags.value)
    await tagsStore.fetchTaskTags(props.taskId)
    isEditing.value = false
    emit('updated')
  } catch (error) {
    console.error('Failed to save tags:', error)
    alert('儲存標籤失敗')
  } finally {
    isSubmitting.value = false
  }
}

// Tag colors based on project tag colors
const getTagColor = (tagName: string): string => {
  const projectTag = tagsStore.projectTags.find(t => t.name === tagName)
  const colorId = projectTag?.color_id

  const colorMap: Record<string, string> = {
    yellow: 'bg-yellow-100 text-yellow-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    purple: 'bg-purple-100 text-purple-800',
    red: 'bg-red-100 text-red-800',
    orange: 'bg-orange-100 text-orange-800',
    grey: 'bg-gray-100 text-gray-800',
    cyan: 'bg-cyan-100 text-cyan-800',
    lime: 'bg-lime-100 text-lime-800',
    pink: 'bg-pink-100 text-pink-800',
    teal: 'bg-teal-100 text-teal-800',
    amber: 'bg-amber-100 text-amber-800'
  }

  return colorMap[colorId || ''] || 'bg-gray-100 text-gray-800'
}
</script>

<template>
  <div class="space-y-2">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-medium text-gray-700">標籤</h3>
      <button
        v-if="!isEditing"
        @click="startEditing"
        class="text-sm text-blue-600 hover:text-blue-800"
      >
        編輯
      </button>
    </div>

    <!-- Loading -->
    <div v-if="tagsStore.isLoading" class="text-center py-2">
      <ph-icon icon="spinner" class="animate-spin h-4 w-4 text-blue-600 mx-auto" />
    </div>

    <div v-else>
      <!-- View mode -->
      <div v-if="!isEditing" class="flex flex-wrap gap-1">
        <span
          v-for="tag in tagsStore.taskTags"
          :key="tag"
          :class="['px-2 py-0.5 text-xs rounded-full', getTagColor(tag)]"
        >
          {{ tag }}
        </span>
        <span
          v-if="tagsStore.taskTags.length === 0"
          class="text-xs text-gray-400 italic"
        >
          無標籤
        </span>
      </div>

      <!-- Edit mode -->
      <div v-else class="space-y-3">
        <!-- Selected tags -->
        <div class="flex flex-wrap gap-1">
          <span
            v-for="tag in selectedTags"
            :key="tag"
            :class="['px-2 py-0.5 text-xs rounded-full flex items-center gap-1', getTagColor(tag)]"
          >
            {{ tag }}
            <button
              @click="removeTag(tag)"
              class="hover:opacity-70"
            >
              <ph-icon icon="xmark" class="w-3 h-3" />
            </button>
          </span>
        </div>

        <!-- Available tags dropdown -->
        <div v-if="availableTags.length > 0" class="space-y-1">
          <span class="text-xs text-gray-500">可用標籤：</span>
          <div class="flex flex-wrap gap-1">
            <button
              v-for="tag in availableTags"
              :key="tag.id"
              @click="addTag(tag.name)"
              :class="['px-2 py-0.5 text-xs rounded-full cursor-pointer hover:opacity-80', getTagColor(tag.name)]"
            >
              + {{ tag.name }}
            </button>
          </div>
        </div>

        <!-- New tag input -->
        <div class="flex gap-2">
          <input
            v-model="newTagName"
            type="text"
            placeholder="新增標籤..."
            class="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            @keyup.enter="addNewTag"
          />
          <button
            @click="addNewTag"
            :disabled="!newTagName.trim()"
            class="px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            新增
          </button>
        </div>

        <!-- Action buttons -->
        <div class="flex gap-2 pt-2">
          <button
            @click="saveTags"
            :disabled="isSubmitting"
            class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            儲存
          </button>
          <button
            @click="cancelEditing"
            :disabled="isSubmitting"
            class="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
