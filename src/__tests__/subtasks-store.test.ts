import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSubtasksStore } from '@/stores/subtasks'
import { useAuthStore } from '@/stores/auth'
import type { Subtask } from '@/types'

const mockFetch = vi.fn()

const mockSubtasks: Subtask[] = [
  {
    id: 1,
    title: '子任務一',
    status: 0, // 待辦
    task_id: 1,
    user_id: 1,
    position: 1
  },
  {
    id: 2,
    title: '子任務二',
    status: 1, // 進行中
    task_id: 1,
    user_id: 1,
    position: 2
  },
  {
    id: 3,
    title: '子任務三',
    status: 2, // 完成
    task_id: 1,
    user_id: null,
    position: 3
  }
]

describe('Subtasks Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockReset()

    // Setup auth store with credentials
    const authStore = useAuthStore()
    authStore._setTestCredentials({ apiUrl: 'http://localhost/jsonrpc.php',
    username: 'admin',
    password: 'admin' })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('initial state', () => {
    it('should have empty subtasks', () => {
      const store = useSubtasksStore()

      expect(store.subtasks).toEqual([])
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('fetchSubtasks', () => {
    it('should fetch and store subtasks', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockSubtasks
        })
      })

      const store = useSubtasksStore()
      await store.fetchSubtasks(1)

      expect(store.subtasks).toEqual(mockSubtasks)
      expect(store.isLoading).toBe(false)
    })

    it('should handle fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const store = useSubtasksStore()
      await store.fetchSubtasks(1)

      expect(store.subtasks).toEqual([])
      expect(store.error).toBe('Network error')
    })
  })

  describe('createSubtask', () => {
    it('should create subtask and return id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: 5
        })
      })

      const store = useSubtasksStore()
      const subtaskId = await store.createSubtask(1, '新子任務')

      expect(subtaskId).toBe(5)
    })

    it('should throw on create error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Create failed'))

      const store = useSubtasksStore()

      await expect(
        store.createSubtask(1, '新子任務')
      ).rejects.toThrow('Create failed')
    })
  })

  describe('updateSubtaskStatus', () => {
    it('should update subtask status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const store = useSubtasksStore()
      const result = await store.updateSubtaskStatus(1, 2)

      expect(result).toBe(true)
    })
  })

  describe('removeSubtask', () => {
    it('should remove subtask', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const store = useSubtasksStore()
      const result = await store.removeSubtask(1)

      expect(result).toBe(true)
    })
  })

  describe('computed properties', () => {
    it('should calculate progress correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockSubtasks
        })
      })

      const store = useSubtasksStore()
      await store.fetchSubtasks(1)

      // 1 completed out of 3
      expect(store.completedCount).toBe(1)
      expect(store.totalCount).toBe(3)
      expect(store.progressPercentage).toBeCloseTo(33.33, 1)
    })

    it('should return 0 progress when no subtasks', () => {
      const store = useSubtasksStore()

      expect(store.completedCount).toBe(0)
      expect(store.totalCount).toBe(0)
      expect(store.progressPercentage).toBe(0)
    })
  })
})
