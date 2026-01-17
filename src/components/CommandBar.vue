<script setup lang="ts">
import { ref, watch, computed, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useSearchStore } from '@/stores/search'
import { useSidebarStore } from '@/stores/sidebar'
import { useProjectsStore } from '@/stores/projects'
import { useTasksStore } from '@/stores/tasks'
import { parseInput, getCurrentSymbol } from '@/composables/useSymbolParser'
import type { Task } from '@/types'

type CommandMode = 'search' | 'add'

const props = withDefaults(defineProps<{
  isOpen?: boolean
  projectId?: number
}>(), {
  isOpen: false,
  projectId: 0
})

const emit = defineEmits<{
  close: []
  select: [task: Task]
}>()

const router = useRouter()
const searchStore = useSearchStore()
const sidebarStore = useSidebarStore()
const projectsStore = useProjectsStore()
const tasksStore = useTasksStore()

// State
const mode = ref<CommandMode>('search')
const inputValue = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const debounceTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const isSubmitting = ref(false)
const errorMessage = ref('')
const cursorPosition = ref(0)

// Computed
const currentProjectId = computed(() => props.projectId || sidebarStore.currentProjectId || 0)

const currentProject = computed(() => {
  if (!currentProjectId.value) return null
  return projectsStore.getProjectById(currentProjectId.value)
})

const parsedInput = computed(() => parseInput(inputValue.value))

const activeSymbol = computed(() => {
  if (mode.value !== 'add') return null
  return getCurrentSymbol(inputValue.value, cursorPosition.value)
})

const placeholder = computed(() => {
  if (mode.value === 'search') {
    return '搜尋任務... (例如: status:open)'
  }
  return '輸入任務標題... (使用 ^ @ # 快速設定)'
})

const colorClasses: Record<string, string> = {
  yellow: 'bg-yellow-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  grey: 'bg-gray-500',
  cyan: 'bg-cyan-500',
  lime: 'bg-lime-500',
  pink: 'bg-pink-500',
  teal: 'bg-teal-500',
  amber: 'bg-amber-500',
  brown: 'bg-amber-800',
  deep_orange: 'bg-orange-700',
  dark_grey: 'bg-gray-700',
  white: 'bg-white border border-gray-300'
}

const getColorClass = (colorId: string) => {
  return colorClasses[colorId] || 'bg-yellow-500'
}

// Watchers
watch(() => props.isOpen, (open) => {
  if (open) {
    inputValue.value = ''
    searchStore.clearSearch()
    // Default to search mode
    mode.value = 'search'
    // Focus input when modal opens
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
})

watch(inputValue, (value) => {
  if (mode.value === 'search') {
    // Debounce search
    if (debounceTimer.value) {
      clearTimeout(debounceTimer.value)
    }

    debounceTimer.value = setTimeout(() => {
      if (value.trim()) {
        searchStore.searchTasks(currentProjectId.value, value.trim())
      } else {
        searchStore.clearSearch()
      }
    }, 300)
  }
})

watch(mode, () => {
  // Clear input when mode changes
  inputValue.value = ''
  searchStore.clearSearch()
  nextTick(() => {
    inputRef.value?.focus()
  })
})

// Methods
const handleClose = () => {
  emit('close')
}

const handleSelect = (task: Task) => {
  emit('select', task)
  router.push(`/projects/${task.project_id}/tasks/${task.id}`)
  emit('close')
}

const switchMode = (newMode: CommandMode) => {
  mode.value = newMode
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    handleClose()
  }
  // Tab to switch modes
  if (e.key === 'Tab') {
    e.preventDefault()
    mode.value = mode.value === 'search' ? 'add' : 'search'
  }
}

const handleSubmitAdd = async () => {
  if (!parsedInput.value.title.trim() || isSubmitting.value) return

  // Check if we have a project
  const projectId = currentProjectId.value
  if (!projectId) {
    errorMessage.value = '請先選擇專案或在專案頁面中新增任務'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const taskId = await tasksStore.createTask({
      project_id: projectId,
      title: parsedInput.value.title,
      priority: parsedInput.value.priority,
      date_due: parsedInput.value.dueDate
      // Note: tags, assignee, column need to be resolved to IDs
      // This is a simplified version - full implementation would lookup IDs
    })

    if (taskId) {
      // Success - close and navigate to task
      emit('close')
      router.push(`/projects/${projectId}/tasks/${taskId}`)
    }
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '建立任務失敗'
  } finally {
    isSubmitting.value = false
  }
}

const handleInputChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  cursorPosition.value = target.selectionStart || 0
}

const handleInputKeyup = (e: KeyboardEvent) => {
  const target = e.target as HTMLInputElement
  cursorPosition.value = target.selectionStart || 0
}

