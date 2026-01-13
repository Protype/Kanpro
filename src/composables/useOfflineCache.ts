import { ref, onMounted, onUnmounted } from 'vue'

export interface CacheOptions {
  ttl?: number // Time to live in milliseconds
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl?: number
}

const CACHE_PREFIX = 'kanpro-cache:'

export function useOfflineCache() {
  const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)

  function handleOnline() {
    isOnline.value = true
  }

  function handleOffline() {
    isOnline.value = false
  }

  // Set up online/offline listeners
  if (typeof window !== 'undefined') {
    onMounted(() => {
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
    })

    onUnmounted(() => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    })
  }

  async function set<T>(key: string, data: T, options?: CacheOptions): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: options?.ttl
    }

    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry))
    } catch {
      // Storage full or not available
    }
  }

  async function get<T>(key: string): Promise<T | null> {
    try {
      const stored = localStorage.getItem(CACHE_PREFIX + key)
      if (!stored) return null

      const entry: CacheEntry<T> = JSON.parse(stored)

      // Check TTL
      if (entry.ttl) {
        const age = Date.now() - entry.timestamp
        if (age > entry.ttl) {
          // Expired, remove and return null
          await remove(key)
          return null
        }
      }

      return entry.data
    } catch {
      return null
    }
  }

  async function remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(CACHE_PREFIX + key)
    } catch {
      // Ignore errors
    }
  }

  async function clear(): Promise<void> {
    try {
      const keysToRemove: string[] = []

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(CACHE_PREFIX)) {
          keysToRemove.push(key)
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key))
    } catch {
      // Ignore errors
    }
  }

  async function has(key: string): Promise<boolean> {
    const data = await get(key)
    return data !== null
  }

  async function getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const cached = await get<T>(key)
    if (cached !== null) {
      return cached
    }

    const data = await fetcher()
    await set(key, data, options)
    return data
  }

  return {
    isOnline,
    set,
    get,
    remove,
    clear,
    has,
    getOrSet
  }
}
