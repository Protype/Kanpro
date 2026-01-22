import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration: number
}

const DEFAULT_DURATION = 4000

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])

  function generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  function add(type: ToastType, title: string, message?: string, duration = DEFAULT_DURATION): string {
    const id = generateId()
    const toast: Toast = { id, type, title, message, duration }
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

  /**
   * 更新現有 toast 的類型和內容（用於 loading -> success/error 轉換）
   */
  function update(id: string, type: ToastType, title: string, message?: string, duration = DEFAULT_DURATION): void {
    const toast = toasts.value.find(t => t.id === id)
    if (toast) {
      toast.type = type
      toast.title = title
      toast.message = message
      toast.duration = duration

      // 設定自動移除
      if (duration > 0) {
        setTimeout(() => {
          remove(id)
        }, duration)
      }
    }
  }

  function success(title: string, message?: string, duration = DEFAULT_DURATION): string {
    return add('success', title, message, duration)
  }

  function error(title: string, message?: string, duration = DEFAULT_DURATION): string {
    return add('error', title, message, duration)
  }

  function warning(title: string, message?: string, duration = DEFAULT_DURATION): string {
    return add('warning', title, message, duration)
  }

  function info(title: string, message?: string, duration = DEFAULT_DURATION): string {
    return add('info', title, message, duration)
  }

  function loading(title: string, message?: string): string {
    // loading toast 不自動消失（duration = 0）
    return add('loading', title, message, 0)
  }

  function clear(): void {
    toasts.value = []
  }

  return {
    toasts,
    add,
    remove,
    update,
    success,
    error,
    warning,
    info,
    loading,
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
    loading: store.loading,
    update: store.update,
    remove: store.remove,
    clear: store.clear
  }
}
