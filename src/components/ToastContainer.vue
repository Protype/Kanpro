<script setup lang="ts">
import { useToastStore, type ToastType } from '@/stores/toast'

const toastStore = useToastStore()

function getIcon(type: ToastType): string {
  switch (type) {
    case 'success': return 'check-circle'
    case 'error': return 'x-circle'
    case 'warning': return 'warning'
    case 'info': return 'info'
    case 'loading': return 'spinner'
  }
}

function getClasses(type: ToastType): string {
  switch (type) {
    case 'success': return 'bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
    case 'error': return 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
    case 'warning': return 'bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
    case 'info': return 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
    case 'loading': return 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'
  }
}

function getIconClasses(type: ToastType): string {
  if (type === 'loading') {
    return 'text-slate-600 dark:text-slate-300 animate-spin'
  }
  return ''
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
            'pointer-events-auto flex gap-3 px-4 py-3 rounded-lg shadow-lg max-w-sm transition-colors duration-300',
            toast.message ? 'items-start' : 'items-center',
            getClasses(toast.type)
          ]"
        >
          <ph-icon
            :icon="getIcon(toast.type)"
            :class="['w-5 h-5 flex-shrink-0 mt-0.5 transition-colors duration-300', getIconClasses(toast.type)]"
          />
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
