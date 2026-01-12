import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTaskLinksStore } from '@/stores/tasklinks'
import { useAuthStore } from '@/stores/auth'
import type { TaskLink } from '@/types'

const mockFetch = vi.fn()

const mockTaskLinks: TaskLink[] = [
  {
    id: 1,
    link_id: 1,
    task_id: 1,
    opposite_task_id: 2
  },
  {
    id: 2,
    link_id: 2,
    task_id: 1,
    opposite_task_id: 3
  },
  {
    id: 3,
    link_id: 3,
    task_id: 1,
    opposite_task_id: 5
  }
]

describe('TaskLinks Store', () => {
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
    it('should have empty taskLinks', () => {
      const store = useTaskLinksStore()

      expect(store.taskLinks).toEqual([])
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('fetchTaskLinks', () => {
    it('should fetch and store task links', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockTaskLinks
        })
      })

      const store = useTaskLinksStore()
      await store.fetchTaskLinks(1)

      expect(store.taskLinks).toEqual(mockTaskLinks)
      expect(store.isLoading).toBe(false)
    })

    it('should handle fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const store = useTaskLinksStore()
      await store.fetchTaskLinks(1)

      expect(store.taskLinks).toEqual([])
      expect(store.error).toBe('Network error')
    })

    it('should call API with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockTaskLinks
        })
      })

      const store = useTaskLinksStore()
      await store.fetchTaskLinks(5)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('getAllTaskLinks')
      expect(callBody.params).toEqual({ task_id: 5 })
    })
  })

  describe('createTaskLink', () => {
    it('should create task link and return id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: 10
        })
      })

      const store = useTaskLinksStore()
      const result = await store.createTaskLink(1, 2, 1)

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

      const store = useTaskLinksStore()
      await store.createTaskLink(10, 20, 3)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('createTaskLink')
      expect(callBody.params).toEqual({
        task_id: 10,
        opposite_task_id: 20,
        link_id: 3
      })
    })

    it('should throw on create error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Create failed'))

      const store = useTaskLinksStore()

      await expect(
        store.createTaskLink(1, 2, 1)
      ).rejects.toThrow('Create failed')
    })
  })

  describe('removeTaskLink', () => {
    it('should remove task link', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const store = useTaskLinksStore()
      const result = await store.removeTaskLink(1)

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

      const store = useTaskLinksStore()
      await store.removeTaskLink(5)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('removeTaskLink')
      expect(callBody.params).toEqual({ task_link_id: 5 })
    })
  })

  describe('computed properties', () => {
    it('should return links count', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockTaskLinks
        })
      })

      const store = useTaskLinksStore()
      await store.fetchTaskLinks(1)

      expect(store.linksCount).toBe(3)
    })

    it('should return 0 count when no links', () => {
      const store = useTaskLinksStore()
      expect(store.linksCount).toBe(0)
    })
  })

  describe('clearTaskLinks', () => {
    it('should clear all task links', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockTaskLinks
        })
      })

      const store = useTaskLinksStore()
      await store.fetchTaskLinks(1)
      expect(store.taskLinks.length).toBe(3)

      store.clearTaskLinks()

      expect(store.taskLinks).toEqual([])
      expect(store.error).toBeNull()
    })
  })
})
