import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGroupsStore } from '@/stores/groups'
import { useAuthStore } from '@/stores/auth'
import type { Group, User } from '@/types'

const mockFetch = vi.fn()

const mockGroups: Group[] = [
  {
    id: 1,
    name: 'Developers',
    external_id: null
  },
  {
    id: 2,
    name: 'Designers',
    external_id: null
  },
  {
    id: 3,
    name: 'Managers',
    external_id: 'ldap-managers'
  }
]

const mockMembers: User[] = [
  {
    id: 1,
    username: 'admin',
    name: 'Administrator',
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
  }
]

describe('Groups Store', () => {
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
    it('should have empty groups', () => {
      const store = useGroupsStore()

      expect(store.groups).toEqual([])
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('fetchAllGroups', () => {
    it('should fetch and store groups', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockGroups
        })
      })

      const store = useGroupsStore()
      await store.fetchAllGroups()

      expect(store.groups).toEqual(mockGroups)
      expect(store.isLoading).toBe(false)
    })

    it('should handle fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const store = useGroupsStore()
      await store.fetchAllGroups()

      expect(store.groups).toEqual([])
      expect(store.error).toBe('Network error')
    })

    it('should call API with correct method', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockGroups
        })
      })

      const store = useGroupsStore()
      await store.fetchAllGroups()

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('getAllGroups')
    })
  })

  describe('getGroup', () => {
    it('should get single group', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockGroups[0]
        })
      })

      const store = useGroupsStore()
      const group = await store.getGroup(1)

      expect(group).toEqual(mockGroups[0])
    })

    it('should call API with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockGroups[0]
        })
      })

      const store = useGroupsStore()
      await store.getGroup(5)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('getGroup')
      expect(callBody.params).toEqual({ group_id: 5 })
    })
  })

  describe('createGroup', () => {
    it('should create group and return id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: 10
        })
      })

      const store = useGroupsStore()
      const result = await store.createGroup('New Group')

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

      const store = useGroupsStore()
      await store.createGroup('Test Group', 'ext-123')

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('createGroup')
      expect(callBody.params).toEqual({
        name: 'Test Group',
        external_id: 'ext-123'
      })
    })
  })

  describe('updateGroup', () => {
    it('should update group and return true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const store = useGroupsStore()
      const result = await store.updateGroup(1, 'Updated Name')

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

      const store = useGroupsStore()
      await store.updateGroup(5, 'Updated Name', 'new-ext')

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('updateGroup')
      expect(callBody.params).toEqual({
        group_id: 5,
        name: 'Updated Name',
        external_id: 'new-ext'
      })
    })
  })

  describe('removeGroup', () => {
    it('should remove group and return true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const store = useGroupsStore()
      const result = await store.removeGroup(2)

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

      const store = useGroupsStore()
      await store.removeGroup(5)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('removeGroup')
      expect(callBody.params).toEqual({ group_id: 5 })
    })
  })

  describe('getGroupMembers', () => {
    it('should get group members', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockMembers
        })
      })

      const store = useGroupsStore()
      const members = await store.getGroupMembers(1)

      expect(members).toEqual(mockMembers)
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

      const store = useGroupsStore()
      await store.getGroupMembers(5)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('getGroupMembers')
      expect(callBody.params).toEqual({ group_id: 5 })
    })
  })

  describe('addGroupMember', () => {
    it('should add member and return true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const store = useGroupsStore()
      const result = await store.addGroupMember(1, 2)

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

      const store = useGroupsStore()
      await store.addGroupMember(5, 10)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('addGroupMember')
      expect(callBody.params).toEqual({
        group_id: 5,
        user_id: 10
      })
    })
  })

  describe('removeGroupMember', () => {
    it('should remove member and return true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const store = useGroupsStore()
      const result = await store.removeGroupMember(1, 2)

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

      const store = useGroupsStore()
      await store.removeGroupMember(5, 10)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('removeGroupMember')
      expect(callBody.params).toEqual({
        group_id: 5,
        user_id: 10
      })
    })
  })

  describe('computed properties', () => {
    it('should return groups count', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockGroups
        })
      })

      const store = useGroupsStore()
      await store.fetchAllGroups()

      expect(store.groupsCount).toBe(3)
    })
  })

  describe('clearGroups', () => {
    it('should clear all groups', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockGroups
        })
      })

      const store = useGroupsStore()
      await store.fetchAllGroups()
      expect(store.groups.length).toBe(3)

      store.clearGroups()

      expect(store.groups).toEqual([])
      expect(store.error).toBeNull()
    })
  })
})
