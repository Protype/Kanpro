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
          <div class="relative bg-surface rounded-lg w-full max-w-lg transform transition-all" style="box-shadow: var(--shadow-lg)">
            <!-- Header -->
            <div class="flex items-center justify-between p-4 border-b border-edge">
              <h2 class="text-lg font-semibold text-content">鍵盤快捷鍵</h2>
              <button
                @click="$emit('close')"
                class="text-content-tertiary hover:text-content-secondary"
              >
                <ph-icon icon="xmark" class="h-6 w-6" />
              </button>
            </div>

            <!-- Content -->
            <div class="p-4 max-h-96 overflow-y-auto">
              <!-- Global Shortcuts -->
              <section class="mb-6">
                <h3 class="text-sm font-medium text-content-secondary mb-3">全域</h3>
                <div class="space-y-2">
                  <ShortcutItem shortcut="Cmd/Ctrl + K" description="開啟快速搜尋" />
                  <ShortcutItem shortcut="?" description="顯示快捷鍵說明" />
                  <ShortcutItem shortcut="b" description="開啟專案切換器" />
                  <ShortcutItem shortcut="Esc" description="關閉對話框" />
                </div>
              </section>

              <!-- Board View Shortcuts -->
              <section class="mb-6">
                <h3 class="text-sm font-medium text-content-secondary mb-3">看板檢視</h3>
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
                <h3 class="text-sm font-medium text-content-secondary mb-3">任務詳情</h3>
                <div class="space-y-2">
                  <ShortcutItem shortcut="e" description="編輯任務" />
                  <ShortcutItem shortcut="s" description="新增子任務" />
                  <ShortcutItem shortcut="c" description="新增評論" />
                </div>
              </section>
            </div>

            <!-- Footer -->
            <div class="px-4 py-3 border-t border-edge bg-surface-secondary rounded-b-lg">
              <p class="text-xs text-content-tertiary text-center">
                按下 <kbd class="px-1.5 py-0.5 bg-surface-tertiary rounded text-xs font-mono">?</kbd> 或 <kbd class="px-1.5 py-0.5 bg-surface-tertiary rounded text-xs font-mono">Esc</kbd> 關閉
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
      <span class="text-sm text-content">{{ description }}</span>
      <kbd class="px-2 py-1 bg-surface-tertiary rounded text-xs font-mono text-content-secondary">
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
