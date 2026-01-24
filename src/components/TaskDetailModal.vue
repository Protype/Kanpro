<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import { useMembersStore } from '@/stores/members'
import { useCategoriesStore } from '@/stores/categories'
import { useSwimlanesStore } from '@/stores/swimlanes'
import SubtasksList from '@/components/SubtasksList.vue'
import CommentsList from '@/components/CommentsList.vue'
import TaskTags from '@/components/TaskTags.vue'
import AttachmentsList from '@/components/AttachmentsList.vue'
import TaskLinksList from '@/components/TaskLinksList.vue'
import type { BoardColumn } from '@/stores/board'
import type { Task } from '@/types'

const props = defineProps<{
  isOpen: boolean
  task: Task | null
  columns: BoardColumn[]
  projectId: number
}>()

const emit = defineEmits<{
  close: []
  updated: []
}>()

const tasksStore = useTasksStore()
const membersStore = useMembersStore()
const categoriesStore = useCategoriesStore()
const swimlanesStore = useSwimlanesStore()

// Edit states
const isEditingTitle = ref(false)
const isEditingDescription = ref(false)
const editTitle = ref('')
const editDescription = ref('')
const isUpdating = ref(false)

const colors = [
  { id: 'yellow', name: '黃色', class: 'bg-yellow-500' },
  { id: 'blue', name: '藍色', class: 'bg-blue-500' },
  { id: 'green', name: '綠色', class: 'bg-green-500' },
  { id: 'purple', name: '紫色', class: 'bg-purple-500' },
  { id: 'red', name: '紅色', class: 'bg-red-500' },
  { id: 'orange', name: '橘色', class: 'bg-orange-500' },
  { id: 'grey', name: '灰色', class: 'bg-gray-500' },
  { id: 'cyan', name: '青色', class: 'bg-cyan-500' },
  { id: 'lime', name: '萊姆綠', class: 'bg-lime-500' },
  { id: 'pink', name: '粉紅', class: 'bg-pink-500' },
  { id: 'teal', name: '藍綠', class: 'bg-teal-500' },
  { id: 'amber', name: '琥珀', class: 'bg-amber-500' },
  { id: 'brown', name: '棕色', class: 'bg-amber-800' },
  { id: 'deep_orange', name: '深橘', class: 'bg-orange-700' },
  { id: 'dark_grey', name: '深灰', class: 'bg-gray-700' },
  { id: 'white', name: '白色', class: 'bg-white border border-edge' }
]

const statusLabel = computed(() => props.task?.is_active ? '開啟' : '已關閉')

const formattedCreationDate = computed(() => {
  if (!props.task?.date_creation) return '-'
  return new Date(props.task.date_creation * 1000).toLocaleString('zh-TW')
})

const formattedModificationDate = computed(() => {
  if (!props.task?.date_modification) return '-'
  return new Date(props.task.date_modification * 1000).toLocaleString('zh-TW')
})

const formattedDueDate = computed(() => {
  if (!props.task?.date_due) return null
  return new Date(props.task.date_due * 1000).toLocaleDateString('zh-TW')
})

// B 層欄位相關
// 使用 assignableUsers 而非 members，因為任務只能指派給可指派的成員（不含瀏覽者）
const assignableUsers = computed(() => membersStore.assignableUsers)
const categories = computed(() => categoriesStore.categories)
const swimlanes = computed(() => swimlanesStore.activeSwimlanes)

watch(() => props.isOpen, async (open) => {
  if (open && props.task) {
    editTitle.value = props.task.title
    editDescription.value = props.task.description || ''
    isEditingTitle.value = false
    isEditingDescription.value = false
    // 載入 B 層欄位所需的資料
    await loadProjectData()
  }
})

async function loadProjectData() {
  if (!props.projectId) return
  await Promise.all([
    membersStore.fetchMembers(props.projectId),
    categoriesStore.fetchCategories(props.projectId),
    swimlanesStore.fetchSwimlanes(props.projectId)
  ])
}

const handleClose = () => {
  if (!isUpdating.value) {
    emit('close')
  }
}

const startEditTitle = () => {
  if (props.task) {
    editTitle.value = props.task.title
    isEditingTitle.value = true
  }
}

const cancelEditTitle = () => {
  isEditingTitle.value = false
  if (props.task) {
    editTitle.value = props.task.title
  }
}

