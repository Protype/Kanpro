<script setup lang="ts">
import { useToastStore, type ToastType } from '@/stores/toast'

const toastStore = useToastStore()

function getIcon(type: ToastType): string {
  switch (type) {
    case 'success': return 'check-circle'
    case 'error': return 'x-circle'
    case 'warning': return 'warning'
    case 'info': return 'info'
  }
}

function getClasses(type: ToastType): string {
  switch (type) {
    case 'success': return 'bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300'
    case 'error': return 'bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-300'
    case 'warning': return 'bg-amber-100 dark:bg-amber-900/50 border border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-300'
    case 'info': return 'bg-blue-100 dark:bg-blue-900/50 border border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300'
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-2 pointer-events-none">
      <TransitionGroup
        enter-active-class="transition ease-out duration-300"
        enter-from-class="opacity-0 translate-y-4 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 translate-y-2 scale-95"
        move-class="transition-all duration-300"
      >
        <div
          v-for="toast in toastStore.toasts"
          :key="toast.id"
          :class="[
            'pointer-events-auto flex gap-3 px-4 py-3 rounded-lg shadow-lg max-w-sm',
            toast.message ? 'items-start' : 'items-center',
            getClasses(toast.type)
          ]"
        >
          <ph-icon :icon="getIcon(toast.type)" class="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold">{{ toast.title }}</p>
            <p v-if="toast.message" class="text-sm opacity-80 mt-0.5">{{ toast.message }}</p>
          </div>
          <button
            @click="toastStore.remove(toast.id)"
            class="p-1 hover:bg-current/10 rounded transition-colors flex-shrink-0 opacity-60 hover:opacity-100"
          >
            <ph-icon icon="x" class="w-4 h-4" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
