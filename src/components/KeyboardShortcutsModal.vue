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
              <h2 class="text-lg font-semibold text-content">{{ t('shortcuts.title') }}</h2>
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
                <h3 class="text-sm font-medium text-content-secondary mb-3">{{ t('shortcuts.global') }}</h3>
                <div class="space-y-2">
                  <div class="flex items-center justify-between py-1">
                    <span class="text-sm text-content">{{ t('shortcuts.openSearch') }}</span>
                    <kbd class="px-2 py-1 bg-surface-tertiary rounded text-xs font-mono text-content-secondary">Cmd/Ctrl + K</kbd>
                  </div>
                  <div class="flex items-center justify-between py-1">
                    <span class="text-sm text-content">{{ t('shortcuts.showShortcuts') }}</span>
                    <kbd class="px-2 py-1 bg-surface-tertiary rounded text-xs font-mono text-content-secondary">?</kbd>
                  </div>
                  <div class="flex items-center justify-between py-1">
                    <span class="text-sm text-content">{{ t('shortcuts.openProjectSwitcher') }}</span>
                    <kbd class="px-2 py-1 bg-surface-tertiary rounded text-xs font-mono text-content-secondary">b</kbd>
                  </div>
                  <div class="flex items-center justify-between py-1">
                    <span class="text-sm text-content">{{ t('shortcuts.closeDialog') }}</span>
                    <kbd class="px-2 py-1 bg-surface-tertiary rounded text-xs font-mono text-content-secondary">Esc</kbd>
                  </div>
                </div>
              </section>

              <!-- Board View Shortcuts -->
              <section class="mb-6">
                <h3 class="text-sm font-medium text-content-secondary mb-3">{{ t('shortcuts.boardView') }}</h3>
                <div class="space-y-2">
                  <div class="flex items-center justify-between py-1">
                    <span class="text-sm text-content">{{ t('shortcuts.newTask') }}</span>
                    <kbd class="px-2 py-1 bg-surface-tertiary rounded text-xs font-mono text-content-secondary">n</kbd>
                  </div>
                  <div class="flex items-center justify-between py-1">
                    <span class="text-sm text-content">{{ t('shortcuts.switchToBoard') }}</span>
                    <kbd class="px-2 py-1 bg-surface-tertiary rounded text-xs font-mono text-content-secondary">v b</kbd>
                  </div>
                  <div class="flex items-center justify-between py-1">
                    <span class="text-sm text-content">{{ t('shortcuts.switchToList') }}</span>
                    <kbd class="px-2 py-1 bg-surface-tertiary rounded text-xs font-mono text-content-secondary">v l</kbd>
                  </div>
                  <div class="flex items-center justify-between py-1">
                    <span class="text-sm text-content">{{ t('shortcuts.switchToCalendar') }}</span>
                    <kbd class="px-2 py-1 bg-surface-tertiary rounded text-xs font-mono text-content-secondary">v c</kbd>
                  </div>
                  <div class="flex items-center justify-between py-1">
                    <span class="text-sm text-content">{{ t('shortcuts.switchToAnalytics') }}</span>
                    <kbd class="px-2 py-1 bg-surface-tertiary rounded text-xs font-mono text-content-secondary">v a</kbd>
                  </div>
                </div>
              </section>

              <!-- Task Detail Shortcuts -->
              <section>
                <h3 class="text-sm font-medium text-content-secondary mb-3">{{ t('shortcuts.taskDetail') }}</h3>
                <div class="space-y-2">
                  <div class="flex items-center justify-between py-1">
                    <span class="text-sm text-content">{{ t('shortcuts.editTask') }}</span>
                    <kbd class="px-2 py-1 bg-surface-tertiary rounded text-xs font-mono text-content-secondary">e</kbd>
                  </div>
                  <div class="flex items-center justify-between py-1">
                    <span class="text-sm text-content">{{ t('shortcuts.addSubtask') }}</span>
                    <kbd class="px-2 py-1 bg-surface-tertiary rounded text-xs font-mono text-content-secondary">s</kbd>
                  </div>
                  <div class="flex items-center justify-between py-1">
                    <span class="text-sm text-content">{{ t('shortcuts.addComment') }}</span>
                    <kbd class="px-2 py-1 bg-surface-tertiary rounded text-xs font-mono text-content-secondary">c</kbd>
                  </div>
                </div>
              </section>
            </div>

            <!-- Footer -->
            <div class="px-4 py-3 border-t border-edge bg-surface-secondary rounded-b-lg">
              <p class="text-xs text-content-tertiary text-center">
                {{ t('shortcuts.pressToClose', { key1: '?', key2: 'Esc' }) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{
  isOpen: boolean
}>()

defineEmits<{
  close: []
}>()

const { t } = useI18n()
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
