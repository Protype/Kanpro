<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

export interface InputToken {
  type: 'text' | 'symbol'
  symbol?: string
  value: string
  display?: string
  locked?: boolean  // Auto-filled tokens show lock icon instead of X
}

interface Props {
  tokens: InputToken[]
  textInput: string
  placeholder?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  disabled: false
})

const emit = defineEmits<{
  'update:textInput': [value: string]
  'removeToken': [index: number]
  'unlockToken': [index: number]
  'cursorChange': [position: number]
  'submit': []
  'close': []
  'arrowUp': []
  'arrowDown': []
  'tab': []
}>()

const inputRef = ref<HTMLInputElement | null>(null)

// Token pill color mapping
const tokenColors: Record<string, { bg: string; text: string; border: string }> = {
  '^': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  '@': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  '#': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  ':': { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  '!': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  '>': { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200' }
}

const getTokenColors = (symbol: string | undefined) => {
  if (!symbol) return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' }
  return tokenColors[symbol] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' }
}

const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  // Emit cursor position FIRST so it's updated before textInput watcher fires
  emit('cursorChange', target.selectionStart || 0)
  emit('update:textInput', target.value)
}

const handleKeydown = (e: KeyboardEvent) => {
  const target = e.target as HTMLInputElement
  const cursorPosition = target.selectionStart || 0

  switch (e.key) {
    case 'Backspace':
      // If cursor is at position 0 and there are tokens, unlock or remove last token
      if (cursorPosition === 0 && props.tokens.length > 0 && !props.textInput) {
        e.preventDefault()
        const lastIndex = props.tokens.length - 1
        const lastToken = props.tokens[lastIndex]
        if (lastToken?.locked) {
          // Unlock first if locked
          emit('unlockToken', lastIndex)
        } else {
          emit('removeToken', lastIndex)
        }
      }
      break

    case 'Enter':
      e.preventDefault()
      emit('submit')
      break

    case 'Escape':
      e.preventDefault()
      emit('close')
      break

    case 'ArrowUp':
      e.preventDefault()
      emit('arrowUp')
      break

    case 'ArrowDown':
      e.preventDefault()
      emit('arrowDown')
      break

    case 'Tab':
      e.preventDefault()
      emit('tab')
      break
  }
}

const handleClick = (e: MouseEvent) => {
  const target = e.target as HTMLInputElement
  emit('cursorChange', target.selectionStart || 0)
}

const handleKeyup = (e: KeyboardEvent) => {
  const target = e.target as HTMLInputElement
  emit('cursorChange', target.selectionStart || 0)
}

const handleTokenAction = (index: number, e: MouseEvent) => {
  e.stopPropagation()
  const token = props.tokens[index]
  if (token?.locked) {
    // Unlock first, then can be removed
    emit('unlockToken', index)
  } else {
    emit('removeToken', index)
  }
}

// Public method to focus the input
const focus = () => {
  nextTick(() => {
    inputRef.value?.focus()
  })
}

// Expose focus method
defineExpose({ focus, inputRef })
</script>

<template>
  <div
    class="flex flex-wrap items-center gap-1.5 w-full px-3 py-2 bg-surface-secondary border border-edge rounded-lg"
    :class="{ 'opacity-50 cursor-not-allowed': disabled }"
    @click="focus"
  >
    <!-- Token Pills -->
    <span
      v-for="(token, index) in tokens"
      :key="`token-${index}`"
      data-testid="token-pill"
      :class="[
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm border',
        token.locked
          ? 'bg-gray-100 text-gray-500 border-gray-200'
          : [getTokenColors(token.symbol).bg, getTokenColors(token.symbol).text, getTokenColors(token.symbol).border]
      ]"
    >
      <span class="font-medium">{{ token.symbol }}</span>
      <span class="truncate max-w-[150px]">{{ token.display || token.value }}</span>
      <button
        v-if="!disabled"
        :data-testid="token.locked ? 'token-unlock' : 'token-remove'"
        type="button"
        class="ml-0.5 w-4 h-4 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors"
        :title="token.locked ? t('common.unlock') : t('common.remove')"
        @click="handleTokenAction(index, $event)"
      >
        <!-- Lock icon for locked tokens -->
        <ph-icon v-if="token.locked" icon="lock" class="w-3 h-3" />
        <!-- X icon for unlocked tokens -->
        <ph-icon v-else icon="xmark" class="w-3 h-3" />
      </button>
    </span>

    <!-- Text Input -->
    <input
      ref="inputRef"
      type="text"
      :value="textInput"
      :placeholder="tokens.length === 0 ? placeholder : ''"
      :disabled="disabled"
      class="flex-1 min-w-[100px] bg-transparent border-none outline-none text-lg text-content placeholder:text-content-tertiary"
      @input="handleInput"
      @keydown="handleKeydown"
      @click="handleClick"
      @keyup="handleKeyup"
    />
  </div>
</template>
