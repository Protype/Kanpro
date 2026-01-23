import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDashboardStore } from '@/stores/dashboard'
import { useAuthStore } from '@/stores/auth'
import { useProjectsStore } from '@/stores/projects'
import type { Task, Project } from '@/types'

const mockFetch = vi.fn()

const mockProjects: Project[] = [
  {
    id: 1,
    name: 'Project 1',
    description: 'Description 1',
    is_active: true,
    is_public: false,
    is_private: true,
    owner_id: 1
  },
  {
    id: 2,
    name: 'Project 2',
    description: 'Description 2',
    is_active: true,
    is_public: false,
    is_private: true,
    owner_id: 1
  }
]

const mockMyTasksProject1: Task[] = [
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
  }
]

const mockMyTasksProject2: Task[] = [
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

const mockOverdueTasksProject1: Task[] = [
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
    authStore._setTestCredentials({
      apiUrl: 'http://localhost/jsonrpc.php',
      username: 'admin',
      password: 'admin'
    })
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
    it('should fetch and store my tasks from all projects', async () => {
      // Mock getMyProjects
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockProjects
        })
      })
      // Mock searchTasks for project 1
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 2,
          result: mockMyTasksProject1
        })
      })
      // Mock searchTasks for project 2
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 3,
          result: mockMyTasksProject2
        })
      })

      const store = useDashboardStore()
      await store.fetchMyTasks()

      expect(store.myTasks).toHaveLength(2)
      expect(store.myTasks).toContainEqual(expect.objectContaining({ id: 1 }))
      expect(store.myTasks).toContainEqual(expect.objectContaining({ id: 2 }))
      expect(store.isLoading).toBe(false)
    })

    it('should handle fetch error when projects fetch fails', async () => {
      // projectsStore.fetchProjects 會捕捉錯誤，所以 dashboard 會得到空專案列表
      // 這導致沒有任務被載入，但不會設定 error（因為錯誤被 projectsStore 處理了）
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const store = useDashboardStore()
      await store.fetchMyTasks()

      // 空專案列表 = 沒有任務
      expect(store.myTasks).toEqual([])
      // error 不會被設定，因為 projectsStore 捕捉了錯誤
      expect(store.error).toBeNull()
    })

    it('should use cached projects if already loaded', async () => {
      // Pre-load projects
      const projectsStore = useProjectsStore()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockProjects
        })
      })
      await projectsStore.fetchProjects()

      // Mock searchTasks for project 1
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 2,
          result: mockMyTasksProject1
        })
      })
      // Mock searchTasks for project 2
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 3,
          result: mockMyTasksProject2
        })
      })

      const store = useDashboardStore()
      await store.fetchMyTasks()

      // Should not call getMyProjects again (only 3 calls total)
      expect(mockFetch).toHaveBeenCalledTimes(3)
      expect(store.myTasks).toHaveLength(2)
    })
  })

  describe('fetchOverdueTasks', () => {
    it('should fetch and store overdue tasks from all projects', async () => {
      // Mock getMyProjects
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockProjects
        })
      })
      // Mock searchTasks for project 1 (overdue)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 2,
          result: mockOverdueTasksProject1
        })
      })
      // Mock searchTasks for project 2 (no overdue)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 3,
          result: []
        })
      })

      const store = useDashboardStore()
      await store.fetchOverdueTasks()

      expect(store.overdueTasks).toHaveLength(1)
      expect(store.overdueTasks[0].id).toBe(3)
    })

    it('should handle empty overdue tasks', async () => {
      // Mock getMyProjects
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockProjects
        })
      })
      // Mock searchTasks for both projects (no overdue)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 2,
          result: []
        })
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 3,
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
      // Pre-load projects to simplify mocking
      const projectsStore = useProjectsStore()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockProjects
        })
      })
      await projectsStore.fetchProjects()

      // Mock searchTasks for myTasks (2 projects)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 2,
          result: mockMyTasksProject1
        })
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 3,
          result: mockMyTasksProject2
        })
      })
      // Mock searchTasks for overdueTasks (2 projects)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 4,
          result: mockOverdueTasksProject1
        })
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 5,
          result: []
        })
      })

      const store = useDashboardStore()
      await store.fetchDashboardData()

      expect(store.myTasks).toHaveLength(2)
      expect(store.overdueTasks).toHaveLength(1)
    })
  })

  describe('hasOverdueTasks', () => {
    it('should return true when there are overdue tasks', async () => {
      // Pre-load projects
      const projectsStore = useProjectsStore()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockProjects
        })
      })
      await projectsStore.fetchProjects()

      // Mock searchTasks for overdueTasks
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 2,
          result: mockOverdueTasksProject1
        })
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 3,
          result: []
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

  describe('clearDashboard', () => {
    it('should clear all dashboard data', async () => {
      const store = useDashboardStore()

      // Manually set some data
      store.myTasks.push(...mockMyTasksProject1)
      store.overdueTasks.push(...mockOverdueTasksProject1)
      store.error = 'Some error'

      store.clearDashboard()

      expect(store.myTasks).toEqual([])
      expect(store.overdueTasks).toEqual([])
      expect(store.error).toBeNull()
    })
  })
})
