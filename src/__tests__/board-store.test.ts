import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBoardStore } from '@/stores/board'
import { useAuthStore } from '@/stores/auth'
import type { Project } from '@/types'

const mockFetch = vi.fn()

const mockProject: Project = {
  id: 1,
  name: 'Test Project',
  description: 'A test project',
  is_active: true,
  is_public: false,
  is_private: true,
  owner_id: 1
}

const mockBoardData = [
  {
    id: 1,
    name: 'Default Swimlane',
    position: 1,
    is_active: 1,
    project_id: 1,
    description: '',
    columns: [
      {
        id: 1,
        title: 'Backlog',
        position: 1,
        task_limit: 0,
        project_id: 1,
        nb_tasks: 2,
        tasks: [
          {
            id: 1,
            title: 'Task 1',
            description: 'First task',
            project_id: 1,
            column_id: 1,
            swimlane_id: 1,
            position: 1,
            is_active: 1,
            color_id: 'blue',
            priority: 0,
            owner_id: 1,
            creator_id: 1,
            date_creation: 1704067200,
            date_modification: 1704067200
          },
          {
            id: 2,
            title: 'Task 2',
            description: 'Second task',
            project_id: 1,
            column_id: 1,
            swimlane_id: 1,
            position: 2,
            is_active: 1,
            color_id: 'red',
            priority: 1,
            owner_id: 0,
            creator_id: 1,
            date_creation: 1704067200,
            date_modification: 1704067200,
            date_due: 1704153600
          }
        ]
      },
      {
        id: 2,
        title: 'In Progress',
        position: 2,
        task_limit: 3,
        project_id: 1,
        nb_tasks: 0,
        tasks: []
      },
      {
        id: 3,
        title: 'Done',
        position: 3,
        task_limit: 0,
        project_id: 1,
        nb_tasks: 0,
        tasks: []
      }
    ]
  }
]

describe('Board Store', () => {
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
    it('should have empty board data', () => {
      const store = useBoardStore()

      expect(store.project).toBeNull()
      expect(store.swimlanes).toEqual([])
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('fetchBoard', () => {
    it('should fetch project and board data', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            jsonrpc: '2.0',
            id: 1,
            result: mockProject
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            jsonrpc: '2.0',
            id: 2,
            result: mockBoardData
          })
        })

      const store = useBoardStore()
      await store.fetchBoard(1)

      expect(store.project).toEqual(mockProject)
      expect(store.swimlanes).toEqual(mockBoardData)
      expect(store.isLoading).toBe(false)
    })

    it('should set loading state during fetch', async () => {
      let resolveFirst: (value: unknown) => void
      mockFetch.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFirst = resolve
        })
      )

      const store = useBoardStore()
      const fetchPromise = store.fetchBoard(1)

      expect(store.isLoading).toBe(true)

      resolveFirst!({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockProject
        })
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 2,
          result: mockBoardData
        })
      })

      await fetchPromise
      expect(store.isLoading).toBe(false)
    })

    it('should handle fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const store = useBoardStore()
      await store.fetchBoard(1)

      expect(store.project).toBeNull()
      expect(store.swimlanes).toEqual([])
      expect(store.error).toBe('Network error')
    })
  })

  describe('computed: columns', () => {
    it('should return flattened columns from first swimlane', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            jsonrpc: '2.0',
            id: 1,
            result: mockProject
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            jsonrpc: '2.0',
            id: 2,
            result: mockBoardData
          })
        })

      const store = useBoardStore()
      await store.fetchBoard(1)

      expect(store.columns.length).toBe(3)
      expect(store.columns[0].title).toBe('Backlog')
      expect(store.columns[1].title).toBe('In Progress')
      expect(store.columns[2].title).toBe('Done')
    })
  })

  describe('getTaskById', () => {
    it('should find task by id', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            jsonrpc: '2.0',
            id: 1,
            result: mockProject
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            jsonrpc: '2.0',
            id: 2,
            result: mockBoardData
          })
        })

      const store = useBoardStore()
      await store.fetchBoard(1)

      const task = store.getTaskById(1)
      expect(task?.title).toBe('Task 1')
    })

    it('should return undefined for non-existent task', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            jsonrpc: '2.0',
            id: 1,
            result: mockProject
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            jsonrpc: '2.0',
            id: 2,
            result: mockBoardData
          })
        })

      const store = useBoardStore()
      await store.fetchBoard(1)

      const task = store.getTaskById(999)
      expect(task).toBeUndefined()
    })
  })
})
