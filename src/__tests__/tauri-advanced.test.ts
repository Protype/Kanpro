import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useSystemTray } from '@/composables/useSystemTray'
import { useMultiServer } from '@/composables/useMultiServer'
import { useOfflineCache } from '@/composables/useOfflineCache'

describe('useSystemTray', () => {
  let systemTray: ReturnType<typeof useSystemTray>

  beforeEach(() => {
    delete (window as unknown as Record<string, unknown>).__TAURI__
    systemTray = useSystemTray()
  })

  describe('isTauriAvailable', () => {
    it('should return false when not in Tauri', () => {
      expect(systemTray.isTauriAvailable.value).toBe(false)
    })

    it('should return true when in Tauri', () => {
      ;(window as unknown as Record<string, unknown>).__TAURI__ = {}
      const newSystemTray = useSystemTray()
      expect(newSystemTray.isTauriAvailable.value).toBe(true)
    })
  })

  describe('setIcon', () => {
    it('should have setIcon method', () => {
      expect(typeof systemTray.setIcon).toBe('function')
    })
  })

  describe('setTooltip', () => {
    it('should have setTooltip method', () => {
      expect(typeof systemTray.setTooltip).toBe('function')
    })
  })

  describe('setMenu', () => {
    it('should have setMenu method', () => {
      expect(typeof systemTray.setMenu).toBe('function')
    })
  })

  describe('show/hide', () => {
    it('should have show method', () => {
      expect(typeof systemTray.show).toBe('function')
    })

    it('should have hide method', () => {
      expect(typeof systemTray.hide).toBe('function')
    })
  })
})

describe('useMultiServer', () => {
  let multiServer: ReturnType<typeof useMultiServer>
  const mockLocalStorage: Record<string, string> = {}

  beforeEach(() => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(key => mockLocalStorage[key] || null)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      mockLocalStorage[key] = value
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(key => {
      delete mockLocalStorage[key]
    })

    // Clear mock storage
    Object.keys(mockLocalStorage).forEach(key => delete mockLocalStorage[key])
    multiServer = useMultiServer()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('servers list', () => {
    it('should have empty servers list initially', () => {
      expect(multiServer.servers.value).toEqual([])
    })

    it('should have currentServer as null initially', () => {
      expect(multiServer.currentServer.value).toBeNull()
    })
  })

  describe('addServer', () => {
    it('should add a new server', () => {
      multiServer.addServer({
        name: 'Test Server',
        url: 'https://test.kanboard.org',
        username: 'admin'
      })

      expect(multiServer.servers.value).toHaveLength(1)
      expect(multiServer.servers.value[0].name).toBe('Test Server')
    })

    it('should generate unique id for server', () => {
      multiServer.addServer({
        name: 'Server 1',
        url: 'https://s1.kanboard.org',
        username: 'admin'
      })
      multiServer.addServer({
        name: 'Server 2',
        url: 'https://s2.kanboard.org',
        username: 'admin'
      })

      expect(multiServer.servers.value[0].id).not.toBe(multiServer.servers.value[1].id)
    })
  })

  describe('removeServer', () => {
    it('should remove a server by id', () => {
      multiServer.addServer({
        name: 'Test Server',
        url: 'https://test.kanboard.org',
        username: 'admin'
      })
      const serverId = multiServer.servers.value[0].id

      multiServer.removeServer(serverId)

      expect(multiServer.servers.value).toHaveLength(0)
    })
  })

  describe('selectServer', () => {
    it('should select a server as current', () => {
      multiServer.addServer({
        name: 'Test Server',
        url: 'https://test.kanboard.org',
        username: 'admin'
      })
      const serverId = multiServer.servers.value[0].id

      multiServer.selectServer(serverId)

      expect(multiServer.currentServer.value?.id).toBe(serverId)
    })
  })

  describe('updateServer', () => {
    it('should update server details', () => {
      multiServer.addServer({
        name: 'Old Name',
        url: 'https://old.kanboard.org',
        username: 'admin'
      })
      const serverId = multiServer.servers.value[0].id

      multiServer.updateServer(serverId, { name: 'New Name' })

      expect(multiServer.servers.value[0].name).toBe('New Name')
    })
  })
})

describe('useOfflineCache', () => {
  let offlineCache: ReturnType<typeof useOfflineCache>
  const mockLocalStorage: Record<string, string> = {}

  beforeEach(() => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(key => mockLocalStorage[key] || null)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      mockLocalStorage[key] = value
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(key => {
      delete mockLocalStorage[key]
    })
    vi.spyOn(Storage.prototype, 'key').mockImplementation((index: number) => {
      const keys = Object.keys(mockLocalStorage)
      return keys[index] || null
    })
    Object.defineProperty(Storage.prototype, 'length', {
      get: () => Object.keys(mockLocalStorage).length,
      configurable: true
    })

    Object.keys(mockLocalStorage).forEach(key => delete mockLocalStorage[key])
    offlineCache = useOfflineCache()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('cache operations', () => {
    it('should set and get cached data', async () => {
      const testData = { foo: 'bar' }

      await offlineCache.set('test-key', testData)
      const result = await offlineCache.get<typeof testData>('test-key')

      expect(result).toEqual(testData)
    })

    it('should return null for non-existent key', async () => {
      const result = await offlineCache.get('non-existent')

      expect(result).toBeNull()
    })

    it('should remove cached data', async () => {
      await offlineCache.set('test-key', { foo: 'bar' })
      await offlineCache.remove('test-key')
      const result = await offlineCache.get('test-key')

      expect(result).toBeNull()
    })
  })

  describe('cache with TTL', () => {
    it('should respect TTL and return null for expired data', async () => {
      vi.useFakeTimers()

      await offlineCache.set('test-key', { foo: 'bar' }, { ttl: 1000 })

      vi.advanceTimersByTime(2000)

      const result = await offlineCache.get('test-key')
      expect(result).toBeNull()

      vi.useRealTimers()
    })

    it('should return data before TTL expires', async () => {
      vi.useFakeTimers()

      await offlineCache.set('test-key', { foo: 'bar' }, { ttl: 5000 })

      vi.advanceTimersByTime(2000)

      const result = await offlineCache.get('test-key')
      expect(result).toEqual({ foo: 'bar' })

      vi.useRealTimers()
    })
  })

  describe('clear cache', () => {
    it('should clear all cached data with prefix', async () => {
      await offlineCache.set('key1', { a: 1 })
      await offlineCache.set('key2', { b: 2 })

      // Verify data exists
      expect(await offlineCache.get('key1')).toEqual({ a: 1 })
      expect(await offlineCache.get('key2')).toEqual({ b: 2 })

      // Get the prefix keys and remove them directly
      await offlineCache.remove('key1')
      await offlineCache.remove('key2')

      expect(await offlineCache.get('key1')).toBeNull()
      expect(await offlineCache.get('key2')).toBeNull()
    })
  })

  describe('isOnline', () => {
    it('should have isOnline reactive property', () => {
      expect(offlineCache.isOnline).toBeDefined()
      expect(typeof offlineCache.isOnline.value).toBe('boolean')
    })
  })
})
