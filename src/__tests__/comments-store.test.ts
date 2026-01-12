import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCommentsStore } from '@/stores/comments'
import { useAuthStore } from '@/stores/auth'
import type { Comment } from '@/types'

const mockFetch = vi.fn()

const mockComments: Comment[] = [
  {
    id: 1,
    task_id: 1,
    user_id: 1,
    date_creation: 1704067200,
    comment: '這是第一則評論',
    username: 'admin',
    name: '管理員'
  },
  {
    id: 2,
    task_id: 1,
    user_id: 2,
    date_creation: 1704153600,
    comment: '這是第二則評論',
    username: 'user1',
    name: '使用者一'
  },
  {
    id: 3,
    task_id: 1,
    user_id: 1,
    date_creation: 1704240000,
    date_modification: 1704326400,
    comment: '這是編輯過的評論',
    username: 'admin',
    name: '管理員'
  }
]

describe('Comments Store', () => {
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
    it('should have empty comments', () => {
      const store = useCommentsStore()

      expect(store.comments).toEqual([])
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('fetchComments', () => {
    it('should fetch and store comments', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockComments
        })
      })

      const store = useCommentsStore()
      await store.fetchComments(1)

      expect(store.comments).toEqual(mockComments)
      expect(store.isLoading).toBe(false)
    })

    it('should handle fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const store = useCommentsStore()
      await store.fetchComments(1)

      expect(store.comments).toEqual([])
      expect(store.error).toBe('Network error')
    })

    it('should set loading state during fetch', async () => {
      mockFetch.mockImplementationOnce(() =>
        new Promise(resolve =>
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({
              jsonrpc: '2.0',
              id: 1,
              result: []
            })
          }), 100)
        )
      )

      const store = useCommentsStore()
      const fetchPromise = store.fetchComments(1)

      expect(store.isLoading).toBe(true)
      await fetchPromise
      expect(store.isLoading).toBe(false)
    })
  })

  describe('createComment', () => {
    it('should create comment and return id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: 5
        })
      })

      const store = useCommentsStore()
      const commentId = await store.createComment(1, '新的評論內容')

      expect(commentId).toBe(5)
    })

    it('should throw on create error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Create failed'))

      const store = useCommentsStore()

      await expect(
        store.createComment(1, '新的評論內容')
      ).rejects.toThrow('Create failed')
    })

    it('should call API with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: 10
        })
      })

      const store = useCommentsStore()
      await store.createComment(5, '測試評論')

      expect(mockFetch).toHaveBeenCalledTimes(1)
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('createComment')
      expect(callBody.params).toEqual({
        task_id: 5,
        content: '測試評論'
      })
    })
  })

  describe('updateComment', () => {
    it('should update comment', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const store = useCommentsStore()
      const result = await store.updateComment(1, '更新的評論內容')

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

      const store = useCommentsStore()
      await store.updateComment(3, '修改後的內容')

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('updateComment')
      expect(callBody.params).toEqual({
        id: 3,
        content: '修改後的內容'
      })
    })
  })

  describe('removeComment', () => {
    it('should remove comment', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const store = useCommentsStore()
      const result = await store.removeComment(1)

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

      const store = useCommentsStore()
      await store.removeComment(5)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('removeComment')
      expect(callBody.params).toEqual({
        comment_id: 5
      })
    })
  })

  describe('computed properties', () => {
    it('should return comments count', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockComments
        })
      })

      const store = useCommentsStore()
      await store.fetchComments(1)

      expect(store.commentsCount).toBe(3)
    })

    it('should return 0 count when no comments', () => {
      const store = useCommentsStore()

      expect(store.commentsCount).toBe(0)
    })
  })

  describe('clearComments', () => {
    it('should clear all comments', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockComments
        })
      })

      const store = useCommentsStore()
      await store.fetchComments(1)
      expect(store.comments.length).toBe(3)

      store.clearComments()

      expect(store.comments).toEqual([])
      expect(store.error).toBeNull()
    })
  })
})
