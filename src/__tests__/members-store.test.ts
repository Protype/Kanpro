import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMembersStore } from '@/stores/members'
import { useAuthStore } from '@/stores/auth'
import { useSystemStore } from '@/stores/system'
import type { User } from '@/types'

const mockFetch = vi.fn()

// Standard API returns { userId: displayName } format
const mockProjectUsersMap: Record<string, string> = {
  '1': 'Admin User',
  '2': 'User One'
}

// Extended format (when project_user feature is enabled, API returns full user objects)
const mockExtendedProjectUsers = [
  {
    id: 1,
    username: 'admin',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'app-admin',
    is_active: true,
    project_role: 'project-manager' as const,
    avatar: 'base64encodedavatar1'
  },
  {
    id: 2,
    username: 'user1',
    name: 'User One',
    email: 'user1@example.com',
    role: 'app-user',
    is_active: true,
    project_role: 'project-member' as const,
    avatar: null
  }
]

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

// Helper to setup system store with bridge status
function setupSystemStoreWithBridge(enabled: boolean = true) {
  const systemStore = useSystemStore()
  systemStore.bridgeStatus = {
    name: 'KanproBridge',
    version: '1.0.0',
    features: {
      jwt_auth: { enabled: true, methods: [] },
      user_metadata: { enabled: true, methods: [] },
      user_avatar: { enabled: true, methods: [] },
      user_password: { enabled: true, methods: [] },
      user_profile: { enabled: true, methods: [] },
      project_user: { enabled, methods: [] }
    }
  }
}

describe('Members Store', () => {
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

    // Setup system store with bridge enabled by default
    setupSystemStoreWithBridge(true)
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
    it('should fetch and store project members using Extended API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockExtendedProjectUsers
        })
      })

      const store = useMembersStore()
      await store.fetchProjectMembers(1)

      expect(store.members.length).toBe(2)
      expect(store.members[0].username).toBe('admin')
      expect(store.members[0].role).toBe('project-manager')
      expect(store.isLoading).toBe(false)
    })

    it('should use standard API when Extended API is disabled', async () => {
      // Disable Extended API
      setupSystemStoreWithBridge(false)

      // Standard API returns { userId: displayName } format
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockProjectUsersMap
        })
      })
      // Mock getUser for user 1
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 2,
          result: { id: 1, username: 'admin', name: 'Admin User', email: 'admin@example.com', is_active: true }
        })
      })
      // Mock getProjectUserRole for user 1
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 3,
          result: 'project-manager'
        })
      })
      // Mock getUser for user 2
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 4,
          result: { id: 2, username: 'user1', name: 'User One', email: 'user1@example.com', is_active: true }
        })
      })
      // Mock getProjectUserRole for user 2
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 5,
          result: 'project-member'
        })
      })

      const store = useMembersStore()
      await store.fetchProjectMembers(1)

      expect(store.members.length).toBe(2)
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('getProjectUsers')
    })

    it('should handle fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const store = useMembersStore()
      await store.fetchProjectMembers(1)

      expect(store.members).toEqual([])
      expect(store.error).toBe('Network error')
    })

    it('should call getProjectUsers API with correct parameters (Extended format when enabled)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockExtendedProjectUsers
        })
      })

      const store = useMembersStore()
      await store.fetchProjectMembers(5)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      // When project_user feature is enabled, same API returns extended format
      // Kanpro Bridge uses camelCase parameter names
      expect(callBody.method).toBe('getProjectUsers')
      expect(callBody.params).toEqual({ projectId: 5 })
    })

    it('should include avatar in member data when available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockExtendedProjectUsers
        })
      })

      const store = useMembersStore()
      await store.fetchProjectMembers(1)

      expect(store.members[0].avatar).toBe('base64encodedavatar1')
      expect(store.members[1].avatar).toBeNull()
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
          result: mockExtendedProjectUsers
        })
      })

      const store = useMembersStore()
      await store.fetchProjectMembers(1)

      expect(store.membersCount).toBe(2)
    })

    it('should return available users', async () => {
      // First fetch members (Extended API)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockExtendedProjectUsers
        })
      })
      // Then fetch all users
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 2,
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
          result: mockExtendedProjectUsers
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