const saveTitle = async () => {
  if (!props.task || !editTitle.value.trim()) return

  isUpdating.value = true
  try {
    await tasksStore.updateTask(props.task.id, { title: editTitle.value.trim() })
    isEditingTitle.value = false
    emit('updated')
  } catch (error) {
    console.error('Failed to update title:', error)
    alert('更新標題失敗')
  } finally {
    isUpdating.value = false
  }
}

const startEditDescription = () => {
  if (props.task) {
    editDescription.value = props.task.description || ''
    isEditingDescription.value = true
  }
}

const cancelEditDescription = () => {
  isEditingDescription.value = false
  if (props.task) {
    editDescription.value = props.task.description || ''
  }
}

const saveDescription = async () => {
  if (!props.task) return

  isUpdating.value = true
  try {
    await tasksStore.updateTask(props.task.id, { description: editDescription.value })
    isEditingDescription.value = false
    emit('updated')
  } catch (error) {
    console.error('Failed to update description:', error)
    alert('更新描述失敗')
  } finally {
    isUpdating.value = false
  }
}

const updateColor = async (colorId: string) => {
  if (!props.task || props.task.color_id === colorId) return

  isUpdating.value = true
  try {
    await tasksStore.updateTask(props.task.id, { color_id: colorId })
    emit('updated')
  } catch (error) {
    console.error('Failed to update color:', error)
    alert('更新顏色失敗')
  } finally {
    isUpdating.value = false
  }
}

const closeTask = async () => {
  if (!props.task) return

  isUpdating.value = true
  try {
    await tasksStore.closeTask(props.task.id)
    emit('updated')
  } catch (error) {
    console.error('Failed to close task:', error)
    alert('關閉任務失敗')
  } finally {
    isUpdating.value = false
  }
}

const openTask = async () => {
  if (!props.task) return

  isUpdating.value = true
  try {
    await tasksStore.openTask(props.task.id)
    emit('updated')
  } catch (error) {
    console.error('Failed to open task:', error)
    alert('重新開啟任務失敗')
  } finally {
    isUpdating.value = false
  }
}

// B 層欄位更新方法
const updateOwner = async (ownerId: number | null) => {
  if (!props.task) return
  isUpdating.value = true
  try {
    await tasksStore.updateTask(props.task.id, { owner_id: ownerId || 0 })
    emit('updated')
  } catch (error) {
    console.error('Failed to update owner:', error)
  } finally {
    isUpdating.value = false
  }
}

const updateColumn = async (columnId: number) => {
  if (!props.task || props.task.column_id === columnId) return
  isUpdating.value = true
  try {
    await tasksStore.updateTask(props.task.id, { column_id: columnId })
    emit('updated')
  } catch (error) {
    console.error('Failed to update column:', error)
  } finally {
    isUpdating.value = false
  }
}

const updateSwimlane = async (swimlaneId: number | null) => {
  if (!props.task) return
  isUpdating.value = true
  try {
    await tasksStore.updateTask(props.task.id, { swimlane_id: swimlaneId || 0 })
    emit('updated')
  } catch (error) {
    console.error('Failed to update swimlane:', error)
  } finally {
    isUpdating.value = false
  }
}

