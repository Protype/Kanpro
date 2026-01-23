<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useMembersStore } from '@/stores/members'
import { useCategoriesStore } from '@/stores/categories'
import { useSwimlanesStore } from '@/stores/swimlanes'
import { useTagsStore } from '@/stores/tags'
import type { BoardColumn } from '@/stores/board'
import type { Task, ProjectMember, Category, Swimlane, Tag } from '@/types'

const props = defineProps<{
  isOpen: boolean
  projectId: number
  columns: BoardColumn[]
  defaultColumnId?: number
  editTask?: Task | null  // 編輯模式時傳入的任務
}>()

const emit = defineEmits<{
  close: []
  submit: [data: TaskFormData]
}>()

export interface TaskFormData {
  title: string
  description: string
  color_id: string
  column_id: number
  // B 層欄位
  owner_id?: number
  swimlane_id?: number
  category_id?: number
  date_due?: string
  priority?: number
  score?: number
  tags?: string[]
}

// === Stores ===
const membersStore = useMembersStore()
const categoriesStore = useCategoriesStore()
const swimlanesStore = useSwimlanesStore()
const tagsStore = useTagsStore()

// === A 層欄位 ===
const title = ref('')
const description = ref('')
const colorId = ref('yellow')
const columnId = ref<number>(0)

// === B 層欄位 ===
const ownerId = ref<number | undefined>(undefined)
const swimlaneId = ref<number | undefined>(undefined)
const categoryId = ref<number | undefined>(undefined)
const dateDue = ref('')
const priority = ref<number | undefined>(undefined)
const score = ref<number | undefined>(undefined)
const selectedTags = ref<string[]>([])

// === UI 狀態 ===
const isSubmitting = ref(false)
const showAdvanced = ref(false)
const newTagInput = ref('')
const showTagDropdown = ref(false)

// === 顏色選項 ===
const colors = [
  { id: 'yellow', name: '黃色', class: 'bg-yellow-500' },
  { id: 'blue', name: '藍色', class: 'bg-blue-500' },
  { id: 'green', name: '綠色', class: 'bg-green-500' },
  { id: 'purple', name: '紫色', class: 'bg-purple-500' },
  { id: 'red', name: '紅色', class: 'bg-red-500' },
  { id: 'orange', name: '橘色', class: 'bg-orange-500' },
  { id: 'grey', name: '灰色', class: 'bg-gray-500' },
  { id: 'cyan', name: '青色', class: 'bg-cyan-500' }
]

// === Computed ===
const isValid = computed(() => title.value.trim().length > 0)
const isEditMode = computed(() => !!props.editTask)

const members = computed(() => membersStore.members)
const categories = computed(() => categoriesStore.categories)
const swimlanes = computed(() => swimlanesStore.activeSwimlanes)
const availableTags = computed(() => tagsStore.tags)

const filteredTags = computed(() => {
  const query = newTagInput.value.toLowerCase()
  if (!query) return availableTags.value
  return availableTags.value.filter(tag =>
    tag.name.toLowerCase().includes(query) &&
    !selectedTags.value.includes(tag.name)
  )
})

// === 生命週期 ===
onMounted(async () => {
  // 預先載入資料
  if (props.projectId) {
    loadProjectData()
  }
})

watch(() => props.isOpen, async (open) => {
  if (open) {
    await loadProjectData()
    if (props.editTask) {
      populateForm(props.editTask)
      showAdvanced.value = true
    } else {
      resetForm()
    }
  }
})

watch(() => props.projectId, async (id) => {
  if (id && props.isOpen) {
    await loadProjectData()
  }
})

watch(() => props.defaultColumnId, (id) => {
  if (id && !props.editTask) {
    columnId.value = id
  }
})

// === 方法 ===
async function loadProjectData() {
  if (!props.projectId) return

  await Promise.all([
    membersStore.fetchMembers(props.projectId),
    categoriesStore.fetchCategories(props.projectId),
    swimlanesStore.fetchSwimlanes(props.projectId),
    tagsStore.fetchTags(props.projectId)
  ])
}

function populateForm(task: Task) {
  title.value = task.title || ''
  description.value = task.description || ''
  colorId.value = task.color_id || 'yellow'
  columnId.value = task.column_id || props.defaultColumnId || props.columns[0]?.id || 0
  ownerId.value = task.owner_id || undefined
  swimlaneId.value = task.swimlane_id || undefined
  categoryId.value = task.category_id || undefined
  dateDue.value = task.date_due ? formatDateForInput(task.date_due) : ''
  priority.value = task.priority || undefined
  score.value = task.score || undefined
  // 標籤需要從 API 取得
  selectedTags.value = []
}

