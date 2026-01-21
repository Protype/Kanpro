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
    case 'success': return 'bg-success text-white'
    case 'error': return 'bg-error text-white'
    case 'warning': return 'bg-warning text-white'
    case 'info': return 'bg-info text-white'
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
            'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg max-w-sm',
            getClasses(toast.type)
          ]"
        >
          <ph-icon :icon="getIcon(toast.type)" class="w-5 h-5 flex-shrink-0" />
          <span class="text-sm font-medium flex-1">{{ toast.message }}</span>
          <button
            @click="toastStore.remove(toast.id)"
            class="p-1 hover:bg-white/20 rounded transition-colors flex-shrink-0"
          >
            <ph-icon icon="x" class="w-4 h-4" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
