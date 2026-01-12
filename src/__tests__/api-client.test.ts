import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createKanboardClient, KanboardClient, KanboardError } from '@/services/api'

describe('KanboardClient', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    mockFetch.mockReset()
  })

  describe('createKanboardClient', () => {
    it('should create a client with API URL', () => {
      const client = createKanboardClient({
        apiUrl: 'http://localhost/jsonrpc.php',
        username: 'jsonrpc',
        token: 'test-token'
      })

      expect(client).toBeDefined()
      expect(client.call).toBeDefined()
    })
  })

  describe('JSON-RPC request format', () => {
    it('should send correct JSON-RPC 2.0 request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: { id: 1, username: 'admin' }
        })
      })

      const client = createKanboardClient({
        apiUrl: 'http://localhost/jsonrpc.php',
        username: 'jsonrpc',
        token: 'test-token'
      })

      await client.call('getMe')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost/jsonrpc.php',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('"jsonrpc":"2.0"')
        })
      )

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body).toMatchObject({
        jsonrpc: '2.0',
        method: 'getMe',
        id: expect.any(Number)
      })
    })

    it('should include params when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: { id: 1, name: 'Test Project' }
        })
      })

      const client = createKanboardClient({
        apiUrl: 'http://localhost/jsonrpc.php',
        username: 'jsonrpc',
        token: 'test-token'
      })

      await client.call('getProjectById', { project_id: 1 })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.params).toEqual({ project_id: 1 })
    })
  })

  describe('HTTP Basic Authentication', () => {
    it('should include correct Authorization header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: {}
        })
      })

      const client = createKanboardClient({
        apiUrl: 'http://localhost/jsonrpc.php',
        username: 'jsonrpc',
        token: 'my-api-token'
      })

      await client.call('getMe')

      const expectedAuth = 'Basic ' + btoa('jsonrpc:my-api-token')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expectedAuth
          })
        })
      )
    })

    it('should support user credentials authentication', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: {}
        })
      })

      const client = createKanboardClient({
        apiUrl: 'http://localhost/jsonrpc.php',
        username: 'admin',
        token: 'admin-password'
      })

      await client.call('getMe')

      const expectedAuth = 'Basic ' + btoa('admin:admin-password')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expectedAuth
          })
        })
      )
    })
  })

  describe('Response handling', () => {
    it('should return result on success', async () => {
      const expectedResult = { id: 1, username: 'admin', name: 'Admin' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: expectedResult
        })
      })

      const client = createKanboardClient({
        apiUrl: 'http://localhost/jsonrpc.php',
        username: 'jsonrpc',
        token: 'test-token'
      })

      const result = await client.call('getMe')
      expect(result).toEqual(expectedResult)
    })

    it('should throw KanboardError on JSON-RPC error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          error: {
            code: -32600,
            message: 'Invalid Request'
          }
        })
      })

      const client = createKanboardClient({
        apiUrl: 'http://localhost/jsonrpc.php',
        username: 'jsonrpc',
        token: 'test-token'
      })

      try {
        await client.call('invalidMethod')
        expect.fail('Should have thrown KanboardError')
      } catch (error) {
        expect(error).toBeInstanceOf(KanboardError)
        expect(error).toMatchObject({
          code: -32600,
          message: 'Invalid Request'
        })
      }
    })
  })

  describe('Network error handling', () => {
    it('should throw on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const client = createKanboardClient({
        apiUrl: 'http://localhost/jsonrpc.php',
        username: 'jsonrpc',
        token: 'test-token'
      })

      await expect(client.call('getMe')).rejects.toThrow('Network error')
    })

    it('should throw on HTTP error status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      })

      const client = createKanboardClient({
        apiUrl: 'http://localhost/jsonrpc.php',
        username: 'jsonrpc',
        token: 'wrong-token'
      })

      await expect(client.call('getMe')).rejects.toThrow()
    })
  })
})