function resetForm() {
  title.value = ''
  description.value = ''
  colorId.value = 'yellow'
  columnId.value = props.defaultColumnId || props.columns[0]?.id || 0
  ownerId.value = undefined
  swimlaneId.value = undefined
  categoryId.value = undefined
  dateDue.value = ''
  priority.value = undefined
  score.value = undefined
  selectedTags.value = []
  showAdvanced.value = false
  newTagInput.value = ''
}

function formatDateForInput(timestamp: number | string): string {
  if (typeof timestamp === 'string') return timestamp
  if (!timestamp) return ''
  const date = new Date(timestamp * 1000)
  return date.toISOString().split('T')[0]
}

function handleSubmit() {
  if (!isValid.value || isSubmitting.value) return

  isSubmitting.value = true

  const data: TaskFormData = {
    title: title.value.trim(),
    description: description.value.trim(),
    color_id: colorId.value,
    column_id: columnId.value
  }

  // 加入 B 層欄位（如果有值）
  if (ownerId.value) data.owner_id = ownerId.value
  if (swimlaneId.value) data.swimlane_id = swimlaneId.value
  if (categoryId.value) data.category_id = categoryId.value
  if (dateDue.value) data.date_due = dateDue.value
  if (priority.value !== undefined) data.priority = priority.value
  if (score.value !== undefined) data.score = score.value
  if (selectedTags.value.length > 0) data.tags = selectedTags.value

  emit('submit', data)
}

function handleClose() {
  if (!isSubmitting.value) {
    emit('close')
  }
}

function toggleAdvanced() {
  showAdvanced.value = !showAdvanced.value
}

function addTag(tagName: string) {
  if (!selectedTags.value.includes(tagName)) {
    selectedTags.value.push(tagName)
  }
  newTagInput.value = ''
  showTagDropdown.value = false
}

function removeTag(tagName: string) {
  selectedTags.value = selectedTags.value.filter(t => t !== tagName)
}

function handleTagInputKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && newTagInput.value.trim()) {
    e.preventDefault()
    addTag(newTagInput.value.trim())
  }
}

