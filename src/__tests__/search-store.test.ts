import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSearchStore } from '@/stores/search'
import { useAuthStore } from '@/stores/auth'
import type { Task } from '@/types'

const mockFetch = vi.fn()

const mockTasks: Task[] = [
  {
    id: 1,
    title: '測試任務一',
    description: '描述內容',
    project_id: 1,
    column_id: 1,
    swimlane_id: 1,
    position: 1,
    is_active: true,
    color_id: 'blue',
    priority: 0,
    owner_id: 1,
    creator_id: 1,
    date_creation: 1704067200,
    date_modification: 1704067200
  },
  {
    id: 2,
    title: '測試任務二',
    description: '另一個描述',
    project_id: 1,
    column_id: 2,
    swimlane_id: 1,
    position: 1,
    is_active: true,
    color_id: 'green',
    priority: 1,
    owner_id: 2,
    creator_id: 1,
    date_creation: 1704067200,
    date_modification: 1704067200
  }
]

describe('Search Store', () => {
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
    it('should have empty results', () => {
      const store = useSearchStore()

      expect(store.results).toEqual([])
      expect(store.isSearching).toBe(false)
      expect(store.error).toBeNull()
      expect(store.query).toBe('')
    })
  })

  describe('searchTasks', () => {
    it('should search tasks and store results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockTasks
        })
      })

      const store = useSearchStore()
      await store.searchTasks(1, '測試')

      expect(store.results).toEqual(mockTasks)
      expect(store.query).toBe('測試')
      expect(store.isSearching).toBe(false)
    })

    it('should set isSearching to true while searching', async () => {
      let resolvePromise: () => void
      const searchPromise = new Promise<void>((resolve) => {
        resolvePromise = resolve
      })

      mockFetch.mockImplementationOnce(() => searchPromise.then(() => ({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: []
        })
      })))

      const store = useSearchStore()
      const searchTask = store.searchTasks(1, '測試')

      expect(store.isSearching).toBe(true)

      resolvePromise!()
      await searchTask

      expect(store.isSearching).toBe(false)
    })

    it('should handle search error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const store = useSearchStore()
      await store.searchTasks(1, '測試')

      expect(store.results).toEqual([])
      expect(store.error).toBe('Network error')
    })

    it('should clear results when query is empty', async () => {
      const store = useSearchStore()
      store.results = mockTasks
      store.query = '測試'

      await store.searchTasks(1, '')

      expect(store.results).toEqual([])
      expect(store.query).toBe('')
    })
  })

  describe('clearSearch', () => {
    it('should clear all search state', () => {
      const store = useSearchStore()
      store.results = mockTasks
      store.query = '測試'
      store.error = 'Some error'

      store.clearSearch()

      expect(store.results).toEqual([])
      expect(store.query).toBe('')
      expect(store.error).toBeNull()
    })
  })

  describe('search query building', () => {
    it('should call searchTasks API with correct query', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: []
        })
      })

      const store = useSearchStore()
      await store.searchTasks(1, 'status:open assignee:me')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost/jsonrpc.php',
        expect.objectContaining({
          body: expect.stringContaining('searchTasks')
        })
      )

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.params.project_id).toBe(1)
      expect(callBody.params.query).toBe('status:open assignee:me')
    })
  })
})
