<script setup lang="ts">
import { computed } from 'vue'
import type { DropdownOption } from '@/composables/useCommandBarDropdown'

interface Props {
  options: DropdownOption[]
  selectedIndex: number
  visible: boolean
  symbolType: string
  emptyMessage?: string
  canCreateNew?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  emptyMessage: '',
  canCreateNew: false
})

const emit = defineEmits<{
  select: [option: DropdownOption]
}>()

// Color map for symbol types
const symbolColors: Record<string, string> = {
  '^': 'border-blue-500',
  '@': 'border-green-500',
  '#': 'border-purple-500',
  ':': 'border-orange-500',
  '!': 'border-red-500',
  '>': 'border-cyan-500'
}

const borderColorClass = computed(() => {
  return symbolColors[props.symbolType] || 'border-edge'
})

const shouldShow = computed(() => {
  // Don't show if not visible
  if (!props.visible) return false

  // If canCreateNew and no options, don't show dropdown
  if (props.canCreateNew && props.options.length === 0) return false

  return true
})

const handleSelect = (option: DropdownOption) => {
  emit('select', option)
}
</script>

<template>
  <div
    v-if="shouldShow"
    data-testid="symbol-dropdown"
    :class="[
      'absolute z-50 w-full mt-1 bg-surface rounded-lg shadow-lg border-l-4 border-edge overflow-hidden',
      borderColorClass
    ]"
  >
    <!-- Options List -->
    <template v-if="options.length > 0">
      <div
        v-for="(option, index) in options"
        :key="option.id"
        data-testid="dropdown-item"
        :class="[
          'px-4 py-2 cursor-pointer transition-colors',
          index === selectedIndex
            ? 'bg-accent/10 text-accent'
            : 'text-content hover:bg-surface-hover'
        ]"
        @click="handleSelect(option)"
      >
        <div class="flex items-center gap-2">
          <!-- Color indicator for specific types -->
          <span
            v-if="option.color"
            class="w-3 h-3 rounded-full flex-shrink-0"
            :style="{ backgroundColor: option.color }"
          />
          <span class="truncate">{{ option.label }}</span>
          <!-- Show suffix (e.g., project identifier) -->
          <span v-if="option.suffix" class="text-content-tertiary text-sm">
            ({{ option.suffix }})
          </span>
          <!-- Show value if different from label and no suffix -->
          <span v-else-if="option.value !== option.label" class="text-content-tertiary text-sm">
            ({{ option.value }})
          </span>
        </div>
      </div>
    </template>

    <!-- Empty State -->
    <div
      v-else-if="emptyMessage"
      data-testid="empty-message"
      class="px-4 py-3 text-content-tertiary text-sm text-center"
    >
      {{ emptyMessage }}
    </div>
  </div>
</template>