const updateCategory = async (categoryId: number | null) => {
  if (!props.task) return
  isUpdating.value = true
  try {
    await tasksStore.updateTask(props.task.id, { category_id: categoryId || 0 })
    emit('updated')
  } catch (error) {
    console.error('Failed to update category:', error)
  } finally {
    isUpdating.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen && task"
      data-testid="task-detail-modal"
      class="fixed inset-0 z-50 overflow-y-auto"
    >
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black/50 transition-opacity"
        @click="handleClose"
      ></div>

      <!-- Modal -->
      <div class="flex min-h-full items-center justify-center p-4">
        <div
          class="relative bg-surface rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          @click.stop
        >
          <!-- Header -->
          <div class="flex items-start justify-between p-4 border-b border-edge">
            <div class="flex-1 min-w-0">
              <!-- Task ID -->
              <div class="text-sm text-content-secondary mb-1">#{{ task.id }}</div>

              <!-- Title -->
              <div v-if="!isEditingTitle" class="flex items-center gap-2">
                <h2 class="text-xl font-semibold text-content truncate">{{ task.title }}</h2>
                <button
                  data-testid="edit-title-btn"
                  @click="startEditTitle"
                  class="text-content-tertiary hover:text-content-secondary"
                  title="編輯標題"
                >
                  <ph-icon icon="pen-to-square" class="w-4 h-4" />
                </button>
              </div>
              <div v-else class="flex items-center gap-2">
                <input
                  data-testid="title-input"
                  v-model="editTitle"
                  type="text"
                  class="flex-1 px-2 py-1 border border-edge rounded focus:outline-none focus:ring-2 focus:ring-accent"
                  @keyup.enter="saveTitle"
                  @keyup.escape="cancelEditTitle"
                />
                <button
                  data-testid="save-title-btn"
                  @click="saveTitle"
                  :disabled="isUpdating"
                  class="text-success hover:opacity-80"
                >
                  <ph-icon icon="check" class="w-5 h-5" />
                </button>
                <button
                  @click="cancelEditTitle"
                  class="text-content-tertiary hover:text-content-secondary"
                >
                  <ph-icon icon="xmark" class="w-5 h-5" />
                </button>
              </div>
            </div>

            <!-- Close button -->
            <button
              data-testid="close-modal-btn"
              @click="handleClose"
              class="text-content-tertiary hover:text-content-secondary ml-4"
              :disabled="isUpdating"
            >
              <ph-icon icon="xmark" class="w-6 h-6" />
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-4">
            <div class="grid grid-cols-3 gap-6">
              <!-- Main content (left side) -->
              <div class="col-span-2 space-y-6">
                <!-- Description -->
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="text-sm font-medium text-content-secondary">描述</h3>
                    <button
                      v-if="!isEditingDescription"
                      @click="startEditDescription"
                      class="text-content-tertiary hover:text-content-secondary text-sm"
                    >
                      編輯
                    </button>
                  </div>
                  <div v-if="!isEditingDescription">
                    <p v-if="task.description" class="text-content-secondary whitespace-pre-wrap">{{ task.description }}</p>
                    <p v-else class="text-content-tertiary italic">無描述</p>
                  </div>
                  <div v-else class="space-y-2">
                    <textarea
                      v-model="editDescription"
                      rows="4"
                      class="w-full px-3 py-2 border border-edge rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="輸入任務描述..."
                    ></textarea>
                    <div class="flex gap-2">
                      <button
                        @click="saveDescription"
                        :disabled="isUpdating"
                        class="px-3 py-1 text-sm bg-accent text-content-inverse rounded hover:bg-accent-hover disabled:opacity-50"
                      >
                        儲存
                      </button>
                      <button
                        @click="cancelEditDescription"
                        class="px-3 py-1 text-sm bg-surface-tertiary text-content rounded hover:bg-surface-hover"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Subtasks -->
                <div class="border-t border-edge pt-4">
                  <SubtasksList
                    :task-id="task.id"
                    @updated="emit('updated')"
                  />
                </div>

                <!-- Comments -->
                <div class="border-t border-edge pt-4">
                  <CommentsList
                    :task-id="task.id"
                    @updated="emit('updated')"
                  />
                </div>

                <!-- Attachments -->
                <div class="border-t border-edge pt-4">
                  <AttachmentsList
                    :task-id="task.id"
                    :project-id="projectId"
                    @updated="emit('updated')"
                  />
                </div>

                <!-- Task Links -->
                <div class="border-t border-edge pt-4">
                  <TaskLinksList
                    :task-id="task.id"
                    :project-id="projectId"
                    @updated="emit('updated')"
                  />
                </div>
              </div>

              <!-- Sidebar (right side) -->
              <div class="space-y-4">
                <!-- Status -->
                <div>
                  <h3 class="text-sm font-medium text-content-secondary mb-2">狀態</h3>
                  <div class="flex items-center gap-2">
                    <span
                      :class="[
                        'px-2 py-1 text-xs font-medium rounded',
                        task.is_active ? 'bg-success/20 text-success' : 'bg-surface-tertiary text-content-secondary'
                      ]"
                    >
                      {{ statusLabel }}
                    </span>
                    <button
                      v-if="task.is_active"
                      data-testid="close-task-btn"
                      @click="closeTask"
                      :disabled="isUpdating"
                      class="text-xs text-content-tertiary hover:text-content-secondary"
                    >
                      關閉任務
                    </button>
                    <button
                      v-else
                      data-testid="open-task-btn"
                      @click="openTask"
                      :disabled="isUpdating"
                      class="text-xs text-accent hover:text-accent-hover"
                    >
                      重新開啟
                    </button>
                  </div>
                </div>

                <!-- Assignee -->
                <div>
                  <h3 class="text-sm font-medium text-content-secondary mb-2">指派人</h3>
                  <select
                    :value="task.owner_id || ''"
                    @change="updateOwner(($event.target as HTMLSelectElement).value ? Number(($event.target as HTMLSelectElement).value) : null)"
                    :disabled="isUpdating"
                    class="w-full text-sm px-2 py-1 border border-edge rounded bg-surface focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="">未指派</option>
                    <option
                      v-for="member in assignableUsers"
                      :key="member.id"
                      :value="member.id"
                    >
                      {{ member.name || member.username }}
                    </option>
                  </select>
                </div>

                <!-- Column -->
                <div>
                  <h3 class="text-sm font-medium text-content-secondary mb-2">清單</h3>
                  <select
                    :value="task.column_id"
                    @change="updateColumn(Number(($event.target as HTMLSelectElement).value))"
                    :disabled="isUpdating"
                    class="w-full text-sm px-2 py-1 border border-edge rounded bg-surface focus:outline-none focus:ring-1 focus:ring-accent"
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

                <!-- Swimlane -->
                <div>
                  <h3 class="text-sm font-medium text-content-secondary mb-2">泳道</h3>
                  <select
                    :value="task.swimlane_id || ''"
                    @change="updateSwimlane(($event.target as HTMLSelectElement).value ? Number(($event.target as HTMLSelectElement).value) : null)"
                    :disabled="isUpdating"
                    class="w-full text-sm px-2 py-1 border border-edge rounded bg-surface focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="">預設泳道</option>
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
                  <h3 class="text-sm font-medium text-content-secondary mb-2">類別</h3>
                  <select
                    :value="task.category_id || ''"
                    @change="updateCategory(($event.target as HTMLSelectElement).value ? Number(($event.target as HTMLSelectElement).value) : null)"
                    :disabled="isUpdating"
                    class="w-full text-sm px-2 py-1 border border-edge rounded bg-surface focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="">無類別</option>
                    <option
                      v-for="category in categories"
                      :key="category.id"
                      :value="category.id"
                    >
                      {{ category.name }}
                    </option>
                  </select>
                </div>

                <!-- Color -->
                <div data-testid="color-selector">
                  <h3 class="text-sm font-medium text-content-secondary mb-2">顏色</h3>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="color in colors"
                      :key="color.id"
                      :data-testid="`color-${color.id}`"
                      @click="updateColor(color.id)"
                      :disabled="isUpdating"
                      :class="[
                        'w-6 h-6 rounded-full transition-transform',
                        color.class,
                        task.color_id === color.id ? 'ring-2 ring-offset-1 ring-content-tertiary scale-110' : 'hover:scale-105'
                      ]"
                      :title="color.name"
                    ></button>
                  </div>
                </div>

                <!-- Tags -->
                <div>
                  <TaskTags
                    :task-id="task.id"
                    :project-id="projectId"
                    @updated="emit('updated')"
                  />
                </div>

                <!-- Due Date -->
                <div data-testid="due-date" v-if="formattedDueDate">
                  <h3 class="text-sm font-medium text-content-secondary mb-2">到期日</h3>
                  <span class="text-sm text-content-secondary">{{ formattedDueDate }}</span>
                </div>

                <!-- Priority & Score -->
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <h3 class="text-sm font-medium text-content-secondary mb-2">優先級</h3>
                    <span class="text-sm text-content-secondary">{{ task.priority || '-' }}</span>
                  </div>
                  <div>
                    <h3 class="text-sm font-medium text-content-secondary mb-2">Story Points</h3>
                    <span class="text-sm text-content-secondary">{{ task.score || '-' }}</span>
                  </div>
                </div>

                <!-- Dates -->
                <div class="pt-4 border-t border-edge space-y-2">
                  <div>
                    <span class="text-xs text-content-tertiary">建立於</span>
                    <span class="text-xs text-content-secondary ml-1">{{ formattedCreationDate }}</span>
                  </div>
                  <div>
                    <span class="text-xs text-content-tertiary">更新於</span>
                    <span class="text-xs text-content-secondary ml-1">{{ formattedModificationDate }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