defineExpose({
  setSubmitting: (value: boolean) => {
    isSubmitting.value = value
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
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
          class="relative card w-full"
          :class="showAdvanced ? 'max-w-3xl' : 'max-w-lg'"
          @click.stop
        >
          <!-- Header -->
          <div class="flex items-center justify-between p-4 border-b border-edge">
            <h3 class="text-lg font-semibold text-content">
              {{ isEditMode ? '編輯任務' : '新增任務' }}
            </h3>
            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="toggleAdvanced"
                class="text-sm text-accent hover:text-accent-hover flex items-center gap-1"
              >
                {{ showAdvanced ? '收合進階設定' : '進階設定' }}
                <ph-icon
                  :icon="showAdvanced ? 'caret-up' : 'caret-down'"
                  class="w-4 h-4"
                />
              </button>
              <button
                @click="handleClose"
                class="text-content-tertiary hover:text-content-secondary"
                :disabled="isSubmitting"
              >
                <ph-icon icon="xmark" class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleSubmit" class="p-4">
            <div :class="showAdvanced ? 'grid grid-cols-2 gap-6' : ''">
              <!-- 左欄 - A 基本 -->
              <div class="space-y-4">
                <!-- Title -->
                <div>
                  <label for="title" class="block text-sm font-medium text-content-secondary mb-1">
                    標題 <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="title"
                    v-model="title"
                    type="text"
                    required
                    :disabled="isSubmitting"
                    class="input"
                    placeholder="輸入任務標題"
                  />
                </div>

                <!-- Description -->
                <div>
                  <label for="description" class="block text-sm font-medium text-content-secondary mb-1">
                    描述
                  </label>
                  <textarea
                    id="description"
                    v-model="description"
                    rows="3"
                    :disabled="isSubmitting"
                    class="input"
                    placeholder="輸入任務描述（選填）"
                  ></textarea>
                </div>

                <!-- Column -->
                <div>
                  <label for="column" class="block text-sm font-medium text-content-secondary mb-1">
                    欄位
                  </label>
                  <select
                    id="column"
                    v-model="columnId"
                    :disabled="isSubmitting"
                    class="input"
                  >
                    <option
                      v-for="column in columns"
                      :key="column.id"
                      :value="column.id"
                    >
                      {{ column.title }}
                    </option>
                  </select>
                </div>

                <!-- Color -->
                <div>
                  <label class="block text-sm font-medium text-content-secondary mb-2">
                    顏色
                  </label>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="color in colors"
                      :key="color.id"
                      type="button"
                      @click="colorId = color.id"
                      :disabled="isSubmitting"
                      :class="[
                        'w-8 h-8 rounded-full transition-transform',
                        color.class,
                        colorId === color.id ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'
                      ]"
                      :title="color.name"
                    ></button>
                  </div>
                </div>
              </div>

              <!-- 右欄 - B 進階 -->
              <div v-if="showAdvanced" class="space-y-4 border-l border-edge pl-6">
                <!-- Owner -->
                <div>
                  <label for="owner" class="block text-sm font-medium text-content-secondary mb-1">
                    指派人
                  </label>
                  <select
                    id="owner"
                    v-model="ownerId"
                    :disabled="isSubmitting"
                    class="input"
                  >
                    <option :value="undefined">未指派</option>
                    <option
                      v-for="member in members"
                      :key="member.id"
                      :value="member.id"
                    >
                      {{ member.name || member.username }}
                    </option>
                  </select>
                </div>

                <!-- Swimlane -->
                <div>
                  <label for="swimlane" class="block text-sm font-medium text-content-secondary mb-1">
                    泳道
                  </label>
                  <select
                    id="swimlane"
                    v-model="swimlaneId"
                    :disabled="isSubmitting"
                    class="input"
                  >
                    <option :value="undefined">預設泳道</option>
                    <option
                      v-for="swimlane in swimlanes"
                      :key="swimlane.id"
                      :value="swimlane.id"
                    >
                      {{ swimlane.name }}
                    </option>
                  </select>
                </div>

                <!-- Category -->
                <div>
                  <label for="category" class="block text-sm font-medium text-content-secondary mb-1">
                    類別
                  </label>
                  <select
                    id="category"
                    v-model="categoryId"
                    :disabled="isSubmitting"
                    class="input"
                  >
                    <option :value="undefined">無類別</option>
                    <option
                      v-for="category in categories"
                      :key="category.id"
                      :value="category.id"
                    >
                      {{ category.name }}
                    </option>
                  </select>
                </div>

                <!-- Due Date -->
                <div>
                  <label for="dateDue" class="block text-sm font-medium text-content-secondary mb-1">
                    到期日
                  </label>
                  <input
                    id="dateDue"
                    v-model="dateDue"
                    type="date"
                    :disabled="isSubmitting"
                    class="input"
                  />
                </div>

                <!-- Priority & Score -->
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label for="priority" class="block text-sm font-medium text-content-secondary mb-1">
                      優先級
                    </label>
                    <input
                      id="priority"
                      v-model.number="priority"
                      type="number"
                      min="0"
                      :disabled="isSubmitting"
                      class="input"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label for="score" class="block text-sm font-medium text-content-secondary mb-1">
                      Story Points
                    </label>
                    <input
                      id="score"
                      v-model.number="score"
                      type="number"
                      min="0"
                      :disabled="isSubmitting"
                      class="input"
                      placeholder="0"
                    />
                  </div>
                </div>

                <!-- Tags -->
                <div>
                  <label class="block text-sm font-medium text-content-secondary mb-1">
                    標籤
                  </label>
                  <!-- Selected Tags -->
                  <div v-if="selectedTags.length > 0" class="flex flex-wrap gap-1 mb-2">
                    <span
                      v-for="tag in selectedTags"
                      :key="tag"
                      class="inline-flex items-center gap-1 px-2 py-1 text-xs bg-accent/10 text-accent rounded"
                    >
                      {{ tag }}
                      <button
                        type="button"
                        @click="removeTag(tag)"
                        class="text-accent hover:text-accent-hover"
                      >
                        <ph-icon icon="xmark" class="w-3 h-3" />
                      </button>
                    </span>
                  </div>
                  <!-- Tag Input -->
                  <div class="relative">
                    <input
                      v-model="newTagInput"
                      type="text"
                      :disabled="isSubmitting"
                      class="input"
                      placeholder="輸入標籤名稱..."
                      @focus="showTagDropdown = true"
                      @keydown="handleTagInputKeydown"
                    />
                    <!-- Tag Dropdown -->
                    <div
                      v-if="showTagDropdown && filteredTags.length > 0"
                      class="absolute z-10 w-full mt-1 bg-surface border border-edge rounded-md shadow-lg max-h-32 overflow-y-auto"
                    >
                      <button
                        v-for="tag in filteredTags"
                        :key="tag.id"
                        type="button"
                        @click="addTag(tag.name)"
                        class="w-full px-3 py-2 text-left text-sm text-content hover:bg-surface-hover"
                      >
                        {{ tag.name }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-3 pt-4 mt-4 border-t border-edge">
              <button
                type="button"
                @click="handleClose"
                :disabled="isSubmitting"
                class="btn-secondary"
              >
                取消
              </button>
              <button
                type="submit"
                :disabled="!isValid || isSubmitting"
                class="btn-primary flex items-center"
              >
                <ph-icon v-if="isSubmitting" icon="spinner" class="animate-spin -ml-1 mr-2 h-4 w-4" />
                {{ isSubmitting ? (isEditMode ? '儲存中...' : '建立中...') : (isEditMode ? '儲存變更' : '建立任務') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>
