<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSearchStore } from '@/stores/search'
import type { Task } from '@/types'

const props = withDefaults(defineProps<{
  isOpen?: boolean
  projectId?: number
}>(), {
  isOpen: true,
  projectId: 0
})

const emit = defineEmits<{
  close: []
  select: [task: Task]
}>()

const { t } = useI18n()
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
              <ph-icon
                icon="magnifying-glass"
                class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              />
              <input
                ref="searchInputRef"
                data-testid="search-input"
                v-model="searchInput"
                type="text"
                class="w-full pl-10 pr-4 py-3 border-0 focus:outline-none focus:ring-0 text-lg"
                :placeholder="t('search.placeholder')"
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
            <p class="font-medium mb-2">{{ t('search.syntaxTips') }}</p>
            <ul class="space-y-1 text-gray-400">
              <li><code class="bg-gray-100 px-1 rounded">status:open</code> - {{ t('search.syntaxStatusOpen') }}</li>
              <li><code class="bg-gray-100 px-1 rounded">status:closed</code> - {{ t('search.syntaxStatusClosed') }}</li>
              <li><code class="bg-gray-100 px-1 rounded">assignee:me</code> - {{ t('search.syntaxAssigneeMe') }}</li>
              <li><code class="bg-gray-100 px-1 rounded">due:today</code> - {{ t('search.syntaxDueToday') }}</li>
              <li><code class="bg-gray-100 px-1 rounded">#123</code> - {{ t('search.syntaxTaskId') }}</li>
            </ul>
          </div>

          <!-- Loading -->
          <div v-if="searchStore.isSearching" class="p-4 text-center">
            <ph-icon icon="spinner" class="animate-spin h-6 w-6 text-blue-600 mx-auto" />
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
                  {{ task.is_active ? t('task.open') : t('task.closed') }}
                </span>
              </div>
            </div>
          </div>

          <!-- No Results -->
          <div
            v-else-if="searchInput && !searchStore.isSearching && searchStore.results.length === 0"
            class="p-8 text-center text-gray-500"
          >
            <ph-icon icon="face-frown" class="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p>{{ t('search.noResults') }}</p>
            <p class="text-sm text-gray-400 mt-1">{{ t('search.tryOtherTerms') }}</p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
