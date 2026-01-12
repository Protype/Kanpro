import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAnalyticsStore } from '@/stores/analytics'
import { useAuthStore } from '@/stores/auth'
import type { Activity, Task, Column } from '@/types'

const mockFetch = vi.fn()

const mockActivities: Activity[] = [
  {
    id: 1,
    date_creation: 1704067200,
    event_name: 'task.create',
    creator_id: 1,
    project_id: 1,
    task_id: 1
  },
  {
    id: 2,
    date_creation: 1704153600,
    event_name: 'task.move.column',
    creator_id: 2,
    project_id: 1,
    task_id: 1
  },
  {
    id: 3,
    date_creation: 1704240000,
    event_name: 'task.close',
    creator_id: 1,
    project_id: 1,
    task_id: 2
  }
]

const mockTasks: Task[] = [
  {
    id: 1,
    title: 'Task 1',
    project_id: 1,
    column_id: 1,
    swimlane_id: 1,
    position: 1,
    is_active: true,
    color_id: 'blue',
    priority: 1,
    owner_id: 1,
    creator_id: 1,
    date_creation: 1704067200,
    date_modification: 1704067200
  },
  {
    id: 2,
    title: 'Task 2',
    project_id: 1,
    column_id: 1,
    swimlane_id: 1,
    position: 2,
    is_active: true,
    color_id: 'red',
    priority: 2,
    owner_id: 2,
    creator_id: 1,
    date_creation: 1704067200,
    date_modification: 1704067200
  },
  {
    id: 3,
    title: 'Task 3',
    project_id: 1,
    column_id: 2,
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

const mockColumns: Column[] = [
  {
    id: 1,
    title: 'Backlog',
    position: 1,
    project_id: 1,
    task_limit: 0,
    description: ''
  },
  {
    id: 2,
    title: 'In Progress',
    position: 2,
    project_id: 1,
    task_limit: 5,
    description: ''
  },
  {
    id: 3,
    title: 'Done',
    position: 3,
    project_id: 1,
    task_limit: 0,
    description: ''
  }
]

describe('Analytics Store', () => {
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
    it('should have empty activities', () => {
      const store = useAnalyticsStore()

      expect(store.activities).toEqual([])
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('fetchProjectActivity', () => {
    it('should fetch and store activities', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockActivities
        })
      })

      const store = useAnalyticsStore()
      await store.fetchProjectActivity(1)

      expect(store.activities).toEqual(mockActivities)
      expect(store.isLoading).toBe(false)
    })

    it('should handle fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const store = useAnalyticsStore()
      await store.fetchProjectActivity(1)

      expect(store.activities).toEqual([])
      expect(store.error).toBe('Network error')
    })

    it('should call API with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockActivities
        })
      })

      const store = useAnalyticsStore()
      await store.fetchProjectActivity(5)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('getProjectActivity')
      expect(callBody.params).toEqual({ project_id: 5 })
    })
  })

  describe('calculateTaskDistribution', () => {
    it('should calculate task count per column', () => {
      const store = useAnalyticsStore()

      const distribution = store.calculateTaskDistribution(mockTasks, mockColumns)

      expect(distribution).toEqual([
        { column: 'Backlog', count: 2 },
        { column: 'In Progress', count: 1 },
        { column: 'Done', count: 0 }
      ])
    })

    it('should handle empty tasks', () => {
      const store = useAnalyticsStore()

      const distribution = store.calculateTaskDistribution([], mockColumns)

      expect(distribution).toEqual([
        { column: 'Backlog', count: 0 },
        { column: 'In Progress', count: 0 },
        { column: 'Done', count: 0 }
      ])
    })

    it('should handle empty columns', () => {
      const store = useAnalyticsStore()

      const distribution = store.calculateTaskDistribution(mockTasks, [])

      expect(distribution).toEqual([])
    })
  })

  describe('calculateUserWorkload', () => {
    it('should calculate task count per user', () => {
      const store = useAnalyticsStore()
      const members = [
        { id: 1, username: 'user1', name: 'User One', email: null, role: 'project-member' as const, is_active: true },
        { id: 2, username: 'user2', name: 'User Two', email: null, role: 'project-member' as const, is_active: true }
      ]

      const workload = store.calculateUserWorkload(mockTasks, members)

      expect(workload).toEqual([
        { user: 'User One', username: 'user1', count: 2 },
        { user: 'User Two', username: 'user2', count: 1 }
      ])
    })

    it('should use username when name is null', () => {
      const store = useAnalyticsStore()
      const members = [
        { id: 1, username: 'user1', name: null, email: null, role: 'project-member' as const, is_active: true }
      ]
      const tasks = [mockTasks[0]]

      const workload = store.calculateUserWorkload(tasks, members)

      expect(workload[0].user).toBe('user1')
    })

    it('should handle empty tasks', () => {
      const store = useAnalyticsStore()
      const members = [
        { id: 1, username: 'user1', name: 'User One', email: null, role: 'project-member' as const, is_active: true }
      ]

      const workload = store.calculateUserWorkload([], members)

      expect(workload).toEqual([
        { user: 'User One', username: 'user1', count: 0 }
      ])
    })
  })

  describe('calculateActivityByDay', () => {
    it('should group activities by day', () => {
      const store = useAnalyticsStore()
      store.activities = mockActivities

      const byDay = store.calculateActivityByDay()

      expect(byDay.length).toBeGreaterThan(0)
      expect(byDay[0]).toHaveProperty('date')
      expect(byDay[0]).toHaveProperty('count')
    })

    it('should handle empty activities', () => {
      const store = useAnalyticsStore()

      const byDay = store.calculateActivityByDay()

      expect(byDay).toEqual([])
    })
  })

  describe('getActivityStats', () => {
    it('should return activity statistics', () => {
      const store = useAnalyticsStore()
      store.activities = mockActivities

      const stats = store.getActivityStats()

      expect(stats.total).toBe(3)
      expect(stats.taskCreated).toBe(1)
      expect(stats.taskMoved).toBe(1)
      expect(stats.taskClosed).toBe(1)
    })

    it('should handle empty activities', () => {
      const store = useAnalyticsStore()

      const stats = store.getActivityStats()

      expect(stats.total).toBe(0)
      expect(stats.taskCreated).toBe(0)
      expect(stats.taskMoved).toBe(0)
      expect(stats.taskClosed).toBe(0)
    })
  })

  describe('clearAnalytics', () => {
    it('should clear all analytics data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockActivities
        })
      })

      const store = useAnalyticsStore()
      await store.fetchProjectActivity(1)
      expect(store.activities.length).toBe(3)

      store.clearAnalytics()

      expect(store.activities).toEqual([])
      expect(store.error).toBeNull()
    })
  })
})
