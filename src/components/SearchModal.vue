<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useSearchStore } from '@/stores/search'
import type { Task } from '@/types'

const props = defineProps<{
  isOpen: boolean
  projectId: number
}>()

const emit = defineEmits<{
  close: []
  select: [task: Task]
}>()

const searchStore = useSearchStore()

const searchInput = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)
const debounceTimer = ref<ReturnType<typeof setTimeout> | null>(null)

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

watch(() => props.isOpen, (open) => {
  if (open) {
    searchInput.value = ''
    searchStore.clearSearch()
    // Focus input when modal opens
    setTimeout(() => {
      searchInputRef.value?.focus()
    }, 100)
  }
})

watch(searchInput, (value) => {
  // Debounce search
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value)
  }

  debounceTimer.value = setTimeout(() => {
    if (value.trim()) {
      searchStore.searchTasks(props.projectId, value.trim())
    } else {
      searchStore.clearSearch()
    }
  }, 300)
})

const handleClose = () => {
  emit('close')
}

const handleSelect = (task: Task) => {
  emit('select', task)
  emit('close')
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    handleClose()
  }
}

// Global keyboard shortcut
const handleGlobalKeydown = (e: KeyboardEvent) => {
  // Cmd/Ctrl + K to open search
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    if (!props.isOpen) {
      // This component doesn't control opening, so we just prevent default
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value)
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      data-testid="search-modal"
      class="fixed inset-0 z-50 overflow-y-auto"
    >
      <!-- Backdrop -->
      <div
        data-testid="search-backdrop"
        class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        @click="handleClose"
      ></div>

      <!-- Modal -->
      <div class="flex min-h-full items-start justify-center pt-[15vh] px-4">
        <div
          class="relative bg-white rounded-lg shadow-xl w-full max-w-xl"
          @click.stop
        >
          <!-- Search Input -->
          <div class="p-4 border-b">
            <div class="relative">
              <svg
                class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref="searchInputRef"
                data-testid="search-input"
                v-model="searchInput"
                type="text"
                class="w-full pl-10 pr-4 py-3 border-0 focus:outline-none focus:ring-0 text-lg"
                placeholder="搜尋任務... (例如: status:open)"
                @keyup.escape="handleClose"
                @keydown="handleKeydown"
              />
              <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
                <kbd class="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded border">
                  ESC
                </kbd>
              </div>
            </div>
          </div>

          <!-- Search Tips (when no query) -->
          <div v-if="!searchInput && !searchStore.results.length" class="p-4 text-sm text-gray-500">
            <p class="font-medium mb-2">搜尋語法提示：</p>
            <ul class="space-y-1 text-gray-400">
              <li><code class="bg-gray-100 px-1 rounded">status:open</code> - 開啟中的任務</li>
              <li><code class="bg-gray-100 px-1 rounded">status:closed</code> - 已關閉的任務</li>
              <li><code class="bg-gray-100 px-1 rounded">assignee:me</code> - 指派給我的任務</li>
              <li><code class="bg-gray-100 px-1 rounded">due:today</code> - 今天到期</li>
              <li><code class="bg-gray-100 px-1 rounded">#123</code> - 任務編號</li>
            </ul>
          </div>

          <!-- Loading -->
          <div v-if="searchStore.isSearching" class="p-4 text-center">
            <svg class="animate-spin h-6 w-6 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>

          <!-- Results -->
          <div v-else-if="searchStore.results.length > 0" class="max-h-96 overflow-y-auto">
            <div
              v-for="task in searchStore.results"
              :key="task.id"
              data-testid="search-result-item"
              @click="handleSelect(task)"
              class="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 border-b last:border-b-0"
            >
              <div
                :class="['w-3 h-3 rounded-full flex-shrink-0', getColorClass(task.color_id)]"
              ></div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-gray-400 text-sm">#{{ task.id }}</span>
                  <span class="font-medium text-gray-900 truncate">{{ task.title }}</span>
                </div>
                <p v-if="task.description" class="text-sm text-gray-500 truncate">
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
            v-else-if="searchInput && !searchStore.isSearching && searchStore.results.length === 0"
            class="p-8 text-center text-gray-500"
          >
            <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>找不到符合的任務</p>
            <p class="text-sm text-gray-400 mt-1">嘗試其他搜尋詞或搜尋語法</p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
