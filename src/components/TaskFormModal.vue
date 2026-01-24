<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMembersStore } from '@/stores/members'
import { useCategoriesStore } from '@/stores/categories'
import { useSwimlanesStore } from '@/stores/swimlanes'
import { useTagsStore } from '@/stores/tags'
import UserAvatar from '@/components/UserAvatar.vue'
import type { BoardColumn } from '@/stores/board'
import type { Task, ProjectMember } from '@/types'

const props = defineProps<{
  isOpen: boolean
  projectId: number
  columns: BoardColumn[]
  defaultColumnId?: number
  defaultSwimlaneId?: number
  editTask?: Task | null
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
  owner_id?: number
  swimlane_id?: number
  category_id?: number
  date_due?: string
  priority?: number
  score?: number
  tags?: string[]
}

const router = useRouter()

// === Stores ===
const membersStore = useMembersStore()
const categoriesStore = useCategoriesStore()
const swimlanesStore = useSwimlanesStore()
const tagsStore = useTagsStore()

// === A 層欄位（主區域） ===
const title = ref('')
const description = ref('')
const colorId = ref('yellow')
const columnId = ref<number>(0)

// === B 層欄位（進階設定） ===
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
const ownerSearchQuery = ref('')
const showOwnerDropdown = ref(false)

// === 顏色選項（按色相環排列：暖色→冷色→中性色）===
const colors = [
  // 暖色系
  { id: 'red', name: '紅色', class: 'bg-red-500' },
  { id: 'pink', name: '粉紅', class: 'bg-pink-500' },
  { id: 'deep_orange', name: '深橘', class: 'bg-orange-700' },
  { id: 'orange', name: '橘色', class: 'bg-orange-500' },
  { id: 'amber', name: '琥珀', class: 'bg-amber-500' },
  { id: 'yellow', name: '黃色', class: 'bg-yellow-500' },
  { id: 'lime', name: '萊姆綠', class: 'bg-lime-500' },
  { id: 'green', name: '綠色', class: 'bg-green-500' },
  // 冷色系
  { id: 'teal', name: '藍綠', class: 'bg-teal-500' },
  { id: 'cyan', name: '青色', class: 'bg-cyan-500' },
  { id: 'blue', name: '藍色', class: 'bg-blue-500' },
  { id: 'purple', name: '紫色', class: 'bg-purple-500' },
  // 中性色
  { id: 'brown', name: '棕色', class: 'bg-amber-800' },
  { id: 'grey', name: '灰色', class: 'bg-gray-500' },
  { id: 'dark_grey', name: '深灰', class: 'bg-gray-700' },
  { id: 'white', name: '白色', class: 'bg-white border border-edge' }
]

// === Computed ===
const isValid = computed(() => title.value.trim().length > 0)
const isEditMode = computed(() => !!props.editTask)

// 使用 assignableUsers 而非 members，因為任務只能指派給可指派的成員（不含瀏覽者）
const assignableUsers = computed(() => membersStore.assignableUsers)
const categories = computed(() => categoriesStore.categories)
const swimlanes = computed(() => swimlanesStore.activeSwimlanes)
const availableTags = computed(() => tagsStore.tags)

const filteredMembers = computed(() => {
  const query = ownerSearchQuery.value.toLowerCase()
  if (!query) return assignableUsers.value
  return assignableUsers.value.filter(m =>
    m.username.toLowerCase().includes(query) ||
    (m.name?.toLowerCase().includes(query) ?? false)
  )
})

const selectedOwner = computed(() => {
  if (!ownerId.value) return null
  return assignableUsers.value.find(m => m.id === ownerId.value) || null
})

const filteredTags = computed(() => {
  const query = newTagInput.value.toLowerCase()
  if (!query) return availableTags.value
  return availableTags.value.filter(tag =>
    tag.name.toLowerCase().includes(query) &&
    !selectedTags.value.includes(tag.name)
  )
})

