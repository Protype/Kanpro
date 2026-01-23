<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTasksStore, type CreateTaskParams } from '@/stores/tasks'
import { useBoardStore } from '@/stores/board'
import { useMembersStore } from '@/stores/members'
import { useCategoriesStore } from '@/stores/categories'
import { useSwimlanesStore } from '@/stores/swimlanes'
import { useTagsStore } from '@/stores/tags'
import { useToast } from '@/stores/toast'
import type { ProjectMember } from '@/types'

const route = useRoute()
const router = useRouter()
const tasksStore = useTasksStore()
const boardStore = useBoardStore()
const membersStore = useMembersStore()
const categoriesStore = useCategoriesStore()
const swimlanesStore = useSwimlanesStore()
const tagsStore = useTagsStore()
const toast = useToast()

const projectId = computed(() => Number(route.params.id))

// === A 層欄位（基本） ===
const title = ref('')
const description = ref('')
const colorId = ref('yellow')
const columnId = ref<number>(0)

// === B 層欄位（進階） ===
const ownerId = ref<number | undefined>(undefined)
const swimlaneId = ref<number | undefined>(undefined)
const categoryId = ref<number | undefined>(undefined)
const dateDue = ref('')
const priority = ref<number | undefined>(undefined)
const score = ref<number | undefined>(undefined)
const selectedTags = ref<string[]>([])

// === C 層欄位（完整） ===
const dateStarted = ref('')
const timeEstimated = ref<number | undefined>(undefined)
const timeSpent = ref<number | undefined>(undefined)
const reference = ref('')

// === UI 狀態 ===
const isSubmitting = ref(false)
const ownerSearchQuery = ref('')
const showOwnerDropdown = ref(false)
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