const handleInputClick = (e: MouseEvent) => {
  const target = e.target as HTMLInputElement
  cursorPosition.value = target.selectionStart || 0
}

onUnmounted(() => {
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value)
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      data-testid="command-bar"
      class="fixed inset-0 z-50 overflow-y-auto"
    >
      <!-- Backdrop -->
      <div
        data-testid="command-bar-backdrop"
        class="fixed inset-0 bg-black/50 transition-opacity"
        @click="handleClose"
      ></div>

      <!-- Modal -->
      <div class="flex min-h-full items-start justify-center pt-[12vh] px-4">
        <div
          class="relative bg-surface rounded-xl shadow-2xl w-full max-w-2xl border border-edge overflow-hidden"
          @click.stop
        >
          <!-- Mode Switcher -->
          <div class="flex border-b border-edge">
            <button
              @click="switchMode('search')"
              :class="[
                'flex-1 px-4 py-3 text-sm font-medium transition-colors',
                mode === 'search'
                  ? 'text-accent bg-surface-secondary border-b-2 border-accent -mb-px'
                  : 'text-content-tertiary hover:text-content-secondary hover:bg-surface-hover'
              ]"
            >
              <div class="flex items-center justify-center gap-2">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                搜尋
              </div>
            </button>
            <button
              @click="switchMode('add')"
              :class="[
                'flex-1 px-4 py-3 text-sm font-medium transition-colors',
                mode === 'add'
                  ? 'text-accent bg-surface-secondary border-b-2 border-accent -mb-px'
                  : 'text-content-tertiary hover:text-content-secondary hover:bg-surface-hover'
              ]"
            >
              <div class="flex items-center justify-center gap-2">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                新增任務
              </div>
            </button>
          </div>

          <!-- Input Area -->
          <div class="p-4">
            <div class="relative">
              <svg
                :class="[
                  'absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5',
                  mode === 'search' ? 'text-content-tertiary' : 'text-accent'
                ]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  v-if="mode === 'search'"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
                <path
                  v-else
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <input
                ref="inputRef"
                data-testid="command-bar-input"
                v-model="inputValue"
                type="text"
                :class="[
                  'w-full pl-12 pr-20 py-4 bg-surface-secondary border border-edge rounded-lg',
                  'text-lg text-content placeholder:text-content-tertiary',
                  'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent'
                ]"
                :placeholder="placeholder"
                :disabled="isSubmitting"
                @keydown="handleKeydown"
                @keyup="handleInputKeyup"
                @input="handleInputChange"
                @click="handleInputClick"
                @keyup.enter="mode === 'add' && handleSubmitAdd()"
              />
              <div class="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                <kbd class="px-2 py-1 text-xs bg-surface-tertiary text-content-tertiary rounded border border-edge">
                  Tab
                </kbd>
                <kbd class="px-2 py-1 text-xs bg-surface-tertiary text-content-tertiary rounded border border-edge">
                  ESC
                </kbd>
              </div>
            </div>
          </div>

          <!-- Search Mode Content -->
          <template v-if="mode === 'search'">
            <!-- Search Tips (when no query) -->
            <div v-if="!inputValue && !searchStore.results.length" class="px-4 pb-4 text-sm text-content-tertiary">
              <p class="font-medium mb-2 text-content-secondary">搜尋語法提示：</p>
              <div class="grid grid-cols-2 gap-2">
                <div><code class="bg-surface-tertiary px-1.5 py-0.5 rounded text-xs">status:open</code> 開啟中</div>
                <div><code class="bg-surface-tertiary px-1.5 py-0.5 rounded text-xs">status:closed</code> 已關閉</div>
                <div><code class="bg-surface-tertiary px-1.5 py-0.5 rounded text-xs">assignee:me</code> 指派給我</div>
                <div><code class="bg-surface-tertiary px-1.5 py-0.5 rounded text-xs">due:today</code> 今天到期</div>
                <div><code class="bg-surface-tertiary px-1.5 py-0.5 rounded text-xs">#123</code> 任務編號</div>
                <div><code class="bg-surface-tertiary px-1.5 py-0.5 rounded text-xs">color:blue</code> 藍色任務</div>
              </div>
            </div>

            <!-- Loading -->
            <div v-if="searchStore.isSearching" class="p-8 text-center">
              <svg class="animate-spin h-6 w-6 text-accent mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>

            <!-- Results -->
            <div v-else-if="searchStore.results.length > 0" class="max-h-80 overflow-y-auto border-t border-edge">
              <div
                v-for="task in searchStore.results"
                :key="task.id"
                data-testid="search-result-item"
                @click="handleSelect(task)"
                class="px-4 py-3 hover:bg-surface-hover cursor-pointer flex items-center gap-3 border-b border-edge last:border-b-0 transition-colors"
              >
                <div
                  :class="['w-3 h-3 rounded-full flex-shrink-0', getColorClass(task.color_id)]"
                ></div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-content-tertiary text-sm">#{{ task.id }}</span>
                    <span class="font-medium text-content truncate">{{ task.title }}</span>
                  </div>
                  <p v-if="task.description" class="text-sm text-content-tertiary truncate">
                    {{ task.description }}
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <span
                    :class="[
                      'px-2 py-0.5 text-xs rounded',
                      task.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    ]"
                  >
                    {{ task.is_active ? '開啟' : '已關閉' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- No Results -->
            <div
              v-else-if="inputValue && !searchStore.isSearching && searchStore.results.length === 0"
              class="p-8 text-center text-content-tertiary border-t border-edge"
            >
              <svg class="w-12 h-12 mx-auto text-content-tertiary/30 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>找不到符合的任務</p>
              <p class="text-sm mt-1">嘗試其他搜尋詞或搜尋語法</p>
            </div>
          </template>

          <!-- Add Task Mode Content -->
          <template v-else>
            <!-- Error Message -->
            <div v-if="errorMessage" class="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p class="text-sm text-red-600">{{ errorMessage }}</p>
            </div>

            <!-- Parsed Input Preview -->
            <div v-if="parsedInput.symbols.length > 0" class="px-4 pb-4">
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="sym in parsedInput.symbols"
                  :key="sym.startIndex"
                  class="inline-flex items-center gap-1 px-2 py-1 bg-surface-tertiary rounded text-sm"
                >
                  <code class="text-accent">{{ sym.symbol }}</code>
                  <span class="text-content">{{ sym.value }}</span>
                </span>
              </div>
            </div>

            <!-- Symbol Hints (when no input) -->
            <div v-if="!inputValue" class="px-4 pb-4 text-sm text-content-tertiary">
              <p class="font-medium mb-2 text-content-secondary">快速輸入提示：</p>
              <div class="grid grid-cols-2 gap-2">
                <div><code class="bg-surface-tertiary px-1.5 py-0.5 rounded text-xs text-accent">^</code> 選擇專案</div>
                <div><code class="bg-surface-tertiary px-1.5 py-0.5 rounded text-xs text-accent">@</code> 指派人員</div>
                <div><code class="bg-surface-tertiary px-1.5 py-0.5 rounded text-xs text-accent">#</code> 標籤</div>
                <div><code class="bg-surface-tertiary px-1.5 py-0.5 rounded text-xs text-accent">:</code> 欄位</div>
                <div><code class="bg-surface-tertiary px-1.5 py-0.5 rounded text-xs text-accent">!</code> 優先級</div>
                <div><code class="bg-surface-tertiary px-1.5 py-0.5 rounded text-xs text-accent">&gt;</code> 到期日</div>
              </div>
            </div>

            <!-- Active Symbol Hint -->
            <div v-if="activeSymbol" class="px-4 pb-4">
              <div class="p-3 bg-surface-secondary rounded-lg border border-edge">
                <p class="text-sm text-content-secondary">
                  <code class="text-accent mr-1">{{ activeSymbol.symbol?.symbol }}</code>
                  {{ activeSymbol.symbol?.description }}
                  <span v-if="activeSymbol.query" class="text-content-tertiary ml-2">
                    「{{ activeSymbol.query }}」
                  </span>
                </p>
              </div>
            </div>

            <!-- Current Project Context -->
            <div v-if="currentProject" class="px-4 pb-4">
              <div class="flex items-center gap-2 text-sm text-content-tertiary">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span>新增至：<span class="text-content font-medium">{{ currentProject.name }}</span></span>
              </div>
            </div>
            <div v-else-if="!currentProjectId" class="px-4 pb-4">
              <div class="flex items-center gap-2 text-sm text-amber-600">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>請先進入專案頁面或使用 <code class="bg-amber-100 px-1 rounded">^專案名稱</code> 指定專案</span>
              </div>
            </div>

            <!-- Submit Button -->
            <div class="px-4 pb-4">
              <button
                @click="handleSubmitAdd"
                :disabled="!parsedInput.title.trim() || isSubmitting || !currentProjectId"
                class="w-full py-3 bg-accent text-white font-medium rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg v-if="isSubmitting" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                {{ isSubmitting ? '建立中...' : '建立任務' }}
                <kbd v-if="!isSubmitting" class="ml-2 px-1.5 py-0.5 text-xs bg-white/20 rounded">Enter</kbd>
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>
