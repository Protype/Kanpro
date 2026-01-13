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

  describe('calculateCumulativeFlow', () => {
    it('should calculate cumulative flow data', () => {
      const store = useAnalyticsStore()
      const tasksWithDates: Task[] = [
        { ...mockTasks[0], column_id: 1, date_creation: 1704067200, date_moved: 1704153600 },
        { ...mockTasks[1], column_id: 2, date_creation: 1704067200, date_moved: 1704240000 },
        { ...mockTasks[2], column_id: 3, date_creation: 1704153600, date_moved: 1704326400 }
      ]

      const flowData = store.calculateCumulativeFlow(tasksWithDates, mockColumns, '2024-01-01', '2024-01-05')

      expect(flowData.length).toBeGreaterThan(0)
      expect(flowData[0]).toHaveProperty('date')
      expect(flowData[0]).toHaveProperty('columns')
    })

    it('should return empty array for empty tasks', () => {
      const store = useAnalyticsStore()

      const flowData = store.calculateCumulativeFlow([], mockColumns, '2024-01-01', '2024-01-05')

      expect(flowData).toEqual([])
    })
  })

  describe('calculateBurndown', () => {
    it('should calculate burndown data', () => {
      const store = useAnalyticsStore()
      const tasksWithDates: Task[] = [
        { ...mockTasks[0], is_active: false, date_completed: 1704153600 },
        { ...mockTasks[1], is_active: false, date_completed: 1704240000 },
        { ...mockTasks[2], is_active: true }
      ]

      const burndownData = store.calculateBurndown(tasksWithDates, '2024-01-01', '2024-01-05')

      expect(burndownData.length).toBeGreaterThan(0)
      expect(burndownData[0]).toHaveProperty('date')
      expect(burndownData[0]).toHaveProperty('remaining')
      expect(burndownData[0]).toHaveProperty('ideal')
    })

    it('should return empty array for empty tasks', () => {
      const store = useAnalyticsStore()

      const burndownData = store.calculateBurndown([], '2024-01-01', '2024-01-05')

      expect(burndownData).toEqual([])
    })

    it('should show decreasing remaining count', () => {
      const store = useAnalyticsStore()
      const tasksWithDates: Task[] = [
        { ...mockTasks[0], is_active: false, date_completed: 1704153600 },
        { ...mockTasks[1], is_active: false, date_completed: 1704240000 },
        { ...mockTasks[2], is_active: true }
      ]

      const burndownData = store.calculateBurndown(tasksWithDates, '2024-01-01', '2024-01-05')
      const firstRemaining = burndownData[0]?.remaining ?? 0
      const lastRemaining = burndownData[burndownData.length - 1]?.remaining ?? 0

      expect(lastRemaining).toBeLessThanOrEqual(firstRemaining)
    })
  })

  describe('calculateColumnTime', () => {
    it('should calculate average time in each column', () => {
      const store = useAnalyticsStore()
      store.activities = [
        { id: 1, date_creation: 1704067200, event_name: 'task.move.column', creator_id: 1, project_id: 1, task_id: 1, data: { src_column_id: 1, dst_column_id: 2 } },
        { id: 2, date_creation: 1704153600, event_name: 'task.move.column', creator_id: 1, project_id: 1, task_id: 1, data: { src_column_id: 2, dst_column_id: 3 } }
      ]

      const columnTime = store.calculateColumnTime(mockColumns)

      expect(columnTime.length).toBe(3)
      expect(columnTime[0]).toHaveProperty('column')
      expect(columnTime[0]).toHaveProperty('avgDays')
    })

    it('should return zero days for columns with no movement', () => {
      const store = useAnalyticsStore()
      store.activities = []

      const columnTime = store.calculateColumnTime(mockColumns)

      expect(columnTime.every(ct => ct.avgDays === 0)).toBe(true)
    })
  })

  describe('calculateLeadCycleTime', () => {
    it('should calculate lead and cycle time', () => {
      const store = useAnalyticsStore()
      const completedTasks: Task[] = [
        { ...mockTasks[0], is_active: false, date_creation: 1704067200, date_started: 1704153600, date_completed: 1704326400 },
        { ...mockTasks[1], is_active: false, date_creation: 1704067200, date_started: 1704240000, date_completed: 1704412800 }
      ]

      const leadCycleData = store.calculateLeadCycleTime(completedTasks)

      expect(leadCycleData).toHaveProperty('avgLeadTime')
      expect(leadCycleData).toHaveProperty('avgCycleTime')
      expect(leadCycleData).toHaveProperty('tasks')
      expect(leadCycleData.avgLeadTime).toBeGreaterThan(0)
    })

    it('should return zero for empty tasks', () => {
      const store = useAnalyticsStore()

      const leadCycleData = store.calculateLeadCycleTime([])

      expect(leadCycleData.avgLeadTime).toBe(0)
      expect(leadCycleData.avgCycleTime).toBe(0)
      expect(leadCycleData.tasks).toEqual([])
    })

    it('should calculate lead time as time from creation to completion', () => {
      const store = useAnalyticsStore()
      const task: Task = {
        ...mockTasks[0],
        is_active: false,
        date_creation: 1704067200, // 2024-01-01
        date_started: 1704153600,  // 2024-01-02
        date_completed: 1704326400 // 2024-01-04
      }

      const leadCycleData = store.calculateLeadCycleTime([task])

      // Lead time: 3 days (Jan 1 to Jan 4)
      expect(leadCycleData.avgLeadTime).toBe(3)
      // Cycle time: 2 days (Jan 2 to Jan 4)
      expect(leadCycleData.avgCycleTime).toBe(2)
    })
  })
})
