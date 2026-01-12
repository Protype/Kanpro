import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMembersStore } from '@/stores/members'
import { useAuthStore } from '@/stores/auth'
import type { ProjectMember, User } from '@/types'

const mockFetch = vi.fn()

const mockMembers: Record<string, ProjectMember> = {
  '1': {
    id: 1,
    username: 'admin',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'project-manager',
    is_active: true
  },
  '2': {
    id: 2,
    username: 'user1',
    name: 'User One',
    email: 'user1@example.com',
    role: 'project-member',
    is_active: true
  }
}

const mockUsers: User[] = [
  {
    id: 1,
    username: 'admin',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'app-admin',
    is_active: true
  },
  {
    id: 2,
    username: 'user1',
    name: 'User One',
    email: 'user1@example.com',
    role: 'app-user',
    is_active: true
  },
  {
    id: 3,
    username: 'user2',
    name: 'User Two',
    email: 'user2@example.com',
    role: 'app-user',
    is_active: true
  }
]

describe('Members Store', () => {
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
    it('should have empty members', () => {
      const store = useMembersStore()

      expect(store.members).toEqual([])
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('fetchProjectMembers', () => {
    it('should fetch and store project members', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockMembers
        })
      })

      const store = useMembersStore()
      await store.fetchProjectMembers(1)

      expect(store.members.length).toBe(2)
      expect(store.isLoading).toBe(false)
    })

    it('should handle fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const store = useMembersStore()
      await store.fetchProjectMembers(1)

      expect(store.members).toEqual([])
      expect(store.error).toBe('Network error')
    })

    it('should call API with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockMembers
        })
      })

      const store = useMembersStore()
      await store.fetchProjectMembers(5)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('getProjectUsers')
      expect(callBody.params).toEqual({ project_id: 5 })
    })
  })

  describe('fetchAllUsers', () => {
    it('should fetch all users', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockUsers
        })
      })

      const store = useMembersStore()
      await store.fetchAllUsers()

      expect(store.allUsers.length).toBe(3)
    })

    it('should call getAllUsers API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockUsers
        })
      })

      const store = useMembersStore()
      await store.fetchAllUsers()

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('getAllUsers')
    })
  })

  describe('addProjectUser', () => {
    it('should add user to project', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const store = useMembersStore()
      const result = await store.addProjectUser(1, 3, 'project-member')

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

      const store = useMembersStore()
      await store.addProjectUser(10, 20, 'project-manager')

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('addProjectUser')
      expect(callBody.params).toEqual({
        project_id: 10,
        user_id: 20,
        role: 'project-manager'
      })
    })
  })

  describe('removeProjectUser', () => {
    it('should remove user from project', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const store = useMembersStore()
      const result = await store.removeProjectUser(1, 2)

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

      const store = useMembersStore()
      await store.removeProjectUser(5, 10)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('removeProjectUser')
      expect(callBody.params).toEqual({
        project_id: 5,
        user_id: 10
      })
    })
  })

  describe('changeProjectUserRole', () => {
    it('should change user role', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const store = useMembersStore()
      const result = await store.changeProjectUserRole(1, 2, 'project-manager')

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

      const store = useMembersStore()
      await store.changeProjectUserRole(5, 10, 'project-viewer')

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('changeProjectUserRole')
      expect(callBody.params).toEqual({
        project_id: 5,
        user_id: 10,
        role: 'project-viewer'
      })
    })
  })

  describe('computed properties', () => {
    it('should return members count', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockMembers
        })
      })

      const store = useMembersStore()
      await store.fetchProjectMembers(1)

      expect(store.membersCount).toBe(2)
    })

    it('should return available users', async () => {
      // First fetch members
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockMembers
        })
      })
      // Then fetch all users
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockUsers
        })
      })

      const store = useMembersStore()
      await store.fetchProjectMembers(1)
      await store.fetchAllUsers()

      // User 3 is not a member yet
      expect(store.availableUsers.length).toBe(1)
      expect(store.availableUsers[0].id).toBe(3)
    })
  })

  describe('clearMembers', () => {
    it('should clear all members', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockMembers
        })
      })

      const store = useMembersStore()
      await store.fetchProjectMembers(1)
      expect(store.members.length).toBe(2)

      store.clearMembers()

      expect(store.members).toEqual([])
      expect(store.error).toBeNull()
    })
  })
})