const columns = computed(() => boardStore.columns)
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
onMounted(async () => {
  // 先恢復草稿資料，讓 column_id 等值不被 loadProjectData 覆蓋
  restoreDraftData()
  await loadProjectData()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

watch(() => projectId.value, async (id) => {
  if (id) {
    await loadProjectData()
  }
})

// === 方法 ===
async function loadProjectData() {
  if (!projectId.value) return

  await Promise.all([
    boardStore.fetchBoard(projectId.value),
    membersStore.fetchMembers(projectId.value),
    categoriesStore.fetchCategories(projectId.value),
    swimlanesStore.fetchSwimlanes(projectId.value),
    tagsStore.fetchTags(projectId.value)
  ])

  // 設定預設欄位（只在沒有值時設定）
  if (columns.value.length > 0 && columnId.value === 0) {
    columnId.value = columns.value[0].id
  }
}

function restoreDraftData() {
  const draft = sessionStorage.getItem('kanpro_task_draft')
  if (draft) {
    try {
      const data = JSON.parse(draft)
      title.value = data.title || ''
      description.value = data.description || ''
      colorId.value = data.color_id || 'yellow'
      if (data.column_id) columnId.value = data.column_id
      ownerId.value = data.owner_id || undefined
      swimlaneId.value = data.swimlane_id || undefined
      categoryId.value = data.category_id || undefined
      dateDue.value = data.date_due || ''
      priority.value = data.priority || undefined
      score.value = data.score || undefined
      selectedTags.value = data.tags || []
    } catch {
      // ignore parse error
    }
    // 清除草稿
    sessionStorage.removeItem('kanpro_task_draft')
  }
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

function selectOwner(member: ProjectMember) {
  ownerId.value = member.id
  ownerSearchQuery.value = ''
  showOwnerDropdown.value = false
}

function clearOwner() {
  ownerId.value = undefined
  ownerSearchQuery.value = ''
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

async function handleSubmit() {
  if (!isValid.value || isSubmitting.value) return

  isSubmitting.value = true

  const params: CreateTaskParams = {
    project_id: projectId.value,
    title: title.value.trim(),
    description: description.value.trim() || undefined,
    color_id: colorId.value,
    column_id: columnId.value
  }

  // B 層欄位
  if (ownerId.value) params.owner_id = ownerId.value
  if (swimlaneId.value) params.swimlane_id = swimlaneId.value
  if (categoryId.value) params.category_id = categoryId.value
  if (dateDue.value) params.date_due = dateDue.value
  if (priority.value !== undefined) params.priority = priority.value
  if (score.value !== undefined) params.score = score.value
  if (selectedTags.value.length > 0) params.tags = selectedTags.value

  // C 層欄位
  if (dateStarted.value) params.date_started = dateStarted.value
  if (timeEstimated.value !== undefined) params.time_estimated = timeEstimated.value
  if (timeSpent.value !== undefined) params.time_spent = timeSpent.value
  if (reference.value.trim()) params.reference = reference.value.trim()

  try {
    const taskId = await tasksStore.createTask(params)
    toast.success('任務建立成功')
    // 跳轉到看板頁面並開啟任務詳情
    router.push({
      name: 'project-board',
      params: { id: projectId.value },
      query: { task: taskId }
    })
  } catch (error) {
    toast.error('建立任務失敗', error instanceof Error ? error.message : '未知錯誤')
    isSubmitting.value = false
  }
}

function handleCancel() {
  router.back()
}
</script>

<template>
  <div class="min-h-full bg-surface-secondary">
    <!-- Header -->
    <div class="bg-surface border-b border-edge">
      <div class="max-w-5xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <button
              @click="handleCancel"
              class="text-content-tertiary hover:text-content-secondary transition-colors"
            >
              <ph-icon icon="arrow-left" class="w-5 h-5" />
            </button>
            <h1 class="text-xl font-semibold text-content">新增任務</h1>
          </div>
          <div class="flex items-center gap-3">
            <button
              type="button"
              @click="handleCancel"
              :disabled="isSubmitting"
              class="px-4 py-2 text-sm font-medium text-content bg-surface-secondary hover:bg-surface-hover rounded-md transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="button"
              @click="handleSubmit"
              :disabled="!isValid || isSubmitting"
              class="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent/90 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <ph-icon v-if="isSubmitting" icon="spinner" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
              {{ isSubmitting ? '建立中...' : '建立任務' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-5xl mx-auto px-6 py-6">
      <form @submit.prevent="handleSubmit" class="grid grid-cols-3 gap-6">
        <!-- 左欄：A + B 層（2/3 寬度） -->
        <div class="col-span-2 space-y-6">
          <!-- A 層：基本資訊 -->
          <div class="card p-6 space-y-4">
            <h2 class="text-sm font-semibold text-content-secondary uppercase tracking-wider">基本資訊</h2>

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
                rows="6"
                :disabled="isSubmitting"
                class="w-full px-3 py-2 bg-surface-secondary border border-edge rounded-md text-content placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-50 resize-none"
                placeholder="輸入任務描述（支援 Markdown）"
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
                <div class="flex flex-wrap gap-2 py-1">
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
          </div>

          <!-- B 層：進階設定 -->
          <div class="card p-6 space-y-4">
            <h2 class="text-sm font-semibold text-content-secondary uppercase tracking-wider">進階設定</h2>

            <div class="grid grid-cols-2 gap-4">
              <!-- Owner -->
              <div class="owner-dropdown-container">
                <label class="block text-sm font-medium text-content mb-1">
                  指派人
                </label>
                <div class="relative">
                  <button
                    type="button"
                    @click="showOwnerDropdown = !showOwnerDropdown"
                    class="w-full px-3 py-2 bg-surface-secondary border border-edge rounded-md text-left flex items-center gap-2 hover:bg-surface-hover transition-colors"
                    :disabled="isSubmitting"
                  >
                    <template v-if="selectedOwner">
                      <div class="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs text-accent font-medium">
                        {{ selectedOwner.name?.[0] || selectedOwner.username[0] }}
                      </div>
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

                  <Transition name="dropdown">
                    <div
                      v-if="showOwnerDropdown"
                      class="absolute z-10 w-full mt-1 bg-surface border border-edge rounded-md shadow-lg max-h-48 overflow-y-auto"
                    >
                      <div class="p-2 border-b border-edge">
                        <input
                          v-model="ownerSearchQuery"
                          type="text"
                          placeholder="搜尋成員..."
                          class="w-full px-2 py-1 text-sm bg-surface-secondary border border-edge rounded text-content placeholder:text-content-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                      </div>
                      <div class="py-1">
                        <button
                          v-for="member in filteredMembers"
                          :key="member.id"
                          type="button"
                          @click="selectOwner(member)"
                          class="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-surface-hover transition-colors"
                          :class="{ 'bg-accent/10': ownerId === member.id }"
                        >
                          <div class="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs text-accent font-medium">
                            {{ member.name?.[0] || member.username[0] }}
                          </div>
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
                  class="w-full px-3 py-2 bg-surface-secondary border border-edge rounded-md text-content focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-50"
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

              <!-- Swimlane -->
              <div>
                <label for="task-swimlane" class="block text-sm font-medium text-content mb-1">
                  泳道
                </label>
                <select
                  id="task-swimlane"
                  v-model="swimlaneId"
                  :disabled="isSubmitting"
                  class="w-full px-3 py-2 bg-surface-secondary border border-edge rounded-md text-content focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-50"
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
                  class="w-full px-3 py-2 bg-surface-secondary border border-edge rounded-md text-content focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-50"
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
                  class="w-full px-3 py-2 bg-surface-secondary border border-edge rounded-md text-content placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-50"
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
                  class="w-full px-3 py-2 bg-surface-secondary border border-edge rounded-md text-content placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-50"
                />
              </div>
            </div>

            <!-- Tags -->
            <div class="tag-dropdown-container">
              <label class="block text-sm font-medium text-content mb-1">
                標籤
              </label>
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
              <div class="relative">
                <input
                  v-model="newTagInput"
                  type="text"
                  :disabled="isSubmitting"
                  class="w-full px-3 py-2 bg-surface-secondary border border-edge rounded-md text-content placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-50"
                  placeholder="輸入標籤名稱..."
                  @focus="showTagDropdown = true"
                  @keydown="handleTagInputKeydown"
                />
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

        <!-- 右欄：C 層（1/3 寬度） -->
        <div class="space-y-6">
          <!-- C 層：時間與追蹤 -->
          <div class="card p-6 space-y-4">
            <h2 class="text-sm font-semibold text-content-secondary uppercase tracking-wider">時間追蹤</h2>

            <!-- Start Date -->
            <div>
              <label for="task-start" class="block text-sm font-medium text-content mb-1">
                開始日期
              </label>
              <input
                id="task-start"
                v-model="dateStarted"
                type="date"
                :disabled="isSubmitting"
                class="w-full px-3 py-2 bg-surface-secondary border border-edge rounded-md text-content focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-50"
              />
            </div>

            <!-- Time Estimated -->
            <div>
              <label for="task-estimated" class="block text-sm font-medium text-content mb-1">
                預估時間（小時）
              </label>
              <input
                id="task-estimated"
                v-model.number="timeEstimated"
                type="number"
                min="0"
                step="0.5"
                :disabled="isSubmitting"
                placeholder="0"
                class="w-full px-3 py-2 bg-surface-secondary border border-edge rounded-md text-content placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-50"
              />
            </div>

            <!-- Time Spent -->
            <div>
              <label for="task-spent" class="block text-sm font-medium text-content mb-1">
                已花費時間（小時）
              </label>
              <input
                id="task-spent"
                v-model.number="timeSpent"
                type="number"
                min="0"
                step="0.5"
                :disabled="isSubmitting"
                placeholder="0"
                class="w-full px-3 py-2 bg-surface-secondary border border-edge rounded-md text-content placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-50"
              />
            </div>
          </div>

          <!-- Reference -->
          <div class="card p-6 space-y-4">
            <h2 class="text-sm font-semibold text-content-secondary uppercase tracking-wider">外部連結</h2>

            <div>
              <label for="task-reference" class="block text-sm font-medium text-content mb-1">
                外部參考
              </label>
              <input
                id="task-reference"
                v-model="reference"
                type="text"
                :disabled="isSubmitting"
                placeholder="例如：JIRA-123 或 GitHub Issue URL"
                class="w-full px-3 py-2 bg-surface-secondary border border-edge rounded-md text-content placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-50"
              />
              <p class="mt-1 text-xs text-content-tertiary">
                可填入外部系統的 ID 或連結
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
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
