import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSwimlanesStore } from '@/stores/swimlanes'
import { useAuthStore } from '@/stores/auth'
import type { Swimlane } from '@/types'

const mockFetch = vi.fn()

const mockSwimlanes: Swimlane[] = [
  {
    id: 1,
    name: 'Sprint 1',
    position: 1,
    is_active: true,
    project_id: 1,
    description: 'First sprint'
  },
  {
    id: 2,
    name: 'Sprint 2',
    position: 2,
    is_active: true,
    project_id: 1,
    description: 'Second sprint'
  },
  {
    id: 3,
    name: 'Backlog',
    position: 3,
    is_active: false,
    project_id: 1,
    description: 'Backlog items'
  }
]

describe('Swimlanes Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockReset()

    // Setup auth store with credentials
    const authStore = useAuthStore()
    authStore.apiUrl = 'http://localhost/jsonrpc.php'
    authStore.username = 'admin'
    authStore.token = 'admin'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('initial state', () => {
    it('should have empty swimlanes', () => {
      const store = useSwimlanesStore()

      expect(store.swimlanes).toEqual([])
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('fetchSwimlanes', () => {
    it('should fetch and store swimlanes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockSwimlanes
        })
      })

      const store = useSwimlanesStore()
      await store.fetchSwimlanes(1)

      expect(store.swimlanes).toEqual(mockSwimlanes)
      expect(store.isLoading).toBe(false)
    })

    it('should handle fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const store = useSwimlanesStore()
      await store.fetchSwimlanes(1)

      expect(store.swimlanes).toEqual([])
      expect(store.error).toBe('Network error')
    })

    it('should call API with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockSwimlanes
        })
      })

      const store = useSwimlanesStore()
      await store.fetchSwimlanes(5)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('getAllSwimlanes')
      expect(callBody.params).toEqual({ project_id: 5 })
    })
  })

  describe('addSwimlane', () => {
    it('should add swimlane and return id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: 10
        })
      })

      const store = useSwimlanesStore()
      const result = await store.addSwimlane(1, '新泳道', '描述')

      expect(result).toBe(10)
    })

    it('should call API with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: 5
        })
      })

      const store = useSwimlanesStore()
      await store.addSwimlane(10, '測試泳道', '測試描述')

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('addSwimlane')
      expect(callBody.params).toEqual({
        project_id: 10,
        name: '測試泳道',
        description: '測試描述'
      })
    })
  })

  describe('updateSwimlane', () => {
    it('should update swimlane and return true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const store = useSwimlanesStore()
      const result = await store.updateSwimlane(1, '更新泳道', '新描述')

      expect(result).toBe(true)
    })

    it('should call API with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const store = useSwimlanesStore()
      await store.updateSwimlane(5, '更新名稱', '更新描述')

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('updateSwimlane')
      expect(callBody.params).toEqual({
        swimlane_id: 5,
        name: '更新名稱',
        description: '更新描述'
      })
    })
  })

  describe('changeSwimlanePosition', () => {
    it('should change swimlane position and return true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const store = useSwimlanesStore()
      const result = await store.changeSwimlanePosition(1, 1, 3)

      expect(result).toBe(true)
    })

    it('should call API with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const store = useSwimlanesStore()
      await store.changeSwimlanePosition(10, 5, 2)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('changeSwimlanePosition')
      expect(callBody.params).toEqual({
        project_id: 10,
        swimlane_id: 5,
        position: 2
      })
    })
  })

  describe('enableSwimlane', () => {
    it('should enable swimlane', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const store = useSwimlanesStore()
      const result = await store.enableSwimlane(1, 3)

      expect(result).toBe(true)
    })

    it('should call enableSwimlane API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const store = useSwimlanesStore()
      await store.enableSwimlane(5, 10)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('enableSwimlane')
      expect(callBody.params).toEqual({
        project_id: 5,
        swimlane_id: 10
      })
    })
  })

  describe('disableSwimlane', () => {
    it('should disable swimlane', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const store = useSwimlanesStore()
      const result = await store.disableSwimlane(1, 2)

      expect(result).toBe(true)
    })

    it('should call disableSwimlane API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const store = useSwimlanesStore()
      await store.disableSwimlane(5, 10)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('disableSwimlane')
      expect(callBody.params).toEqual({
        project_id: 5,
        swimlane_id: 10
      })
    })
  })

  describe('removeSwimlane', () => {
    it('should remove swimlane', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const store = useSwimlanesStore()
      const result = await store.removeSwimlane(1, 1)

      expect(result).toBe(true)
    })

    it('should call API with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const store = useSwimlanesStore()
      await store.removeSwimlane(5, 10)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('removeSwimlane')
      expect(callBody.params).toEqual({
        project_id: 5,
        swimlane_id: 10
      })
    })
  })

  describe('computed properties', () => {
    it('should return swimlanes count', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockSwimlanes
        })
      })

      const store = useSwimlanesStore()
      await store.fetchSwimlanes(1)

      expect(store.swimlanesCount).toBe(3)
    })

    it('should return active swimlanes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockSwimlanes
        })
      })

      const store = useSwimlanesStore()
      await store.fetchSwimlanes(1)

      expect(store.activeSwimlanes.length).toBe(2)
      expect(store.activeSwimlanes.every(s => s.is_active)).toBe(true)
    })
  })

  describe('clearSwimlanes', () => {
    it('should clear all swimlanes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockSwimlanes
        })
      })

      const store = useSwimlanesStore()
      await store.fetchSwimlanes(1)
      expect(store.swimlanes.length).toBe(3)

      store.clearSwimlanes()

      expect(store.swimlanes).toEqual([])
      expect(store.error).toBeNull()
    })
  })
})
