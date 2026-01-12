import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCategoriesStore } from '@/stores/categories'
import { useAuthStore } from '@/stores/auth'
import type { Category } from '@/types'

const mockFetch = vi.fn()

const mockCategories: Category[] = [
  {
    id: 1,
    name: 'Bug',
    project_id: 1,
    description: '程式錯誤',
    color_id: 'red'
  },
  {
    id: 2,
    name: 'Feature',
    project_id: 1,
    description: '新功能',
    color_id: 'blue'
  },
  {
    id: 3,
    name: 'Enhancement',
    project_id: 1,
    description: '改進',
    color_id: 'green'
  }
]

describe('Categories Store', () => {
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
    it('should have empty categories', () => {
      const store = useCategoriesStore()

      expect(store.categories).toEqual([])
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('fetchCategories', () => {
    it('should fetch and store categories', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockCategories
        })
      })

      const store = useCategoriesStore()
      await store.fetchCategories(1)

      expect(store.categories).toEqual(mockCategories)
      expect(store.isLoading).toBe(false)
    })

    it('should handle fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const store = useCategoriesStore()
      await store.fetchCategories(1)

      expect(store.categories).toEqual([])
      expect(store.error).toBe('Network error')
    })

    it('should call API with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockCategories
        })
      })

      const store = useCategoriesStore()
      await store.fetchCategories(5)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('getAllCategories')
      expect(callBody.params).toEqual({ project_id: 5 })
    })
  })

  describe('addCategory', () => {
    it('should add category and return id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: 10
        })
      })

      const store = useCategoriesStore()
      const result = await store.addCategory(1, '新類別')

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

      const store = useCategoriesStore()
      await store.addCategory(10, '測試類別')

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('createCategory')
      expect(callBody.params).toEqual({
        project_id: 10,
        name: '測試類別'
      })
    })
  })

  describe('updateCategory', () => {
    it('should update category and return true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const store = useCategoriesStore()
      const result = await store.updateCategory(1, '更新類別')

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

      const store = useCategoriesStore()
      await store.updateCategory(5, '更新名稱')

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('updateCategory')
      expect(callBody.params).toEqual({
        category_id: 5,
        name: '更新名稱'
      })
    })
  })

  describe('removeCategory', () => {
    it('should remove category and return true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const store = useCategoriesStore()
      const result = await store.removeCategory(1)

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

      const store = useCategoriesStore()
      await store.removeCategory(5)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('removeCategory')
      expect(callBody.params).toEqual({ category_id: 5 })
    })
  })

  describe('computed properties', () => {
    it('should return categories count', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockCategories
        })
      })

      const store = useCategoriesStore()
      await store.fetchCategories(1)

      expect(store.categoriesCount).toBe(3)
    })
  })

  describe('clearCategories', () => {
    it('should clear all categories', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockCategories
        })
      })

      const store = useCategoriesStore()
      await store.fetchCategories(1)
      expect(store.categories.length).toBe(3)

      store.clearCategories()

      expect(store.categories).toEqual([])
      expect(store.error).toBeNull()
    })
  })
})
