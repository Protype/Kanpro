import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useAppConfig, resetAppConfig } from '@/composables/useAppConfig'

describe('useAppConfig', () => {
  let config: ReturnType<typeof useAppConfig>

  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    resetAppConfig()
    config = useAppConfig()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('localStorage operations', () => {
    it('should store API URL to localStorage', () => {
      config.setApiUrl('https://example.com/jsonrpc.php')

      expect(localStorage.getItem('kanpro-api-url')).toBe('https://example.com/jsonrpc.php')
    })

    it('should retrieve API URL from localStorage', () => {
      localStorage.setItem('kanpro-api-url', 'https://stored.com/jsonrpc.php')

      expect(config.getStoredApiUrl()).toBe('https://stored.com/jsonrpc.php')
    })

    it('should return empty string when no stored URL', () => {
      expect(config.getStoredApiUrl()).toBe('')
    })

    it('should clear API URL from localStorage', () => {
      localStorage.setItem('kanpro-api-url', 'https://example.com/jsonrpc.php')

      config.clearApiUrl()

      expect(localStorage.getItem('kanpro-api-url')).toBeNull()
    })

    it('should remove from localStorage when setting empty string', () => {
      localStorage.setItem('kanpro-api-url', 'https://example.com/jsonrpc.php')

      config.setApiUrl('')

      expect(localStorage.getItem('kanpro-api-url')).toBeNull()
    })
  })

  describe('getApiUrl priority', () => {
    it('should return localStorage value when available', () => {
      localStorage.setItem('kanpro-api-url', 'https://stored.com/jsonrpc.php')

      expect(config.getApiUrl()).toBe('https://stored.com/jsonrpc.php')
    })

    it('should return empty string when nothing configured', () => {
      expect(config.getApiUrl()).toBe('')
    })
  })

  describe('loadConfig', () => {
    it('should fetch config.json', async () => {
      const mockResponse = { apiUrl: 'https://config.com/jsonrpc.php' }
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      await config.loadConfig()

      expect(fetch).toHaveBeenCalledWith('/config.json')
    })

    it('should handle fetch errors gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      await expect(config.loadConfig()).resolves.not.toThrow()
    })

    it('should handle non-ok response gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false
      })

      await expect(config.loadConfig()).resolves.not.toThrow()
    })

    it('should only load config once', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ apiUrl: '' })
      })

      await config.loadConfig()
      await config.loadConfig()

      expect(fetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('hasConfiguredUrl', () => {
    it('should return false when nothing configured', () => {
      expect(config.hasConfiguredUrl.value).toBe(false)
    })

    it('should return true when localStorage has URL', () => {
      localStorage.setItem('kanpro-api-url', 'https://stored.com/jsonrpc.php')

      const newConfig = useAppConfig()
      expect(newConfig.hasConfiguredUrl.value).toBe(true)
    })
  })

  describe('normalizeApiUrl', () => {
    it('should return empty string for empty input', () => {
      expect(config.normalizeApiUrl('')).toBe('')
      expect(config.normalizeApiUrl('   ')).toBe('')
    })

    it('should not modify URLs ending with .php', () => {
      expect(config.normalizeApiUrl('/api/jsonrpc.php')).toBe('/api/jsonrpc.php')
      expect(config.normalizeApiUrl('https://example.com/jsonrpc.php')).toBe('https://example.com/jsonrpc.php')
    })

    it('should append jsonrpc.php to URLs not ending with .php', () => {
      expect(config.normalizeApiUrl('/kanboard')).toBe('/kanboard/jsonrpc.php')
      expect(config.normalizeApiUrl('/kanboard/')).toBe('/kanboard/jsonrpc.php')
      expect(config.normalizeApiUrl('https://example.com/kb')).toBe('https://example.com/kb/jsonrpc.php')
    })

    it('should trim whitespace', () => {
      expect(config.normalizeApiUrl('  /kanboard  ')).toBe('/kanboard/jsonrpc.php')
    })

    it('should handle trailing slash correctly', () => {
      expect(config.normalizeApiUrl('/api/')).toBe('/api/jsonrpc.php')
      expect(config.normalizeApiUrl('/api')).toBe('/api/jsonrpc.php')
    })
  })
})
