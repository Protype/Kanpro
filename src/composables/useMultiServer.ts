import { ref, watch } from 'vue'

export interface ServerConfig {
  id: string
  name: string
  url: string
  username: string
  token?: string
}

export type NewServerConfig = Omit<ServerConfig, 'id'>

const STORAGE_KEY = 'kanpro-servers'
const CURRENT_SERVER_KEY = 'kanpro-current-server'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

export function useMultiServer() {
  const servers = ref<ServerConfig[]>([])
  const currentServer = ref<ServerConfig | null>(null)

  function loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        servers.value = JSON.parse(stored)
      }

      const currentId = localStorage.getItem(CURRENT_SERVER_KEY)
      if (currentId) {
        currentServer.value = servers.value.find(s => s.id === currentId) || null
      }
    } catch {
      // Ignore parsing errors
    }
  }

  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(servers.value))
      if (currentServer.value) {
        localStorage.setItem(CURRENT_SERVER_KEY, currentServer.value.id)
      } else {
        localStorage.removeItem(CURRENT_SERVER_KEY)
      }
    } catch {
      // Ignore storage errors
    }
  }

  function addServer(config: NewServerConfig): ServerConfig {
    const newServer: ServerConfig = {
      ...config,
      id: generateId()
    }
    servers.value.push(newServer)
    saveToStorage()
    return newServer
  }

  function removeServer(id: string): void {
    const index = servers.value.findIndex(s => s.id === id)
    if (index !== -1) {
      servers.value.splice(index, 1)

      if (currentServer.value?.id === id) {
        currentServer.value = servers.value[0] || null
      }

      saveToStorage()
    }
  }

  function selectServer(id: string): void {
    const server = servers.value.find(s => s.id === id)
    if (server) {
      currentServer.value = server
      saveToStorage()
    }
  }

  function updateServer(id: string, updates: Partial<NewServerConfig>): void {
    const server = servers.value.find(s => s.id === id)
    if (server) {
      Object.assign(server, updates)

      if (currentServer.value?.id === id) {
        currentServer.value = { ...server }
      }

      saveToStorage()
    }
  }

  function getServerById(id: string): ServerConfig | undefined {
    return servers.value.find(s => s.id === id)
  }

  // Watch for changes and save
  watch(servers, saveToStorage, { deep: true })

  // Load on init
  loadFromStorage()

  return {
    servers,
    currentServer,
    addServer,
    removeServer,
    selectServer,
    updateServer,
    getServerById,
    loadFromStorage
  }
}
