import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration: number
}

const DEFAULT_DURATION = 4000

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])

  function generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  function add(type: ToastType, message: string, duration = DEFAULT_DURATION): string {
    const id = generateId()
    const toast: Toast = { id, type, message, duration }
    toasts.value.push(toast)

    // 自動移除
    if (duration > 0) {
      setTimeout(() => {
        remove(id)
      }, duration)
    }

    return id
  }

  function remove(id: string): void {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  function success(message: string, duration = DEFAULT_DURATION): string {
    return add('success', message, duration)
  }

  function error(message: string, duration = DEFAULT_DURATION): string {
    return add('error', message, duration)
  }

  function warning(message: string, duration = DEFAULT_DURATION): string {
    return add('warning', message, duration)
  }

  function info(message: string, duration = DEFAULT_DURATION): string {
    return add('info', message, duration)
  }

  function clear(): void {
    toasts.value = []
  }

  return {
    toasts,
    add,
    remove,
    success,
    error,
    warning,
    info,
    clear
  }
})

/**
 * Toast 快捷方法（可在元件外使用）
 */
export function useToast() {
  const store = useToastStore()
  return {
    success: store.success,
    error: store.error,
    warning: store.warning,
    info: store.info,
    remove: store.remove,
    clear: store.clear
  }
}
