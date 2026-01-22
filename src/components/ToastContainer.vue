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
    case 'success': return 'bg-success/10 border border-success/30 text-success'
    case 'error': return 'bg-error/10 border border-error/30 text-error'
    case 'warning': return 'bg-warning/10 border border-warning/30 text-warning'
    case 'info': return 'bg-info/10 border border-info/30 text-info'
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
