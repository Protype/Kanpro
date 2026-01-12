import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTasksStore } from '@/stores/tasks'
import { useAuthStore } from '@/stores/auth'
import type { Task } from '@/types'

const mockFetch = vi.fn()

const mockTask: Task = {
  id: 1,
  title: 'Test Task',
  description: 'Task description',
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
}

describe('Tasks Store', () => {
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
    it('should have null currentTask', () => {
      const store = useTasksStore()

      expect(store.currentTask).toBeNull()
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('fetchTask', () => {
    it('should fetch and store task', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockTask
        })
      })

      const store = useTasksStore()
      await store.fetchTask(1)

      expect(store.currentTask).toEqual(mockTask)
      expect(store.isLoading).toBe(false)
    })

    it('should handle fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const store = useTasksStore()
      await store.fetchTask(1)

      expect(store.currentTask).toBeNull()
      expect(store.error).toBe('Network error')
    })
  })

  describe('createTask', () => {
    it('should create task and return id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: 5
        })
      })

      const store = useTasksStore()
      const taskId = await store.createTask({
        project_id: 1,
        title: 'New Task',
        color_id: 'blue'
      })

      expect(taskId).toBe(5)
    })

    it('should throw on create error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Create failed'))

      const store = useTasksStore()

      await expect(
        store.createTask({
          project_id: 1,
          title: 'New Task'
        })
      ).rejects.toThrow('Create failed')
    })
  })

  describe('updateTask', () => {
    it('should update task', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const store = useTasksStore()
      const result = await store.updateTask(1, { title: 'Updated Title' })

      expect(result).toBe(true)
    })
  })

  describe('closeTask', () => {
    it('should close task', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const store = useTasksStore()
      const result = await store.closeTask(1)

      expect(result).toBe(true)
    })
  })

  describe('openTask', () => {
    it('should open task', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const store = useTasksStore()
      const result = await store.openTask(1)

      expect(result).toBe(true)
    })
  })
})
