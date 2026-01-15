import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createJWTAuthService } from '@/services/api/jwt'

describe('JWTAuthService', () => {
  const mockApiUrl = 'https://kanboard.example.com/jsonrpc.php'

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // Helper: 建立成功回應
  function mockSuccessResponse(result: unknown) {
    return {
      ok: true,
      json: () => Promise.resolve({
        jsonrpc: '2.0',
        id: 1,
        result
      })
    }
  }

  // Helper: 建立錯誤回應
  function mockErrorResponse(code: number, message: string) {
    return {
      ok: true,
      json: () => Promise.resolve({
        jsonrpc: '2.0',
        id: 1,
        error: { code, message }
      })
    }
  }

  // Helper: 建立 HTTP 錯誤
  function mockHttpError(status: number, statusText: string) {
    return {
      ok: false,
      status,
      statusText
    }
  }

  describe('checkPlugin', () => {
    it('should return plugin info when plugin is available', async () => {
      const pluginInfo = {
        name: 'JWTAuth',
        version: '1.1.0',
        methods: ['getJWTToken', 'refreshJWTToken', 'revokeJWTToken']
      }

      vi.mocked(fetch).mockResolvedValue(mockSuccessResponse(pluginInfo) as Response)

      const service = createJWTAuthService()
      const result = await service.checkPlugin(mockApiUrl)

      expect(result).toEqual(pluginInfo)
      expect(fetch).toHaveBeenCalledTimes(1)
      const [url, options] = vi.mocked(fetch).mock.calls[0]
      expect(url).toBe(mockApiUrl)
      expect(options?.method).toBe('POST')
      expect(options?.headers).toEqual({ 'Content-Type': 'application/json' })
      const body = JSON.parse(options?.body as string)
      expect(body.jsonrpc).toBe('2.0')
      expect(body.method).toBe('getJWTPlugin')
      expect(typeof body.id).toBe('number')
    })

    it('should return null when plugin is not available (JSON-RPC error)', async () => {
      vi.mocked(fetch).mockResolvedValue(
        mockErrorResponse(-32601, 'Method not found') as unknown as Response
      )

      const service = createJWTAuthService()
      const result = await service.checkPlugin(mockApiUrl)

      expect(result).toBeNull()
    })

    it('should return null on HTTP error', async () => {
      vi.mocked(fetch).mockResolvedValue(
        mockHttpError(500, 'Internal Server Error') as Response
      )

      const service = createJWTAuthService()
      const result = await service.checkPlugin(mockApiUrl)

      expect(result).toBeNull()
    })

    it('should return null on network error', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

      const service = createJWTAuthService()
      const result = await service.checkPlugin(mockApiUrl)

      expect(result).toBeNull()
    })
  })

  describe('getToken', () => {
    it('should return tokens on valid credentials', async () => {
      const tokenResponse = {
        access_token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMiLCJleHAiOjE3MzY5NjAwMDB9.sig',
        refresh_token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMiLCJleHAiOjE3Mzk1NTIwMDB9.sig'
      }

      vi.mocked(fetch).mockResolvedValue(mockSuccessResponse(tokenResponse) as Response)

      const service = createJWTAuthService()
      const result = await service.getToken(mockApiUrl, 'testuser', 'testpass')

      expect(result).toEqual(tokenResponse)

      // 驗證使用 Basic Auth
      const expectedAuth = btoa('testuser:testpass')
      expect(fetch).toHaveBeenCalledTimes(1)
      const [url, options] = vi.mocked(fetch).mock.calls[0]
      expect(url).toBe(mockApiUrl)
      expect(options?.method).toBe('POST')
      expect(options?.headers).toEqual({
        'Content-Type': 'application/json',
        'Authorization': `Basic ${expectedAuth}`
      })
      const body = JSON.parse(options?.body as string)
      expect(body.jsonrpc).toBe('2.0')
      expect(body.method).toBe('getJWTToken')
      expect(typeof body.id).toBe('number')
    })

    it('should throw on invalid credentials', async () => {
      vi.mocked(fetch).mockResolvedValue(
        mockErrorResponse(-32000, 'Invalid credentials') as unknown as Response
      )

      const service = createJWTAuthService()

      await expect(service.getToken(mockApiUrl, 'wrong', 'wrong'))
        .rejects.toThrow('Invalid credentials')
    })

    it('should throw on HTTP 401', async () => {
      vi.mocked(fetch).mockResolvedValue(
        mockHttpError(401, 'Unauthorized') as Response
      )

      const service = createJWTAuthService()

      await expect(service.getToken(mockApiUrl, 'user', 'pass'))
        .rejects.toThrow('HTTP 401: Unauthorized')
    })
  })

  describe('refreshToken', () => {
    it('should return new access token', async () => {
      const newAccessToken = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMiLCJleHAiOjE3MzY5NjM2MDB9.sig'

      vi.mocked(fetch).mockResolvedValue(
        mockSuccessResponse({ access_token: newAccessToken }) as Response
      )

      const service = createJWTAuthService()
      const result = await service.refreshToken(mockApiUrl, 'refresh_token_here')

      expect(result).toBe(newAccessToken)

      // 驗證請求格式
      expect(fetch).toHaveBeenCalledTimes(1)
      const [url, options] = vi.mocked(fetch).mock.calls[0]
      expect(url).toBe(mockApiUrl)
      expect(options?.method).toBe('POST')
      expect(options?.headers).toEqual({ 'Content-Type': 'application/json' })
      const body = JSON.parse(options?.body as string)
      expect(body.jsonrpc).toBe('2.0')
      expect(body.method).toBe('refreshJWTToken')
      expect(typeof body.id).toBe('number')
      expect(body.params).toEqual({ refresh_token: 'refresh_token_here' })
    })

    it('should throw on invalid refresh token', async () => {
      vi.mocked(fetch).mockResolvedValue(
        mockErrorResponse(-32000, 'Invalid or expired refresh token') as unknown as Response
      )

      const service = createJWTAuthService()

      await expect(service.refreshToken(mockApiUrl, 'invalid_token'))
        .rejects.toThrow('Invalid or expired refresh token')
    })

    it('should throw on HTTP error', async () => {
      vi.mocked(fetch).mockResolvedValue(
        mockHttpError(500, 'Internal Server Error') as Response
      )

      const service = createJWTAuthService()

      await expect(service.refreshToken(mockApiUrl, 'token'))
        .rejects.toThrow('HTTP 500: Internal Server Error')
    })
  })

  describe('revokeToken', () => {
    it('should return true on successful revocation', async () => {
      vi.mocked(fetch).mockResolvedValue(mockSuccessResponse(true) as Response)

      const service = createJWTAuthService()
      const result = await service.revokeToken(
        mockApiUrl,
        'access_token_here',
        'token_to_revoke'
      )

      expect(result).toBe(true)

      // 驗證使用 Bearer token
      expect(fetch).toHaveBeenCalledTimes(1)
      const [url, options] = vi.mocked(fetch).mock.calls[0]
      expect(url).toBe(mockApiUrl)
      expect(options?.method).toBe('POST')
      expect(options?.headers).toEqual({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer access_token_here'
      })
      const body = JSON.parse(options?.body as string)
      expect(body.jsonrpc).toBe('2.0')
      expect(body.method).toBe('revokeJWTToken')
      expect(typeof body.id).toBe('number')
      expect(body.params).toEqual({ token: 'token_to_revoke' })
    })

    it('should return false on JSON-RPC error', async () => {
      vi.mocked(fetch).mockResolvedValue(
        mockErrorResponse(-32000, 'Token not found') as unknown as Response
      )

      const service = createJWTAuthService()
      const result = await service.revokeToken(mockApiUrl, 'access', 'invalid')

      expect(result).toBe(false)
    })

    it('should return false on HTTP error', async () => {
      vi.mocked(fetch).mockResolvedValue(
        mockHttpError(401, 'Unauthorized') as Response
      )

      const service = createJWTAuthService()
      const result = await service.revokeToken(mockApiUrl, 'access', 'token')

      expect(result).toBe(false)
    })

    it('should return false on network error', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

      const service = createJWTAuthService()
      const result = await service.revokeToken(mockApiUrl, 'access', 'token')

      expect(result).toBe(false)
    })
  })
})