// === 生命週期 ===
onMounted(() => {
  if (props.projectId) {
    loadProjectData()
  }
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
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

watch(() => props.defaultSwimlaneId, (id) => {
  if (id && !props.editTask) {
    swimlaneId.value = id
  }
})

// === 方法 ===
async function loadProjectData() {
  if (!props.projectId) return

  await Promise.all([
    membersStore.fetchMembers(props.projectId),
    categoriesStore.fetchCategories(props.projectId),
    swimlanesStore.fetchSwimlanes(props.projectId),
    tagsStore.fetchProjectTags(props.projectId)
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
  selectedTags.value = []
}

function resetForm() {
  title.value = ''
  description.value = ''
  colorId.value = 'yellow'
  columnId.value = props.defaultColumnId || props.columns[0]?.id || 0
  swimlaneId.value = props.defaultSwimlaneId || undefined
  ownerId.value = undefined
  categoryId.value = undefined
  dateDue.value = ''
  priority.value = undefined
  score.value = undefined
  selectedTags.value = []
  showAdvanced.value = false
  newTagInput.value = ''
  ownerSearchQuery.value = ''
  showOwnerDropdown.value = false
  showTagDropdown.value = false
}

function formatDateForInput(timestamp: number | string): string {
  if (typeof timestamp === 'string') return timestamp
  if (!timestamp) return ''
  const date = new Date(timestamp * 1000)
  return date.toISOString().split('T')[0]
}

function toggleAdvanced() {
  showAdvanced.value = !showAdvanced.value
}

function selectOwner(member: ProjectMember) {
  ownerId.value = member.id
  ownerSearchQuery.value = ''
  showOwnerDropdown.value = false
}

function clearOwner() {
  ownerId.value = undefined
  ownerSearchQuery.value = ''
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.owner-dropdown-container')) {
    showOwnerDropdown.value = false
  }
  if (!target.closest('.tag-dropdown-container')) {
    showTagDropdown.value = false
  }
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

function handleSubmit() {
  if (!isValid.value || isSubmitting.value) return

  isSubmitting.value = true

  const data: TaskFormData = {
    title: title.value.trim(),
    description: description.value.trim(),
    color_id: colorId.value,
    column_id: columnId.value
  }

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

function handleBackdropClick() {
  handleClose()
}

// 全螢幕模式：帶著資料跳轉到新增任務頁面
function goToFullPage() {
  // 收集當前表單資料，存入 sessionStorage
  const formData = {
    title: title.value,
    description: description.value,
    color_id: colorId.value,
    column_id: columnId.value,
    owner_id: ownerId.value,
    swimlane_id: swimlaneId.value,
    category_id: categoryId.value,
    date_due: dateDue.value,
    priority: priority.value,
    score: score.value,
    tags: selectedTags.value
  }
  sessionStorage.setItem('kanpro_task_draft', JSON.stringify(formData))

  emit('close')
  router.push({
    name: 'task-create',
    params: { id: props.projectId }
  })
}

defineExpose({
  setSubmitting: (value: boolean) => {
    isSubmitting.value = value
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 overflow-y-auto"
      >
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-black/50 transition-opacity"
          @click="handleBackdropClick"
        ></div>

        <!-- Modal Container -->
        <div class="flex min-h-full items-center justify-center p-4">
          <!-- Modal -->
          <form
            @submit.prevent="handleSubmit"
            class="relative bg-surface rounded-lg shadow-xl border border-edge flex flex-col modal-transition overflow-hidden"
            :style="{
              width: showAdvanced ? '720px' : '448px',
              height: showAdvanced ? '560px' : '500px',
              maxWidth: '90vw'
            }"
            @click.stop
          >
            <!-- Header -->
            <div class="flex items-center justify-between p-4 h-14 border-b border-edge">
              <div class="flex items-center gap-3">
                <h3 class="text-lg font-semibold text-content">
                  {{ isEditMode ? '編輯任務' : '新增任務' }}
                </h3>
                <!-- Button Group: Advanced + Expand -->
                <div class="flex items-center gap-0 rounded-md bg-surface-secondary px-1 py-0.5">
                  <!-- Advanced Settings Toggle -->
                  <button
                    type="button"
                    @click="toggleAdvanced"
                    class="flex items-center gap-1 ps-2 pe-1 py-1 text-xs font-medium leading-none rounded transition-colors"
                    :class="showAdvanced
                      ? 'bg-surface-tertiary text-content-secondary'
                      : 'text-content-tertiary hover:text-content-secondary hover:bg-surface-tertiary'"
                  >
                    <span>進階設定</span>
                    <ph-icon :icon="showAdvanced ? 'chevron-left' : 'chevron-right'" class="w-3.5 h-3.5" />
                  </button>
                  <!-- Expand to full page button -->
                  <button
                    type="button"
                    data-testid="expand-button"
                    @click="goToFullPage"
                    class="flex items-center justify-center p-1 rounded transition-colors text-content-tertiary hover:text-content-secondary hover:bg-surface-tertiary"
                    title="展開為完整頁面"
                  >
                    <ph-icon icon="arrows-out" class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <button
                type="button"
                @click="handleClose"
                class="text-content-tertiary hover:text-content-secondary transition-colors"
                :disabled="isSubmitting"
              >
                <ph-icon icon="xmark" class="w-5 h-5" />
              </button>
            </div>

            <!-- Content Area -->
            <div class="flex flex-1 min-h-0">
              <!-- Main Content (A 層) -->
              <div class="flex-1 p-4 space-y-4 overflow-y-auto">
                <!-- Title -->
                <div>
                  <label for="task-title" class="block text-sm font-medium text-content mb-1">
                    標題 <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="task-title"
                    v-model="title"
                    type="text"
                    required
                    :disabled="isSubmitting"
                    class="w-full px-3 py-2 bg-surface-secondary border border-edge rounded-md text-content placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-50"
                    placeholder="輸入任務標題"
                  />
                </div>

                <!-- Description -->
                <div>
                  <label for="task-description" class="block text-sm font-medium text-content mb-1">
                    描述
                  </label>
                  <textarea
                    id="task-description"
                    v-model="description"
                    rows="3"
                    :disabled="isSubmitting"
                    class="w-full px-3 py-2 bg-surface-secondary border border-edge rounded-md text-content placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-50 resize-none"
                    placeholder="輸入任務描述（選填）"
                  ></textarea>
                </div>

                <!-- Column & Color Row -->
                <div class="grid grid-cols-2 gap-4">
                  <!-- Column -->
                  <div>
                    <label for="task-column" class="block text-sm font-medium text-content mb-1">
                      欄位
                    </label>
                    <select
                      id="task-column"
                      v-model="columnId"
                      :disabled="isSubmitting"
                      class="w-full px-3 py-2 bg-surface-secondary border border-edge rounded-md text-content focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-50"
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
                    <label class="block text-sm font-medium text-content mb-1">
                      顏色
                    </label>
                    <div class="grid grid-cols-8 gap-1">
                      <button
                        v-for="color in colors"
                        :key="color.id"
                        type="button"
                        @click="colorId = color.id"
                        :disabled="isSubmitting"
                        :class="[
                          'w-4 h-4 rounded-full transition-all',
                          color.class,
                          colorId === color.id ? 'ring-2 ring-offset-1 ring-content-tertiary scale-110' : 'hover:scale-110'
                        ]"
                        :title="color.name"
                      ></button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Advanced Settings Panel (B 層) -->
              <Transition name="slide">
                <div
                  v-if="showAdvanced"
                  class="w-80 border-l border-edge bg-surface-secondary/50 overflow-y-auto"
                >
                  <div class="p-4 grid grid-cols-2 gap-x-3 gap-y-4">
                    <!-- Owner / Assignee (full width) -->
                    <div class="col-span-2 owner-dropdown-container">
                      <label class="block text-sm font-medium text-content mb-1">
                        指派人
                      </label>
                      <div class="relative">
                        <button
                          type="button"
                          @click="showOwnerDropdown = !showOwnerDropdown"
                          class="w-full px-3 py-2 bg-surface border border-edge rounded-md text-left flex items-center gap-2 hover:bg-surface-hover transition-colors"
                          :disabled="isSubmitting"
                        >
                          <template v-if="selectedOwner">
                            <UserAvatar :user="selectedOwner" size="sm" />
                            <span class="flex-1 truncate text-sm text-content">
                              {{ selectedOwner.name || selectedOwner.username }}
                            </span>
                            <button
                              type="button"
                              @click.stop="clearOwner"
                              class="text-content-tertiary hover:text-content-secondary"
                            >
                              <ph-icon icon="xmark" class="w-4 h-4" />
                            </button>
                          </template>
                          <template v-else>
                            <div class="w-6 h-6 rounded-full bg-surface-tertiary flex items-center justify-center">
                              <ph-icon icon="user" class="w-3.5 h-3.5 text-content-tertiary" />
                            </div>
                            <span class="flex-1 text-sm text-content-tertiary">未指派</span>
                            <ph-icon icon="chevron-down" class="w-4 h-4 text-content-tertiary" />
                          </template>
                        </button>

                        <!-- Owner Dropdown -->
                        <Transition name="dropdown">
                          <div
                            v-if="showOwnerDropdown"
                            class="absolute z-10 w-full mt-1 bg-surface border border-edge rounded-md shadow-lg max-h-48 overflow-y-auto"
                          >
                            <!-- Search -->
                            <div class="p-2 border-b border-edge">
                              <input
                                v-model="ownerSearchQuery"
                                type="text"
                                placeholder="搜尋成員..."
                                class="w-full px-2 py-1 text-sm bg-surface-secondary border border-edge rounded text-content placeholder:text-content-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
                              />
                            </div>
                            <!-- Member List -->
                            <div class="py-1">
                              <button
                                v-for="member in filteredMembers"
                                :key="member.id"
                                type="button"
                                @click="selectOwner(member)"
                                class="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-surface-hover transition-colors"
                                :class="{ 'bg-accent/10': ownerId === member.id }"
                              >
                                <UserAvatar :user="member" size="sm" />
                                <div class="flex-1 min-w-0">
                                  <div class="text-sm text-content truncate">{{ member.name || member.username }}</div>
                                  <div class="text-xs text-content-tertiary truncate">@{{ member.username }}</div>
                                </div>
                              </button>
                              <div v-if="filteredMembers.length === 0" class="px-3 py-2 text-sm text-content-tertiary">
                                找不到成員
                              </div>
                            </div>
                          </div>
                        </Transition>
                      </div>
                      <p class="mt-1 text-xs text-content-tertiary">
                        選擇負責此任務的成員
                      </p>
                    </div>

                    <!-- Swimlane -->
                    <div>
                      <label for="task-swimlane" class="block text-sm font-medium text-content mb-1">
                        泳道
                      </label>
                      <select
                        id="task-swimlane"
                        v-model="swimlaneId"
                        :disabled="isSubmitting"
                        class="w-full px-2 py-1.5 text-sm bg-surface border border-edge rounded-md text-content focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-50"
                      >
                        <option :value="undefined">預設泳道</option>
                        <option
                          v-for="sl in swimlanes"
                          :key="sl.id"
                          :value="sl.id"
                        >
                          {{ sl.name }}
                        </option>
                      </select>
                    </div>

                    <!-- Category -->
                    <div>
                      <label for="task-category" class="block text-sm font-medium text-content mb-1">
                        類別
                      </label>
                      <select
                        id="task-category"
                        v-model="categoryId"
                        :disabled="isSubmitting"
                        class="w-full px-2 py-1.5 text-sm bg-surface border border-edge rounded-md text-content focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-50"
                      >
                        <option :value="undefined">無類別</option>
                        <option
                          v-for="cat in categories"
                          :key="cat.id"
                          :value="cat.id"
                        >
                          {{ cat.name }}
                        </option>
                      </select>
                    </div>

                    <!-- Due Date -->
                    <div>
                      <label for="task-due" class="block text-sm font-medium text-content mb-1">
                        到期日
                      </label>
                      <input
                        id="task-due"
                        v-model="dateDue"
                        type="date"
                        :disabled="isSubmitting"
                        class="w-full px-2 py-1.5 text-sm bg-surface border border-edge rounded-md text-content focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-50"
                      />
                    </div>

                    <!-- Priority -->
                    <div>
                      <label for="task-priority" class="block text-sm font-medium text-content mb-1">
                        優先級
                      </label>
                      <input
                        id="task-priority"
                        v-model.number="priority"
                        type="number"
                        min="0"
                        :disabled="isSubmitting"
                        placeholder="0"
                        class="w-full px-2 py-1.5 text-sm bg-surface border border-edge rounded-md text-content placeholder:text-content-tertiary focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
                      />
                    </div>

                    <!-- Score -->
                    <div>
                      <label for="task-score" class="block text-sm font-medium text-content mb-1">
                        Story Points
                      </label>
                      <input
                        id="task-score"
                        v-model.number="score"
                        type="number"
                        min="0"
                        :disabled="isSubmitting"
                        placeholder="0"
                        class="w-full px-2 py-1.5 text-sm bg-surface border border-edge rounded-md text-content placeholder:text-content-tertiary focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
                      />
                    </div>

                    <!-- Spacer for grid alignment -->
                    <div></div>

                    <!-- Tags (full width) -->
                    <div class="col-span-2 tag-dropdown-container">
                      <label class="block text-sm font-medium text-content mb-1">
                        標籤
                      </label>
                      <!-- Selected Tags -->
                      <div v-if="selectedTags.length > 0" class="flex flex-wrap gap-1 mb-2">
                        <span
                          v-for="tag in selectedTags"
                          :key="tag"
                          class="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-accent/10 text-accent rounded"
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
                          class="w-full px-2 py-1.5 text-sm bg-surface border border-edge rounded-md text-content placeholder:text-content-tertiary focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
                          placeholder="輸入標籤..."
                          @focus="showTagDropdown = true"
                          @keydown="handleTagInputKeydown"
                        />
                        <!-- Tag Dropdown -->
                        <Transition name="dropdown">
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
                        </Transition>
                      </div>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- Footer -->
            <div class="flex justify-end gap-3 p-4 border-t border-edge">
              <button
                type="button"
                @click="handleClose"
                :disabled="isSubmitting"
                class="px-4 py-2 text-sm font-medium text-content bg-surface-secondary hover:bg-surface-hover rounded-md transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="submit"
                :disabled="!isValid || isSubmitting"
                class="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent/90 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <ph-icon v-if="isSubmitting" icon="spinner" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                {{ isSubmitting ? (isEditMode ? '儲存中...' : '建立中...') : (isEditMode ? '儲存變更' : '建立任務') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Modal Transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* Modal Size Transition */
.modal-transition {
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Slide Transition for Advanced Panel */
.slide-enter-active {
  transition: all 0.3s ease-out;
}

.slide-leave-active {
  transition: all 0.2s ease-in;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(1rem);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(1rem);
}

/* Dropdown Transition */
.dropdown-enter-active {
  transition: all 0.15s ease-out;
}

.dropdown-leave-active {
  transition: all 0.1s ease-in;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-0.25rem);
}
</style>
