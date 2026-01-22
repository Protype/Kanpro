import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSystemStore, BRIDGE_MODULES } from '@/stores/system'
import { useAuthStore } from '@/stores/auth'

// Mock fetch for API calls
const mockFetch = vi.fn()

describe('System Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('initial state', () => {
    it('should have null values initially', () => {
      const store = useSystemStore()

      expect(store.kanboardVersion).toBeNull()
      expect(store.kanboardTimezone).toBeNull()
      expect(store.apiLatency).toBeNull()
      expect(store.connectionStatus).toBe('checking')
      expect(store.bridgeStatus).toBeNull()
      expect(store.bridgeError).toBeNull()
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('BRIDGE_MODULES', () => {
    it('should define JWT module', () => {
      const jwtModule = BRIDGE_MODULES.find(m => m.id === 'jwt')
      expect(jwtModule).toBeDefined()
      expect(jwtModule?.name).toBe('JWT 認證')
      expect(jwtModule?.featureKey).toBe('jwt_auth')
    })

    it('should define avatar module', () => {
      const avatarModule = BRIDGE_MODULES.find(m => m.id === 'avatar')
      expect(avatarModule).toBeDefined()
      expect(avatarModule?.name).toBe('使用者頭像')
      expect(avatarModule?.featureKey).toBe('user_avatar')
    })

    it('should define metadata module', () => {
      const metadataModule = BRIDGE_MODULES.find(m => m.id === 'metadata')
      expect(metadataModule).toBeDefined()
      expect(metadataModule?.name).toBe('使用者元資料')
      expect(metadataModule?.featureKey).toBe('user_metadata')
    })

    it('should define password module', () => {
      const passwordModule = BRIDGE_MODULES.find(m => m.id === 'password')
      expect(passwordModule).toBeDefined()
      expect(passwordModule?.name).toBe('密碼管理')
      expect(passwordModule?.featureKey).toBe('user_password')
    })

    it('should define profile module', () => {
      const profileModule = BRIDGE_MODULES.find(m => m.id === 'profile')
      expect(profileModule).toBeDefined()
      expect(profileModule?.name).toBe('使用者設定檔')
      expect(profileModule?.featureKey).toBe('user_profile')
    })
  })

  describe('isModuleEnabled', () => {
    it('should return false when bridgeStatus is null', () => {
      const store = useSystemStore()
      expect(store.isModuleEnabled('jwt')).toBe(false)
    })

    it('should return true when feature is enabled', () => {
      const store = useSystemStore()
      store.bridgeStatus = {
        name: 'KanproBridge',
        version: '1.0.0',
        features: {
          jwt_auth: { enabled: true, methods: [] },
          user_metadata: { enabled: false, methods: [] },
          user_avatar: { enabled: false, methods: [] },
          user_password: { enabled: false, methods: [] },
          user_profile: { enabled: false, methods: [] }
        }
      }
      expect(store.isModuleEnabled('jwt')).toBe(true)
    })

    it('should return false when feature is disabled', () => {
      const store = useSystemStore()
      store.bridgeStatus = {
        name: 'KanproBridge',
        version: '1.0.0',
        features: {
          jwt_auth: { enabled: false, methods: [] },
          user_metadata: { enabled: false, methods: [] },
          user_avatar: { enabled: false, methods: [] },
          user_password: { enabled: false, methods: [] },
          user_profile: { enabled: false, methods: [] }
        }
      }
      expect(store.isModuleEnabled('jwt')).toBe(false)
    })

    it('should return false for unknown module', () => {
      const store = useSystemStore()
      store.bridgeStatus = {
        name: 'KanproBridge',
        version: '1.0.0',
        features: {
          jwt_auth: { enabled: true, methods: [] },
          user_metadata: { enabled: true, methods: [] },
          user_avatar: { enabled: true, methods: [] },
          user_password: { enabled: true, methods: [] },
          user_profile: { enabled: true, methods: [] }
        }
      }
      expect(store.isModuleEnabled('unknown')).toBe(false)
    })
  })

  describe('moduleStatuses', () => {
    it('should return all modules with enabled status', () => {
      const store = useSystemStore()
      store.bridgeStatus = {
        name: 'KanproBridge',
        version: '1.0.0',
        features: {
          jwt_auth: { enabled: true, methods: [] },
          user_metadata: { enabled: false, methods: [] },
          user_avatar: { enabled: true, methods: [] },
          user_password: { enabled: true, methods: [] },
          user_profile: { enabled: false, methods: [] }
        }
      }

      const statuses = store.moduleStatuses
      expect(statuses.length).toBe(BRIDGE_MODULES.length)

      const jwtStatus = statuses.find(s => s.id === 'jwt')
      expect(jwtStatus?.enabled).toBe(true)

      const avatarStatus = statuses.find(s => s.id === 'avatar')
      expect(avatarStatus?.enabled).toBe(true)

      const metadataStatus = statuses.find(s => s.id === 'metadata')
      expect(metadataStatus?.enabled).toBe(false)
    })
  })

  describe('fetchKanboardInfo', () => {
    it('should fetch version and timezone successfully', async () => {
      // Setup auth store
      const authStore = useAuthStore()
      authStore._setTestCredentials({
        apiUrl: 'https://test.com/jsonrpc.php',
        username: 'admin',
        accessToken: 'test-token'
      })

      // Mock getVersion
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: '1.2.30'
        })
      })

      // Mock getTimezone
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 2,
          result: 'Asia/Taipei'
        })
      })

      const store = useSystemStore()
      await store.fetchKanboardInfo()

      expect(store.kanboardVersion).toBe('1.2.30')
      expect(store.kanboardTimezone).toBe('Asia/Taipei')
      expect(store.connectionStatus).toBe('connected')
      expect(store.apiLatency).toBeGreaterThanOrEqual(0)
    })

    it('should handle connection error', async () => {
      // Setup auth store
      const authStore = useAuthStore()
      authStore._setTestCredentials({
        apiUrl: 'https://test.com/jsonrpc.php',
        username: 'admin',
        accessToken: 'test-token'
      })

      // Mock failed request
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const store = useSystemStore()
      await store.fetchKanboardInfo()

      expect(store.connectionStatus).toBe('disconnected')
      expect(store.error).toContain('Network error')
    })
  })

  describe('fetchBridgeStatus', () => {
    it('should fetch bridge status successfully', async () => {
      // Setup auth store
      const authStore = useAuthStore()
      authStore._setTestCredentials({
        apiUrl: 'https://test.com/jsonrpc.php',
        username: 'admin',
        accessToken: 'test-token'
      })

      const mockBridgeStatus = {
        name: 'KanproBridge',
        version: '1.0.0',
        description: 'Kanpro Bridge Plugin',
        features: {
          jwt_auth: { enabled: true, methods: [] },
          user_metadata: { enabled: true, methods: [] },
          user_avatar: { enabled: true, methods: [] },
          user_password: { enabled: true, methods: [] },
          user_profile: { enabled: false, methods: [] }
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockBridgeStatus
        })
      })

      const store = useSystemStore()
      await store.fetchBridgeStatus()

      expect(store.bridgeStatus).toEqual(mockBridgeStatus)
      expect(store.bridgeError).toBeNull()
    })

    it('should handle bridge status error', async () => {
      // Setup auth store
      const authStore = useAuthStore()
      authStore._setTestCredentials({
        apiUrl: 'https://test.com/jsonrpc.php',
        username: 'admin',
        accessToken: 'test-token'
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          error: { code: -32601, message: 'Method not found' }
        })
      })

      const store = useSystemStore()
      await store.fetchBridgeStatus()

      expect(store.bridgeStatus).toBeNull()
      expect(store.bridgeError).toContain('Method not found')
    })
  })

  describe('testConnection', () => {
    it('should return success with latency', async () => {
      // Setup auth store
      const authStore = useAuthStore()
      authStore._setTestCredentials({
        apiUrl: 'https://test.com/jsonrpc.php',
        username: 'admin',
        accessToken: 'test-token'
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: '1.2.30'
        })
      })

      const store = useSystemStore()
      const result = await store.testConnection()

      expect(result.success).toBe(true)
      expect(result.latency).toBeGreaterThanOrEqual(0)
    })

    it('should return failure on error', async () => {
      // Setup auth store
      const authStore = useAuthStore()
      authStore._setTestCredentials({
        apiUrl: 'https://test.com/jsonrpc.php',
        username: 'admin',
        accessToken: 'test-token'
      })

      mockFetch.mockRejectedValueOnce(new Error('Connection refused'))

      const store = useSystemStore()
      const result = await store.testConnection()

      expect(result.success).toBe(false)
      expect(result.error).toContain('Connection refused')
    })
  })

  describe('$reset', () => {
    it('should reset all state to initial values', () => {
      const store = useSystemStore()

      // Set some values
      store.kanboardVersion = '1.2.30'
      store.kanboardTimezone = 'Asia/Taipei'
      store.apiLatency = 50
      store.connectionStatus = 'connected'
      store.bridgeStatus = {
        name: 'test',
        version: '1.0',
        features: {
          jwt_auth: { enabled: true, methods: [] },
          user_metadata: { enabled: true, methods: [] },
          user_avatar: { enabled: true, methods: [] },
          user_password: { enabled: true, methods: [] },
          user_profile: { enabled: true, methods: [] }
        }
      }
      store.bridgeError = 'some error'
      store.isLoading = true
      store.error = 'another error'

      // Reset
      store.$reset()

      // Verify reset
      expect(store.kanboardVersion).toBeNull()
      expect(store.kanboardTimezone).toBeNull()
      expect(store.apiLatency).toBeNull()
      expect(store.connectionStatus).toBe('checking')
      expect(store.bridgeStatus).toBeNull()
      expect(store.bridgeError).toBeNull()
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })
  })
})
