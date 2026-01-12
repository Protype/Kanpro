<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 overflow-y-auto"
        @click.self="$emit('close')"
      >
        <div class="flex min-h-full items-center justify-center p-4">
          <!-- Backdrop -->
          <div class="fixed inset-0 bg-black/50" @click="$emit('close')"></div>

          <!-- Modal -->
          <div class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg transform transition-all">
            <!-- Header -->
            <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">鍵盤快捷鍵</h2>
              <button
                @click="$emit('close')"
                class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Content -->
            <div class="p-4 max-h-96 overflow-y-auto">
              <!-- Global Shortcuts -->
              <section class="mb-6">
                <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">全域</h3>
                <div class="space-y-2">
                  <ShortcutItem shortcut="Cmd/Ctrl + K" description="開啟快速搜尋" />
                  <ShortcutItem shortcut="?" description="顯示快捷鍵說明" />
                  <ShortcutItem shortcut="b" description="開啟專案切換器" />
                  <ShortcutItem shortcut="Esc" description="關閉對話框" />
                </div>
              </section>

              <!-- Board View Shortcuts -->
              <section class="mb-6">
                <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">看板檢視</h3>
                <div class="space-y-2">
                  <ShortcutItem shortcut="n" description="新增任務" />
                  <ShortcutItem shortcut="v b" description="切換至看板" />
                  <ShortcutItem shortcut="v l" description="切換至清單" />
                  <ShortcutItem shortcut="v c" description="切換至日曆" />
                  <ShortcutItem shortcut="v a" description="切換至分析" />
                </div>
              </section>

              <!-- Task Detail Shortcuts -->
              <section>
                <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">任務詳情</h3>
                <div class="space-y-2">
                  <ShortcutItem shortcut="e" description="編輯任務" />
                  <ShortcutItem shortcut="s" description="新增子任務" />
                  <ShortcutItem shortcut="c" description="新增評論" />
                </div>
              </section>
            </div>

            <!-- Footer -->
            <div class="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
              <p class="text-xs text-gray-500 dark:text-gray-400 text-center">
                按下 <kbd class="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">?</kbd> 或 <kbd class="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">Esc</kbd> 關閉
              </p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  isOpen: boolean
}>()

defineEmits<{
  close: []
}>()

// Internal component for shortcut items
const ShortcutItem = {
  props: ['shortcut', 'description'],
  template: `
    <div class="flex items-center justify-between py-1">
      <span class="text-sm text-gray-700 dark:text-gray-300">{{ description }}</span>
      <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-600 dark:text-gray-400">
        {{ shortcut }}
      </kbd>
    </div>
  `
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.2s ease;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95);
}
</style>
