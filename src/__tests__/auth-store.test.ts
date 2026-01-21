import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import type { User } from '@/types'

// Mock localStorage
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => localStorageMock.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageMock.store[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageMock.store[key]
  }),
  clear: vi.fn(() => {
    localStorageMock.store = {}
  })
}

// Mock fetch for API calls
const mockFetch = vi.fn()

// Mock JWT token (valid format)
const mockAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoxOTk5OTk5OTk5fQ.test'
const mockRefreshToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoyOTk5OTk5OTk5fQ.test'

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('localStorage', localStorageMock)
    vi.stubGlobal('fetch', mockFetch)
    localStorageMock.clear()
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('initial state', () => {
    it('should have null user when not authenticated', () => {
      const store = useAuthStore()

      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })

    it('should have empty credentials', () => {
      const store = useAuthStore()

      expect(store.apiUrl).toBe('')
      expect(store.username).toBe('')
      expect(store.token).toBe('')
    })
  })

  describe('login', () => {
    it('should set user and credentials on successful JWT login', async () => {
      const mockUser: User = {
        id: 1,
        username: 'admin',
        name: 'Administrator',
        email: 'admin@example.com',
        role: 'app-admin',
        is_active: true
      }

      // First call: checkPlugin returns plugin info
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: { name: 'JWTAuth', version: '1.2.0', methods: [] }
        })
      })

      // Second call: getJWTToken
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 2,
          result: { access_token: mockAccessToken, refresh_token: mockRefreshToken }
        })
      })

      // Third call: getMe
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 3,
          result: mockUser
        })
      })

      const store = useAuthStore()

      await store.login({
        apiUrl: 'http://localhost/jsonrpc.php',
        username: 'admin',
        password: 'admin'
      })

      expect(store.user).toEqual(mockUser)
      expect(store.isAuthenticated).toBe(true)
      expect(store.apiUrl).toBe('http://localhost/jsonrpc.php')
      expect(store.username).toBe('admin')
      expect(store.accessToken).toBe(mockAccessToken)
      expect(store.refreshToken).toBe(mockRefreshToken)
    })

    it('should store credentials in localStorage when rememberMe is true', async () => {
      const mockUser: User = {
        id: 1,
        username: 'admin',
        name: 'Administrator',
        email: 'admin@example.com',
        role: 'app-admin',
        is_active: true
      }

      // checkPlugin returns plugin info
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: { name: 'JWTAuth', version: '1.2.0', methods: [] }
        })
      })

      // getJWTToken
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 2,
          result: { access_token: mockAccessToken, refresh_token: mockRefreshToken }
        })
      })

      // getMe
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 3,
          result: mockUser
        })
      })

      const store = useAuthStore()

      await store.login({
        apiUrl: 'http://localhost/jsonrpc.php',
        username: 'admin',
        password: 'admin',
        rememberMe: true
      })

      expect(localStorageMock.setItem).toHaveBeenCalled()
    })

    it('should throw error when JWT plugin is not installed', async () => {
      // checkPlugin returns error (no JWT plugin)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          error: { code: -32601, message: 'Method not found' }
        })
      })

      const store = useAuthStore()

      await expect(
        store.login({
          apiUrl: 'http://localhost/jsonrpc.php',
          username: 'admin',
          password: 'admin'
        })
      ).rejects.toThrow('KanproBridge 外掛未安裝或 JWT 功能未啟用')

      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })

    it('should throw error on invalid credentials', async () => {
      // checkPlugin returns plugin info
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: { name: 'JWTAuth', version: '1.2.0', methods: [] }
        })
      })

      // getJWTToken returns 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      })

      const store = useAuthStore()

      await expect(
        store.login({
          apiUrl: 'http://localhost/jsonrpc.php',
          username: 'admin',
          password: 'wrong'
        })
      ).rejects.toThrow()

      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })

    it('should throw error on network failure', async () => {
      // checkPlugin fails with network error
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const store = useAuthStore()

      await expect(
        store.login({
          apiUrl: 'http://localhost/jsonrpc.php',
          username: 'admin',
          password: 'admin'
        })
      ).rejects.toThrow()

      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('logout', () => {
    it('should clear user and credentials', async () => {
      const mockUser: User = {
        id: 1,
        username: 'admin',
        name: 'Administrator',
        email: 'admin@example.com',
        role: 'app-admin',
        is_active: true
      }

      // Setup: Login first
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: { name: 'JWTAuth', version: '1.2.0', methods: [] }
        })
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 2,
          result: { access_token: mockAccessToken, refresh_token: mockRefreshToken }
        })
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 3,
          result: mockUser
        })
      })

      const store = useAuthStore()

      await store.login({
        apiUrl: 'http://localhost/jsonrpc.php',
        username: 'admin',
        password: 'admin',
        rememberMe: true
      })

      expect(store.isAuthenticated).toBe(true)

      // Mock revoke token calls (they can fail silently)
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 4, result: true })
      })

      await store.logout()

      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(store.apiUrl).toBe('')
      expect(store.username).toBe('')
      expect(store.token).toBe('')
      expect(localStorageMock.removeItem).toHaveBeenCalled()
    })
  })

  describe('restoreSession', () => {
    it('should restore session from localStorage', async () => {
      const savedCredentials = {
        apiUrl: 'http://localhost/jsonrpc.php',
        username: 'admin',
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        tokenExpiresAt: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      }
      localStorageMock.store['kanpro_auth'] = JSON.stringify(savedCredentials)

      const mockUser: User = {
        id: 1,
        username: 'admin',
        name: 'Administrator',
        email: 'admin@example.com',
        role: 'app-admin',
        is_active: true
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockUser
        })
      })

      const store = useAuthStore()
      const restored = await store.restoreSession()

      expect(restored).toBe(true)
      expect(store.isAuthenticated).toBe(true)
      expect(store.user).toEqual(mockUser)
    })

    it('should return false when no saved credentials', async () => {
      const store = useAuthStore()
      const restored = await store.restoreSession()

      expect(restored).toBe(false)
      expect(store.isAuthenticated).toBe(false)
    })

    it('should clear saved credentials on restore failure', async () => {
      const savedCredentials = {
        apiUrl: 'http://localhost/jsonrpc.php',
        username: 'admin',
        accessToken: 'invalid_token',
        refreshToken: 'invalid_refresh',
        tokenExpiresAt: Math.floor(Date.now() / 1000) + 3600
      }
      localStorageMock.store['kanpro_auth'] = JSON.stringify(savedCredentials)

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      })

      const store = useAuthStore()
      const restored = await store.restoreSession()

      expect(restored).toBe(false)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('kanpro_auth')
    })

    it('should refresh token if expired', async () => {
      const savedCredentials = {
        apiUrl: 'http://localhost/jsonrpc.php',
        username: 'admin',
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        tokenExpiresAt: Math.floor(Date.now() / 1000) - 100 // Expired
      }
      localStorageMock.store['kanpro_auth'] = JSON.stringify(savedCredentials)

      const mockUser: User = {
        id: 1,
        username: 'admin',
        name: 'Administrator',
        email: 'admin@example.com',
        role: 'app-admin',
        is_active: true
      }

      // First call: refreshToken
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: { access_token: mockAccessToken, refresh_token: mockRefreshToken }
        })
      })

      // Second call: getMe
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 2,
          result: mockUser
        })
      })

      const store = useAuthStore()
      const restored = await store.restoreSession()

      expect(restored).toBe(true)
      expect(store.isAuthenticated).toBe(true)
    })
  })

  describe('updateCurrentUser', () => {
    it('should update user and return true', async () => {
      const mockUser: User = {
        id: 1,
        username: 'admin',
        name: 'Administrator',
        email: 'admin@example.com',
        role: 'app-admin',
        is_active: true
      }

      // Setup: Login first
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: { name: 'JWTAuth', version: '1.2.0', methods: [] }
        })
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 2,
          result: { access_token: mockAccessToken, refresh_token: mockRefreshToken }
        })
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 3,
          result: mockUser
        })
      })

      const store = useAuthStore()
      await store.login({
        apiUrl: 'http://localhost/jsonrpc.php',
        username: 'admin',
        password: 'admin'
      })

      // Update user
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 4,
          result: true
        })
      })

      // Fetch updated user
      const updatedUser: User = {
        ...mockUser,
        name: 'New Name',
        email: 'new@example.com'
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 5,
          result: updatedUser
        })
      })

      const result = await store.updateCurrentUser({
        name: 'New Name',
        email: 'new@example.com'
      })

      expect(result).toBe(true)
      expect(store.user?.name).toBe('New Name')
      expect(store.user?.email).toBe('new@example.com')
    })

    it('should call API with correct parameters', async () => {
      const mockUser: User = {
        id: 1,
        username: 'admin',
        name: 'Administrator',
        email: 'admin@example.com',
        role: 'app-admin',
        is_active: true
      }

      // Setup: Login first
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: { name: 'JWTAuth', version: '1.2.0', methods: [] }
        })
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 2,
          result: { access_token: mockAccessToken, refresh_token: mockRefreshToken }
        })
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 3,
          result: mockUser
        })
      })

      const store = useAuthStore()
      await store.login({
        apiUrl: 'http://localhost/jsonrpc.php',
        username: 'admin',
        password: 'admin'
      })

      // Update user
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 4,
          result: true
        })
      })

      // Fetch updated user
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 5,
          result: mockUser
        })
      })

      await store.updateCurrentUser({
        name: 'Updated Name'
      })

      // Check the fourth call (update) - 1:checkPlugin, 2:getToken, 3:getMe, 4:updateUser
      const updateCallBody = JSON.parse(mockFetch.mock.calls[3][1].body)
      expect(updateCallBody.method).toBe('updateUser')
      expect(updateCallBody.params).toEqual({
        id: 1,
        name: 'Updated Name'
      })
    })

    it('should throw error when not authenticated', async () => {
      const store = useAuthStore()

      await expect(
        store.updateCurrentUser({ name: 'Test' })
      ).rejects.toThrow()
    })
  })
})
