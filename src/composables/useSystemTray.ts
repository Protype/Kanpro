import { computed } from 'vue'

export interface TrayMenuItem {
  id: string
  label: string
  action?: () => void
  disabled?: boolean
  separator?: boolean
}

interface TrayIconApi {
  getById: (id: string) => Promise<{
    setIcon: (path: string) => Promise<void>
    setTooltip: (tooltip: string) => Promise<void>
    setVisible: (visible: boolean) => Promise<void>
  } | null>
}

function checkIsTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window
}

async function importTrayModule(): Promise<TrayIconApi | null> {
  if (!checkIsTauri()) return null
  try {
    // Use string concatenation to prevent Vite from analyzing the import
    const modulePath = '@tauri-apps' + '/api/tray'
    return await import(modulePath) as TrayIconApi
  } catch {
    return null
  }
}

export function useSystemTray() {
  const isTauriAvailable = computed(() => checkIsTauri())

  async function setIcon(iconPath: string): Promise<void> {
    if (!checkIsTauri()) return

    try {
      const trayModule = await importTrayModule()
      if (!trayModule) return

      const tray = await trayModule.getById('main')
      if (tray) {
        await tray.setIcon(iconPath)
      }
    } catch {
      // Not in Tauri or tray not available
    }
  }

  async function setTooltip(tooltip: string): Promise<void> {
    if (!checkIsTauri()) return

    try {
      const trayModule = await importTrayModule()
      if (!trayModule) return

      const tray = await trayModule.getById('main')
      if (tray) {
        await tray.setTooltip(tooltip)
      }
    } catch {
      // Not in Tauri or tray not available
    }
  }

  async function setMenu(_items: TrayMenuItem[]): Promise<void> {
    if (!checkIsTauri()) return

    try {
      // Menu creation would be handled in Tauri backend
      // This is a placeholder for the frontend interface
    } catch {
      // Not in Tauri or tray not available
    }
  }

  async function show(): Promise<void> {
    if (!checkIsTauri()) return

    try {
      const trayModule = await importTrayModule()
      if (!trayModule) return

      const tray = await trayModule.getById('main')
      if (tray) {
        await tray.setVisible(true)
      }
    } catch {
      // Not in Tauri or tray not available
    }
  }

  async function hide(): Promise<void> {
    if (!checkIsTauri()) return

    try {
      const trayModule = await importTrayModule()
      if (!trayModule) return

      const tray = await trayModule.getById('main')
      if (tray) {
        await tray.setVisible(false)
      }
    } catch {
      // Not in Tauri or tray not available
    }
  }

  return {
    isTauriAvailable,
    setIcon,
    setTooltip,
    setMenu,
    show,
    hide
  }
}
