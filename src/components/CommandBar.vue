<script setup lang="ts">
import { ref, watch, computed, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useSearchStore } from '@/stores/search'
import { useSidebarStore } from '@/stores/sidebar'
import { useProjectsStore } from '@/stores/projects'
import { useTasksStore } from '@/stores/tasks'
import { useMembersStore } from '@/stores/members'
import { useTagsStore } from '@/stores/tags'
import { useColumnsStore } from '@/stores/columns'
import { parseInput, getCurrentSymbol } from '@/composables/useSymbolParser'
import { useCommandBarDropdown, type DropdownOption } from '@/composables/useCommandBarDropdown'
import TokenizedInput, { type InputToken } from '@/components/TokenizedInput.vue'
import SymbolDropdown from '@/components/SymbolDropdown.vue'
import type { Task } from '@/types'

type CommandMode = 'search' | 'add'

const props = withDefaults(defineProps<{
  isOpen?: boolean
  projectId?: number
  initialMode?: 'search' | 'add'
}>(), {
  isOpen: false,
  projectId: 0,
  initialMode: 'search'
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
const membersStore = useMembersStore()
const tagsStore = useTagsStore()
const columnsStore = useColumnsStore()

// Dropdown composable
const dropdown = useCommandBarDropdown()

// State
const mode = ref<CommandMode>('search')
const inputValue = ref('')
const inputRef = ref<InstanceType<typeof TokenizedInput> | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const debounceTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const isSubmitting = ref(false)
const errorMessage = ref('')
const cursorPosition = ref(0)
const showHelp = ref(false)

// Token state for add mode
const tokens = ref<InputToken[]>([])
const textInput = ref('')

// Computed
const currentProjectId = computed(() => props.projectId || sidebarStore.currentProjectId || 0)

const currentProject = computed(() => {
  if (!currentProjectId.value) return null
  return projectsStore.getProjectById(currentProjectId.value)
})

const activeSymbol = computed(() => {
  if (mode.value !== 'add') return null
  return getCurrentSymbol(textInput.value, cursorPosition.value)
})

const showDropdown = computed(() => {
  return mode.value === 'add' && activeSymbol.value !== null && dropdown.filteredOptions.value.length > 0
})

const placeholder = computed(() => {
  if (mode.value === 'search') {
    return '搜尋任務... (例如: status:open)'
  }
  return '輸入任務標題... (使用 ^ @ # 快速設定)'
})

// Combined input value for task creation
const combinedInputValue = computed(() => {
  // Combine tokens back into input string for parsing
  const tokenParts = tokens.value.map(t => `${t.symbol}${t.value.includes(' ') ? `"${t.value}"` : t.value}`)
  return [...tokenParts, textInput.value].join(' ')
})

const combinedParsedInput = computed(() => parseInput(combinedInputValue.value))

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

// Focus the appropriate input based on mode
const focusInput = () => {
  nextTick(() => {
    if (mode.value === 'search') {
      searchInputRef.value?.focus()
    } else {
      inputRef.value?.focus()
    }
  })
}

// Load data for dropdowns
const loadDropdownData = async () => {
  if (!currentProjectId.value) return

  // Load in parallel
  await Promise.all([
    membersStore.fetchProjectMembers(currentProjectId.value),
    tagsStore.fetchProjectTags(currentProjectId.value),
    columnsStore.fetchColumns(currentProjectId.value)
  ])
}

// Watchers
watch(() => props.isOpen, (open) => {
  if (open) {
    inputValue.value = ''
    textInput.value = ''
    tokens.value = []
    searchStore.clearSearch()
    errorMessage.value = ''
    dropdown.reset()
    // Use initial mode from props
    mode.value = props.initialMode
    // Load dropdown data
    loadDropdownData()

    // Auto-add current project as locked token in add mode
    if (props.initialMode === 'add' && currentProject.value) {
      tokens.value = [{
        type: 'symbol',
        symbol: '^',
        value: currentProject.value.name,
        display: currentProject.value.name,
        locked: true
      }]
    }

    // Focus input when modal opens
    focusInput()
  }
})

// Watch for mode changes from parent (Cmd+K toggle)
watch(() => props.initialMode, (newMode) => {
  if (props.isOpen && newMode !== mode.value) {
    mode.value = newMode
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

// Watch textInput for symbol detection
watch(textInput, (value) => {
  if (mode.value !== 'add') return

  const symbol = getCurrentSymbol(value, cursorPosition.value)
  if (symbol && symbol.symbol?.symbol) {
    dropdown.loadOptions(symbol.symbol.symbol, currentProjectId.value)
    dropdown.filterOptions(symbol.query)
  } else {
    dropdown.reset()
  }
})

watch(mode, () => {
  // Clear input when mode changes
  inputValue.value = ''
  textInput.value = ''
  tokens.value = []
  searchStore.clearSearch()
  dropdown.reset()
  // Focus the appropriate input for the new mode
  focusInput()
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

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    handleClose()
  }
}

// Handle dropdown selection
const handleDropdownSelect = (option: DropdownOption) => {
  if (!activeSymbol.value) return

  const symbol = activeSymbol.value.symbol?.symbol || ''

  // Create token
  const newToken: InputToken = {
    type: 'symbol',
    symbol,
    value: option.value,
    display: option.label
  }

  tokens.value.push(newToken)

  // Remove the symbol and query from text input
  const beforeSymbol = textInput.value.slice(0, activeSymbol.value.startIndex)
  const afterCursor = textInput.value.slice(cursorPosition.value)
  textInput.value = beforeSymbol + afterCursor

  // Reset dropdown
  dropdown.reset()

  // Focus input
  nextTick(() => {
    inputRef.value?.focus()
  })
}

// Handle keyboard navigation in dropdown
const handleArrowDown = () => {
  if (showDropdown.value) {
    dropdown.moveDown()
  }
}

const handleArrowUp = () => {
  if (showDropdown.value) {
    dropdown.moveUp()
  }
}

const handleTab = () => {
  if (showDropdown.value) {
    const selected = dropdown.getSelectedOption()
    if (selected) {
      handleDropdownSelect(selected)
    } else if (dropdown.canCreateNew.value && activeSymbol.value) {
      // For tags, create new tag with the query value
      const newToken: InputToken = {
        type: 'symbol',
        symbol: activeSymbol.value.symbol?.symbol || '',
        value: activeSymbol.value.query,
        display: activeSymbol.value.query
      }
      tokens.value.push(newToken)

      // Clear query from text input
      const beforeSymbol = textInput.value.slice(0, activeSymbol.value.startIndex)
      const afterCursor = textInput.value.slice(cursorPosition.value)
      textInput.value = beforeSymbol + afterCursor

      dropdown.reset()
    }
  }
}

const handleRemoveToken = (index: number) => {
  tokens.value.splice(index, 1)
}

const handleUnlockToken = (index: number) => {
  // Unlock the token (change from locked to unlocked)
  if (tokens.value[index]) {
    tokens.value[index].locked = false
  }
}

const handleCursorChange = (position: number) => {
  cursorPosition.value = position
}

const handleSubmitAdd = async () => {
  const parsed = combinedParsedInput.value
  if (!parsed.title.trim() || isSubmitting.value) return

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
      title: parsed.title,
      priority: parsed.priority,
      date_due: parsed.dueDate
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

const handleSubmit = () => {
  if (showDropdown.value) {
    const selected = dropdown.getSelectedOption()
    if (selected) {
      handleDropdownSelect(selected)
      return
    }
  }
  handleSubmitAdd()
}

const toggleHelp = () => {
  showHelp.value = !showHelp.value
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
          class="relative bg-surface rounded-xl shadow-2xl w-full max-w-2xl border border-edge overflow-visible"
          @click.stop
        >
          <!-- Input Area -->
          <div class="p-4">
            <!-- Search Mode Input -->
            <div v-if="mode === 'search'" class="relative">
              <svg
                class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-content-tertiary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                ref="searchInputRef"
                data-testid="command-bar-input"
                v-model="inputValue"
                type="text"
                class="w-full pl-12 pr-20 py-4 bg-surface-secondary border border-edge rounded-lg text-lg text-content placeholder:text-content-tertiary focus:outline-none"
                :placeholder="placeholder"
                @keydown="handleKeydown"
              />
              <div class="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                <button
                  @click="toggleHelp"
                  class="w-6 h-6 flex items-center justify-center rounded hover:bg-surface-hover text-content-tertiary hover:text-content transition-colors"
                  title="顯示說明"
                >
                  ?
                </button>
                <kbd class="px-2 py-1 text-xs bg-surface-tertiary text-content-tertiary rounded border border-edge">
                  ESC
                </kbd>
              </div>
            </div>

            <!-- Add Mode Input (Tokenized) - styled like search mode -->
            <div v-else class="relative">
              <!-- Plus icon -->
              <svg
                class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-content-tertiary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <!-- TokenizedInput styled to match search input -->
              <TokenizedInput
                ref="inputRef"
                :tokens="tokens"
                v-model:textInput="textInput"
                :placeholder="placeholder"
                :disabled="isSubmitting"
                class="!pl-12 !pr-20 !py-4"
                @remove-token="handleRemoveToken"
                @unlock-token="handleUnlockToken"
                @cursor-change="handleCursorChange"
                @submit="handleSubmit"
                @close="handleClose"
                @arrow-up="handleArrowUp"
                @arrow-down="handleArrowDown"
                @tab="handleTab"
              />
              <!-- Buttons positioned inside -->
              <div class="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                <button
                  @click="toggleHelp"
                  class="w-6 h-6 flex items-center justify-center rounded hover:bg-surface-hover text-content-tertiary hover:text-content transition-colors"
                  title="顯示說明"
                >
                  ?
                </button>
                <kbd class="px-2 py-1 text-xs bg-surface-tertiary text-content-tertiary rounded border border-edge">
                  ESC
                </kbd>
              </div>
              <!-- Symbol Dropdown -->
              <SymbolDropdown
                :options="dropdown.filteredOptions.value"
                :selected-index="dropdown.selectedIndex.value"
                :visible="showDropdown"
                :symbol-type="activeSymbol?.symbol?.symbol || ''"
                :empty-message="dropdown.emptyMessage.value"
                :can-create-new="dropdown.canCreateNew.value"
                @select="handleDropdownSelect"
                class="left-0 right-0 top-full"
              />
            </div>
          </div>

          <!-- Search Mode Content -->
          <template v-if="mode === 'search'">
            <!-- Search Tips (when no query and help is shown) -->
            <div v-if="!inputValue && showHelp" class="px-4 pb-4 text-sm text-content-tertiary">
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
            <!-- Help Tips (when help is shown) -->
            <div v-if="showHelp" class="px-4 pb-4 text-sm text-content-tertiary">
              <p class="font-medium mb-2 text-content-secondary">快速輸入提示：</p>
              <div class="grid grid-cols-2 gap-2">
                <div><code class="bg-surface-tertiary px-1.5 py-0.5 rounded text-xs text-blue-500">^</code> 選擇專案</div>
                <div><code class="bg-surface-tertiary px-1.5 py-0.5 rounded text-xs text-green-500">@</code> 指派人員</div>
                <div><code class="bg-surface-tertiary px-1.5 py-0.5 rounded text-xs text-purple-500">#</code> 標籤（可新增）</div>
                <div><code class="bg-surface-tertiary px-1.5 py-0.5 rounded text-xs text-orange-500">:</code> 欄位</div>
                <div><code class="bg-surface-tertiary px-1.5 py-0.5 rounded text-xs text-red-500">!</code> 優先級</div>
                <div><code class="bg-surface-tertiary px-1.5 py-0.5 rounded text-xs text-cyan-500">&gt;</code> 到期日</div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>
