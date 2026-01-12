<script setup lang="ts">
import { ref, onMounted, onUnmounted, provide } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import { useTheme } from '@/composables/useTheme'
import KeyboardShortcutsModal from '@/components/KeyboardShortcutsModal.vue'
import SearchModal from '@/components/SearchModal.vue'

const router = useRouter()
const shortcuts = useKeyboardShortcuts()
const theme = useTheme()
const showShortcutsModal = ref(false)
const showSearchModal = ref(false)

// Provide shortcuts and theme to child components
provide('shortcuts', shortcuts)
provide('theme', theme)

let cleanup: (() => void) | null = null

onMounted(() => {
  cleanup = shortcuts.init()
  theme.init()

  // Global shortcuts
  shortcuts.register('?', () => {
    showShortcutsModal.value = true
  }, { description: '顯示快捷鍵說明' })

  shortcuts.register('k', () => {
    showSearchModal.value = true
  }, { ctrl: true, description: '開啟快速搜尋' })

  shortcuts.register('k', () => {
    showSearchModal.value = true
  }, { meta: true, description: '開啟快速搜尋' })

  shortcuts.register('Escape', () => {
    showShortcutsModal.value = false
    showSearchModal.value = false
  }, { description: '關閉對話框' })

  shortcuts.register('b', () => {
    router.push('/')
  }, { description: '開啟專案列表' })
})

onUnmounted(() => {
  if (cleanup) {
    cleanup()
  }
})

function handleSearchSelect(taskId: number, projectId: number) {
  showSearchModal.value = false
  router.push(`/projects/${projectId}`)
}
</script>

<template>
  <RouterView />

  <KeyboardShortcutsModal
    :is-open="showShortcutsModal"
    @close="showShortcutsModal = false"
  />

  <SearchModal
    :is-open="showSearchModal"
    @close="showSearchModal = false"
    @select="handleSearchSelect"
  />
</template>
