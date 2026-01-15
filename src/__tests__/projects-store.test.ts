import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import type { Project } from '@/types'

const mockFetch = vi.fn()

const mockProjects: Project[] = [
  {
    id: 1,
    name: 'Project Alpha',
    description: 'First project',
    is_active: true,
    is_public: false,
    is_private: true,
    owner_id: 1
  },
  {
    id: 2,
    name: 'Project Beta',
    description: 'Second project',
    is_active: true,
    is_public: true,
    is_private: false,
    owner_id: 1
  },
  {
    id: 3,
    name: 'Archived Project',
    description: 'Inactive project',
    is_active: false,
    is_public: false,
    is_private: true,
    owner_id: 1
  }
]

describe('Projects Store', () => {
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
    it('should have empty projects list', () => {
      const store = useProjectsStore()

      expect(store.projects).toEqual([])
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('fetchProjects', () => {
    it('should fetch and store projects', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockProjects
        })
      })

      const store = useProjectsStore()
      await store.fetchProjects()

      expect(store.projects).toEqual(mockProjects)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should set loading state during fetch', async () => {
      let resolvePromise: (value: unknown) => void
      mockFetch.mockReturnValueOnce(
        new Promise((resolve) => {
          resolvePromise = resolve
        })
      )

      const store = useProjectsStore()
      const fetchPromise = store.fetchProjects()

      expect(store.isLoading).toBe(true)

      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockProjects
        })
      })

      await fetchPromise
      expect(store.isLoading).toBe(false)
    })

    it('should handle fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const store = useProjectsStore()
      await store.fetchProjects()

      expect(store.projects).toEqual([])
      expect(store.isLoading).toBe(false)
      expect(store.error).toBe('Network error')
    })
  })

  describe('computed: activeProjects', () => {
    it('should return only active projects', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockProjects
        })
      })

      const store = useProjectsStore()
      await store.fetchProjects()

      expect(store.activeProjects.length).toBe(2)
      expect(store.activeProjects.every(p => p.is_active)).toBe(true)
    })
  })

  describe('computed: filteredProjects', () => {
    it('should filter projects by search query', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockProjects
        })
      })

      const store = useProjectsStore()
      await store.fetchProjects()

      store.searchQuery = 'Alpha'
      expect(store.filteredProjects.length).toBe(1)
      expect(store.filteredProjects[0].name).toBe('Project Alpha')
    })

    it('should be case insensitive', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockProjects
        })
      })

      const store = useProjectsStore()
      await store.fetchProjects()

      store.searchQuery = 'alpha'
      expect(store.filteredProjects.length).toBe(1)
    })

    it('should search in description too', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockProjects
        })
      })

      const store = useProjectsStore()
      await store.fetchProjects()

      store.searchQuery = 'First'
      expect(store.filteredProjects.length).toBe(1)
      expect(store.filteredProjects[0].name).toBe('Project Alpha')
    })

    it('should return all projects when search is empty', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockProjects
        })
      })

      const store = useProjectsStore()
      await store.fetchProjects()

      store.searchQuery = ''
      expect(store.filteredProjects.length).toBe(3)
    })
  })

  describe('getProjectById', () => {
    it('should return project from cache', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockProjects
        })
      })

      const store = useProjectsStore()
      await store.fetchProjects()

      const project = store.getProjectById(1)
      expect(project?.name).toBe('Project Alpha')
    })

    it('should return undefined for non-existent project', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockProjects
        })
      })

      const store = useProjectsStore()
      await store.fetchProjects()

      const project = store.getProjectById(999)
      expect(project).toBeUndefined()
    })
  })

  describe('updateProject', () => {
    it('should update project and return true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const store = useProjectsStore()
      const result = await store.updateProject(1, { name: 'New Name', description: 'New Description' })

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

      const store = useProjectsStore()
      await store.updateProject(5, { name: 'Test Project', description: 'Test Description' })

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('updateProject')
      expect(callBody.params).toEqual({
        project_id: 5,
        name: 'Test Project',
        description: 'Test Description'
      })
    })

    it('should throw error on update failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Update failed'))

      const store = useProjectsStore()

      await expect(
        store.updateProject(1, { name: 'New Name' })
      ).rejects.toThrow('Update failed')
    })
  })

  describe('removeProject', () => {
    it('should remove project and return true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const store = useProjectsStore()
      const result = await store.removeProject(1)

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

      const store = useProjectsStore()
      await store.removeProject(10)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('removeProject')
      expect(callBody.params).toEqual({ project_id: 10 })
    })

    it('should throw error on remove failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Remove failed'))

      const store = useProjectsStore()

      await expect(
        store.removeProject(1)
      ).rejects.toThrow('Remove failed')
    })
  })
})
