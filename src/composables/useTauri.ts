import { computed } from 'vue'

// Check if running in Tauri environment
function checkIsTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window
}

// Dynamic import helper with fallback
async function importTauriModule<T>(moduleName: string): Promise<T | null> {
  if (!checkIsTauri()) return null
  try {
    return await import(/* @vite-ignore */ moduleName) as T
  } catch {
    return null
  }
}

export function useTauri() {
  const isTauri = computed(() => checkIsTauri())

  // Storage API - falls back to localStorage when not in Tauri
  const storage = {
    async get(key: string): Promise<string | null> {
      if (checkIsTauri()) {
        try {
          const core = await importTauriModule<{ invoke: <T>(cmd: string, args?: unknown) => Promise<T> }>('@tauri-apps/api/core')
          if (core) {
            return await core.invoke<string | null>('get_storage', { key })
          }
        } catch {
          // Fall through to localStorage
        }
      }
      return localStorage.getItem(key)
    },

    async set(key: string, value: string): Promise<void> {
      if (checkIsTauri()) {
        try {
          const core = await importTauriModule<{ invoke: <T>(cmd: string, args?: unknown) => Promise<T> }>('@tauri-apps/api/core')
          if (core) {
            await core.invoke('set_storage', { key, value })
            return
          }
        } catch {
          // Fall through to localStorage
        }
      }
      localStorage.setItem(key, value)
    },

    async remove(key: string): Promise<void> {
      if (checkIsTauri()) {
        try {
          const core = await importTauriModule<{ invoke: <T>(cmd: string, args?: unknown) => Promise<T> }>('@tauri-apps/api/core')
          if (core) {
            await core.invoke('remove_storage', { key })
            return
          }
        } catch {
          // Fall through to localStorage
        }
      }
      localStorage.removeItem(key)
    }
  }

  // Notifications API
  const notifications = {
    async isPermissionGranted(): Promise<boolean> {
      if (checkIsTauri()) {
        try {
          const notification = await importTauriModule<{ isPermissionGranted: () => Promise<boolean> }>('@tauri-apps/plugin-notification')
          if (notification) {
            return await notification.isPermissionGranted()
          }
        } catch {
          // Fall through to web API
        }
      }
      if ('Notification' in window) {
        return Notification.permission === 'granted'
      }
      return false
    },

    async requestPermission(): Promise<boolean> {
      if (checkIsTauri()) {
        try {
          const notification = await importTauriModule<{ requestPermission: () => Promise<string> }>('@tauri-apps/plugin-notification')
          if (notification) {
            const permission = await notification.requestPermission()
            return permission === 'granted'
          }
        } catch {
          // Fall through to web API
        }
      }
      if ('Notification' in window) {
        const result = await Notification.requestPermission()
        return result === 'granted'
      }
      return false
    },

    async sendNotification(title: string, body?: string): Promise<void> {
      if (checkIsTauri()) {
        try {
          const notification = await importTauriModule<{ sendNotification: (options: { title: string; body?: string }) => Promise<void> }>('@tauri-apps/plugin-notification')
          if (notification) {
            await notification.sendNotification({ title, body })
            return
          }
        } catch {
          // Fall through to web notification
        }
      }
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body })
      }
    }
  }

  // Window API
  interface TauriWindow {
    minimize: () => Promise<void>
    close: () => Promise<void>
    hide: () => Promise<void>
    show: () => Promise<void>
  }

  const windowApi = {
    async minimize(): Promise<void> {
      if (checkIsTauri()) {
        try {
          const windowModule = await importTauriModule<{ getCurrentWindow: () => TauriWindow }>('@tauri-apps/api/window')
          if (windowModule) {
            await windowModule.getCurrentWindow().minimize()
          }
        } catch {
          // Not in Tauri, no-op
        }
      }
    },

    async close(): Promise<void> {
      if (checkIsTauri()) {
        try {
          const windowModule = await importTauriModule<{ getCurrentWindow: () => TauriWindow }>('@tauri-apps/api/window')
          if (windowModule) {
            await windowModule.getCurrentWindow().close()
          }
        } catch {
          // Not in Tauri, no-op
        }
      }
    },

    async hide(): Promise<void> {
      if (checkIsTauri()) {
        try {
          const windowModule = await importTauriModule<{ getCurrentWindow: () => TauriWindow }>('@tauri-apps/api/window')
          if (windowModule) {
            await windowModule.getCurrentWindow().hide()
          }
        } catch {
          // Not in Tauri, no-op
        }
      }
    },

    async show(): Promise<void> {
      if (checkIsTauri()) {
        try {
          const windowModule = await importTauriModule<{ getCurrentWindow: () => TauriWindow }>('@tauri-apps/api/window')
          if (windowModule) {
            await windowModule.getCurrentWindow().show()
          }
        } catch {
          // Not in Tauri, no-op
        }
      }
    }
  }

  return {
    isTauri,
    storage,
    notifications,
    window: windowApi
  }
}
