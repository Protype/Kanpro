import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useColumnsStore } from '@/stores/columns'
import { useAuthStore } from '@/stores/auth'
import type { Column } from '@/types'

const mockFetch = vi.fn()

const mockColumns: Column[] = [
  {
    id: 1,
    title: '待辦',
    position: 1,
    project_id: 1,
    task_limit: 0,
    description: ''
  },
  {
    id: 2,
    title: '進行中',
    position: 2,
    project_id: 1,
    task_limit: 5,
    description: 'WIP limit 5'
  },
  {
    id: 3,
    title: '完成',
    position: 3,
    project_id: 1,
    task_limit: 0,
    description: ''
  }
]

describe('Columns Store', () => {
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
    it('should have empty columns', () => {
      const store = useColumnsStore()

      expect(store.columns).toEqual([])
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('fetchColumns', () => {
    it('should fetch and store columns', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockColumns
        })
      })

      const store = useColumnsStore()
      await store.fetchColumns(1)

      expect(store.columns).toEqual(mockColumns)
      expect(store.isLoading).toBe(false)
    })

    it('should handle fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const store = useColumnsStore()
      await store.fetchColumns(1)

      expect(store.columns).toEqual([])
      expect(store.error).toBe('Network error')
    })

    it('should call API with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockColumns
        })
      })

      const store = useColumnsStore()
      await store.fetchColumns(5)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('getColumns')
      expect(callBody.params).toEqual({ project_id: 5 })
    })
  })

  describe('addColumn', () => {
    it('should add column and return id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: 10
        })
      })

      const store = useColumnsStore()
      const result = await store.addColumn(1, '新欄位', 3, '描述')

      expect(result).toBe(10)
    })

    it('should call API with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: 5
        })
      })

      const store = useColumnsStore()
      await store.addColumn(10, '測試欄位', 5, '測試描述')

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('addColumn')
      expect(callBody.params).toEqual({
        project_id: 10,
        title: '測試欄位',
        task_limit: 5,
        description: '測試描述'
      })
    })
  })

  describe('updateColumn', () => {
    it('should update column and return true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const store = useColumnsStore()
      const result = await store.updateColumn(1, '更新欄位', 10, '新描述')

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

      const store = useColumnsStore()
      await store.updateColumn(5, '更新名稱', 8, '更新描述')

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('updateColumn')
      expect(callBody.params).toEqual({
        column_id: 5,
        title: '更新名稱',
        task_limit: 8,
        description: '更新描述'
      })
    })
  })

  describe('changeColumnPosition', () => {
    it('should change column position and return true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const store = useColumnsStore()
      const result = await store.changeColumnPosition(1, 1, 3)

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

      const store = useColumnsStore()
      await store.changeColumnPosition(10, 5, 2)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('changeColumnPosition')
      expect(callBody.params).toEqual({
        project_id: 10,
        column_id: 5,
        position: 2
      })
    })
  })

  describe('removeColumn', () => {
    it('should remove column and return true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const store = useColumnsStore()
      const result = await store.removeColumn(1)

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

      const store = useColumnsStore()
      await store.removeColumn(5)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('removeColumn')
      expect(callBody.params).toEqual({ column_id: 5 })
    })
  })

  describe('computed properties', () => {
    it('should return columns count', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockColumns
        })
      })

      const store = useColumnsStore()
      await store.fetchColumns(1)

      expect(store.columnsCount).toBe(3)
    })

    it('should return sorted columns', async () => {
      const unsortedColumns = [
        { ...mockColumns[2] },
        { ...mockColumns[0] },
        { ...mockColumns[1] }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: unsortedColumns
        })
      })

      const store = useColumnsStore()
      await store.fetchColumns(1)

      expect(store.sortedColumns[0].position).toBe(1)
      expect(store.sortedColumns[1].position).toBe(2)
      expect(store.sortedColumns[2].position).toBe(3)
    })
  })

  describe('clearColumns', () => {
    it('should clear all columns', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockColumns
        })
      })

      const store = useColumnsStore()
      await store.fetchColumns(1)
      expect(store.columns.length).toBe(3)

      store.clearColumns()

      expect(store.columns).toEqual([])
      expect(store.error).toBeNull()
    })
  })
})
