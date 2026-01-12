import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTagsStore } from '@/stores/tags'
import { useAuthStore } from '@/stores/auth'
import type { Tag } from '@/types'

const mockFetch = vi.fn()

const mockProjectTags: Tag[] = [
  { id: 1, name: '重要', project_id: 1, color_id: 'red' },
  { id: 2, name: '待討論', project_id: 1, color_id: 'yellow' },
  { id: 3, name: '前端', project_id: 1, color_id: 'blue' },
  { id: 4, name: '後端', project_id: 1, color_id: 'green' }
]

const mockTaskTags = ['重要', '前端']

describe('Tags Store', () => {
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
    it('should have empty tags', () => {
      const store = useTagsStore()

      expect(store.projectTags).toEqual([])
      expect(store.taskTags).toEqual([])
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('fetchProjectTags', () => {
    it('should fetch and store project tags', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockProjectTags
        })
      })

      const store = useTagsStore()
      await store.fetchProjectTags(1)

      expect(store.projectTags).toEqual(mockProjectTags)
      expect(store.isLoading).toBe(false)
    })

    it('should handle fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const store = useTagsStore()
      await store.fetchProjectTags(1)

      expect(store.projectTags).toEqual([])
      expect(store.error).toBe('Network error')
    })

    it('should call API with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockProjectTags
        })
      })

      const store = useTagsStore()
      await store.fetchProjectTags(5)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('getTagsByProject')
      expect(callBody.params).toEqual({ project_id: 5 })
    })
  })

  describe('fetchTaskTags', () => {
    it('should fetch and store task tags', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockTaskTags
        })
      })

      const store = useTagsStore()
      await store.fetchTaskTags(1)

      expect(store.taskTags).toEqual(mockTaskTags)
    })

    it('should call API with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockTaskTags
        })
      })

      const store = useTagsStore()
      await store.fetchTaskTags(10)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('getTaskTags')
      expect(callBody.params).toEqual({ task_id: 10 })
    })
  })

  describe('setTaskTags', () => {
    it('should set task tags', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const store = useTagsStore()
      const result = await store.setTaskTags(1, 1, ['重要', '前端', '新標籤'])

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

      const store = useTagsStore()
      await store.setTaskTags(5, 1, ['標籤A', '標籤B'])

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('setTaskTags')
      expect(callBody.params).toEqual({
        project_id: 1,
        task_id: 5,
        tags: ['標籤A', '標籤B']
      })
    })

    it('should throw on set error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Set failed'))

      const store = useTagsStore()

      await expect(
        store.setTaskTags(1, 1, ['標籤'])
      ).rejects.toThrow('Set failed')
    })
  })

  describe('computed properties', () => {
    it('should return tags count', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockTaskTags
        })
      })

      const store = useTagsStore()
      await store.fetchTaskTags(1)

      expect(store.tagsCount).toBe(2)
    })

    it('should return 0 count when no tags', () => {
      const store = useTagsStore()
      expect(store.tagsCount).toBe(0)
    })
  })

  describe('clearTags', () => {
    it('should clear all tags', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            jsonrpc: '2.0',
            id: 1,
            result: mockProjectTags
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            jsonrpc: '2.0',
            id: 1,
            result: mockTaskTags
          })
        })

      const store = useTagsStore()
      await store.fetchProjectTags(1)
      await store.fetchTaskTags(1)

      expect(store.projectTags.length).toBe(4)
      expect(store.taskTags.length).toBe(2)

      store.clearTags()

      expect(store.projectTags).toEqual([])
      expect(store.taskTags).toEqual([])
      expect(store.error).toBeNull()
    })
  })
})
