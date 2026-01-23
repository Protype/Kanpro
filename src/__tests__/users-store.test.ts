import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUsersStore } from '@/stores/users'
import { useAuthStore } from '@/stores/auth'
import type { User } from '@/types'

const mockFetch = vi.fn()

const mockUsers: User[] = [
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
  },
  {
    id: 3,
    username: 'user2',
    name: 'User Two',
    email: 'user2@example.com',
    role: 'app-user',
    is_active: false
  }
]

describe('Users Store', () => {
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
    it('should have empty users', () => {
      const store = useUsersStore()

      expect(store.users).toEqual([])
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('fetchAllUsers', () => {
    it('should fetch and store users', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockUsers
        })
      })

      const store = useUsersStore()
      await store.fetchAllUsers()

      expect(store.users).toEqual(mockUsers)
      expect(store.isLoading).toBe(false)
    })

    it('should handle fetch error silently (admin API)', async () => {
      // getAllUsers 需要 admin 權限，非 admin 用戶會靜默失敗
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const store = useUsersStore()
      await store.fetchAllUsers()

      // 靜默失敗：users 清空，不設定 error
      expect(store.users).toEqual([])
      expect(store.error).toBeNull()
    })

    it('should call API with correct method', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockUsers
        })
      })

      const store = useUsersStore()
      await store.fetchAllUsers()

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('getAllUsers')
    })
  })

  describe('getUser', () => {
    it('should get single user', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockUsers[0]
        })
      })

      const store = useUsersStore()
      const user = await store.getUser(1)

      expect(user).toEqual(mockUsers[0])
    })

    it('should call API with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockUsers[0]
        })
      })

      const store = useUsersStore()
      await store.getUser(5)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('getUser')
      expect(callBody.params).toEqual({ user_id: 5 })
    })
  })

  describe('createUser', () => {
    it('should create user and return id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: 10
        })
      })

      const store = useUsersStore()
      const result = await store.createUser({
        username: 'newuser',
        password: 'password123',
        name: 'New User',
        email: 'new@example.com',
        role: 'app-user'
      })

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

      const store = useUsersStore()
      await store.createUser({
        username: 'testuser',
        password: 'test123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'app-manager'
      })

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('createUser')
      expect(callBody.params).toEqual({
        username: 'testuser',
        password: 'test123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'app-manager'
      })
    })
  })

  describe('updateUser', () => {
    it('should update user and return true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const store = useUsersStore()
      const result = await store.updateUser(1, { name: 'Updated Name' })

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

      const store = useUsersStore()
      await store.updateUser(5, {
        name: 'Updated Name',
        email: 'updated@example.com',
        role: 'app-admin'
      })

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('updateUser')
      expect(callBody.params).toEqual({
        id: 5,
        name: 'Updated Name',
        email: 'updated@example.com',
        role: 'app-admin'
      })
    })
  })

  describe('enableUser', () => {
    it('should enable user and return true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const store = useUsersStore()
      const result = await store.enableUser(3)

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

      const store = useUsersStore()
      await store.enableUser(5)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('enableUser')
      expect(callBody.params).toEqual({ user_id: 5 })
    })
  })

  describe('disableUser', () => {
    it('should disable user and return true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const store = useUsersStore()
      const result = await store.disableUser(2)

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

      const store = useUsersStore()
      await store.disableUser(5)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('disableUser')
      expect(callBody.params).toEqual({ user_id: 5 })
    })
  })

  describe('removeUser', () => {
    it('should remove user and return true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const store = useUsersStore()
      const result = await store.removeUser(2)

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

      const store = useUsersStore()
      await store.removeUser(5)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('removeUser')
      expect(callBody.params).toEqual({ user_id: 5 })
    })
  })

  describe('computed properties', () => {
    it('should return users count', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockUsers
        })
      })

      const store = useUsersStore()
      await store.fetchAllUsers()

      expect(store.usersCount).toBe(3)
    })

    it('should return active users', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockUsers
        })
      })

      const store = useUsersStore()
      await store.fetchAllUsers()

      expect(store.activeUsers.length).toBe(2)
      expect(store.activeUsers.every(u => u.is_active)).toBe(true)
    })
  })

  describe('clearUsers', () => {
    it('should clear all users', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockUsers
        })
      })

      const store = useUsersStore()
      await store.fetchAllUsers()
      expect(store.users.length).toBe(3)

      store.clearUsers()

      expect(store.users).toEqual([])
      expect(store.error).toBeNull()
    })
  })
})
