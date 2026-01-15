import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDashboardStore } from '@/stores/dashboard'
import { useAuthStore } from '@/stores/auth'
import type { Task } from '@/types'

const mockFetch = vi.fn()

const mockMyTasks: Task[] = [
  {
    id: 1,
    title: '我的任務一',
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
    title: '我的任務二',
    description: '另一個描述',
    project_id: 2,
    column_id: 1,
    swimlane_id: 1,
    position: 1,
    is_active: true,
    color_id: 'green',
    priority: 1,
    owner_id: 1,
    creator_id: 2,
    date_creation: 1704067200,
    date_modification: 1704067200
  }
]

const mockOverdueTasks: Task[] = [
  {
    id: 3,
    title: '逾期任務',
    description: '已逾期',
    project_id: 1,
    column_id: 1,
    swimlane_id: 1,
    position: 1,
    is_active: true,
    color_id: 'red',
    priority: 2,
    owner_id: 1,
    creator_id: 1,
    date_creation: 1704067200,
    date_modification: 1704067200,
    date_due: 1703980800 // Past date
  }
]

describe('Dashboard Store', () => {
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
    it('should have empty data', () => {
      const store = useDashboardStore()

      expect(store.myTasks).toEqual([])
      expect(store.overdueTasks).toEqual([])
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('fetchMyTasks', () => {
    it('should fetch and store my tasks', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockMyTasks
        })
      })

      const store = useDashboardStore()
      await store.fetchMyTasks()

      expect(store.myTasks).toEqual(mockMyTasks)
      expect(store.isLoading).toBe(false)
    })

    it('should handle fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const store = useDashboardStore()
      await store.fetchMyTasks()

      expect(store.myTasks).toEqual([])
      expect(store.error).toBe('Network error')
    })
  })

  describe('fetchOverdueTasks', () => {
    it('should fetch and store overdue tasks', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockOverdueTasks
        })
      })

      const store = useDashboardStore()
      await store.fetchOverdueTasks()

      expect(store.overdueTasks).toEqual(mockOverdueTasks)
    })

    it('should handle empty overdue tasks', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: []
        })
      })

      const store = useDashboardStore()
      await store.fetchOverdueTasks()

      expect(store.overdueTasks).toEqual([])
    })
  })

  describe('fetchDashboardData', () => {
    it('should fetch all dashboard data', async () => {
      // Mock for searchTasks (my tasks)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockMyTasks
        })
      })
      // Mock for getOverdueTasks
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 2,
          result: mockOverdueTasks
        })
      })

      const store = useDashboardStore()
      await store.fetchDashboardData()

      expect(store.myTasks).toEqual(mockMyTasks)
      expect(store.overdueTasks).toEqual(mockOverdueTasks)
    })
  })

  describe('hasOverdueTasks', () => {
    it('should return true when there are overdue tasks', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockOverdueTasks
        })
      })

      const store = useDashboardStore()
      await store.fetchOverdueTasks()

      expect(store.hasOverdueTasks).toBe(true)
    })

    it('should return false when there are no overdue tasks', () => {
      const store = useDashboardStore()
      expect(store.hasOverdueTasks).toBe(false)
    })
  })
})
