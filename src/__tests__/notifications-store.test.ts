import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNotificationsStore } from '@/stores/notifications'
import { useAuthStore } from '@/stores/auth'
import type { Activity } from '@/types'

const mockFetch = vi.fn()

const mockActivities: Activity[] = [
  {
    id: 1,
    date_creation: 1704067200,
    event_name: 'task.create',
    creator_id: 1,
    project_id: 1,
    task_id: 10,
    data: { task: { title: '新建任務' } }
  },
  {
    id: 2,
    date_creation: 1704153600,
    event_name: 'comment.create',
    creator_id: 2,
    project_id: 1,
    task_id: 10,
    data: { comment: { comment: '這是評論' } }
  },
  {
    id: 3,
    date_creation: 1704240000,
    event_name: 'task.move.column',
    creator_id: 1,
    project_id: 1,
    task_id: 11
  }
]

describe('Notifications Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockReset()

    // Setup auth store with credentials
    const authStore = useAuthStore()
    authStore.apiUrl = 'http://localhost/jsonrpc.php'
    authStore.username = 'admin'
    authStore.token = 'admin'

    // Clear localStorage
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('initial state', () => {
    it('should have empty activities', () => {
      const store = useNotificationsStore()

      expect(store.activities).toEqual([])
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should have empty readIds set', () => {
      const store = useNotificationsStore()

      expect(store.readIds.size).toBe(0)
    })
  })

  describe('fetchActivities', () => {
    it('should fetch and store activities', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockActivities
        })
      })

      const store = useNotificationsStore()
      await store.fetchActivities()

      expect(store.activities).toEqual(mockActivities)
      expect(store.isLoading).toBe(false)
    })

    it('should handle fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const store = useNotificationsStore()
      await store.fetchActivities()

      expect(store.activities).toEqual([])
      expect(store.error).toBe('Network error')
    })

    it('should call API with correct method', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockActivities
        })
      })

      const store = useNotificationsStore()
      await store.fetchActivities()

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('getMyActivityStream')
    })
  })

  describe('markAsRead', () => {
    it('should mark activity as read', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockActivities
        })
      })

      const store = useNotificationsStore()
      await store.fetchActivities()

      store.markAsRead(1)

      expect(store.readIds.has(1)).toBe(true)
    })

    it('should persist read status to localStorage', async () => {
      const store = useNotificationsStore()
      store.markAsRead(1)
      store.markAsRead(2)

      const stored = JSON.parse(localStorage.getItem('kanpro_read_notifications') || '[]')
      expect(stored).toContain(1)
      expect(stored).toContain(2)
    })
  })

  describe('markAllAsRead', () => {
    it('should mark all activities as read', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockActivities
        })
      })

      const store = useNotificationsStore()
      await store.fetchActivities()
      store.markAllAsRead()

      expect(store.readIds.has(1)).toBe(true)
      expect(store.readIds.has(2)).toBe(true)
      expect(store.readIds.has(3)).toBe(true)
    })
  })

  describe('computed properties', () => {
    it('should return unread count', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockActivities
        })
      })

      const store = useNotificationsStore()
      await store.fetchActivities()

      expect(store.unreadCount).toBe(3)

      store.markAsRead(1)
      expect(store.unreadCount).toBe(2)
    })

    it('should return unread activities', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockActivities
        })
      })

      const store = useNotificationsStore()
      await store.fetchActivities()

      store.markAsRead(1)
      const unread = store.unreadActivities

      expect(unread.length).toBe(2)
      expect(unread.find(a => a.id === 1)).toBeUndefined()
    })
  })

  describe('isRead', () => {
    it('should return true for read activity', () => {
      const store = useNotificationsStore()
      store.markAsRead(5)

      expect(store.isRead(5)).toBe(true)
    })

    it('should return false for unread activity', () => {
      const store = useNotificationsStore()

      expect(store.isRead(99)).toBe(false)
    })
  })

  describe('loadReadIds', () => {
    it('should load read IDs from localStorage', () => {
      localStorage.setItem('kanpro_read_notifications', JSON.stringify([10, 20, 30]))

      const store = useNotificationsStore()
      store.loadReadIds()

      expect(store.readIds.has(10)).toBe(true)
      expect(store.readIds.has(20)).toBe(true)
      expect(store.readIds.has(30)).toBe(true)
    })

    it('should handle empty localStorage', () => {
      const store = useNotificationsStore()
      store.loadReadIds()

      expect(store.readIds.size).toBe(0)
    })
  })

  describe('clearActivities', () => {
    it('should clear all activities', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockActivities
        })
      })

      const store = useNotificationsStore()
      await store.fetchActivities()
      expect(store.activities.length).toBe(3)

      store.clearActivities()

      expect(store.activities).toEqual([])
      expect(store.error).toBeNull()
    })
  })
})
