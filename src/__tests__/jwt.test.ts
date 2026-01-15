import { describe, it, expect } from 'vitest'
import {
  parseJWTPayload,
  isTokenExpired,
  isTokenExpiringSoon,
  getTokenExpirationTime
} from '@/utils/jwt'

describe('JWT Utils', () => {
  // 產生測試用 JWT token（模擬）
  // JWT 格式: header.payload.signature
  // payload 是 base64url 編碼的 JSON
  function createMockJWT(payload: Record<string, unknown>): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const payloadBase64 = btoa(JSON.stringify(payload))
    const signature = 'mock_signature'
    return `${header}.${payloadBase64}.${signature}`
  }

  describe('parseJWTPayload', () => {
    it('should parse valid JWT payload', () => {
      const now = Math.floor(Date.now() / 1000)
      const token = createMockJWT({
        sub: '123',
        exp: now + 3600,
        iat: now
      })

      const payload = parseJWTPayload(token)

      expect(payload).toEqual({
        sub: '123',
        exp: now + 3600,
        iat: now
      })
    })

    it('should handle payload with additional fields', () => {
      const now = Math.floor(Date.now() / 1000)
      const token = createMockJWT({
        sub: '456',
        exp: now + 7200,
        iat: now,
        username: 'testuser',
        role: 'admin'
      })

      const payload = parseJWTPayload(token)

      expect(payload.sub).toBe('456')
      expect(payload.username).toBe('testuser')
      expect(payload.role).toBe('admin')
    })

    it('should throw error for invalid JWT format (missing parts)', () => {
      expect(() => parseJWTPayload('invalid')).toThrow()
      expect(() => parseJWTPayload('header.payload')).toThrow()
    })

    it('should throw error for invalid base64 payload', () => {
      const invalidToken = 'header.!!!invalid!!!.signature'
      expect(() => parseJWTPayload(invalidToken)).toThrow()
    })

    it('should throw error for non-JSON payload', () => {
      const header = btoa(JSON.stringify({ alg: 'HS256' }))
      const invalidPayload = btoa('not json')
      const token = `${header}.${invalidPayload}.signature`
      expect(() => parseJWTPayload(token)).toThrow()
    })
  })

  describe('isTokenExpired', () => {
    it('should return true for expired token', () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      const token = createMockJWT({ exp: pastTime })

      expect(isTokenExpired(token)).toBe(true)
    })

    it('should return false for valid token', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      const token = createMockJWT({ exp: futureTime })

      expect(isTokenExpired(token)).toBe(false)
    })

    it('should return true for token expiring exactly now', () => {
      const now = Math.floor(Date.now() / 1000)
      const token = createMockJWT({ exp: now })

      expect(isTokenExpired(token)).toBe(true)
    })
  })

  describe('isTokenExpiringSoon', () => {
    it('should return true when token expires within threshold (default 5 minutes)', () => {
      const now = Math.floor(Date.now() / 1000)
      const token = createMockJWT({ exp: now + 200 }) // 3.3 minutes from now

      expect(isTokenExpiringSoon(token)).toBe(true)
    })

    it('should return false when token has more time than threshold', () => {
      const now = Math.floor(Date.now() / 1000)
      const token = createMockJWT({ exp: now + 600 }) // 10 minutes from now

      expect(isTokenExpiringSoon(token)).toBe(false)
    })

    it('should use custom threshold', () => {
      const now = Math.floor(Date.now() / 1000)
      const token = createMockJWT({ exp: now + 500 }) // 8.3 minutes from now

      // With 5 minute (300s) threshold - should be false
      expect(isTokenExpiringSoon(token, 300)).toBe(false)

      // With 10 minute (600s) threshold - should be true
      expect(isTokenExpiringSoon(token, 600)).toBe(true)
    })

    it('should return true for already expired token', () => {
      const pastTime = Math.floor(Date.now() / 1000) - 100
      const token = createMockJWT({ exp: pastTime })

      expect(isTokenExpiringSoon(token)).toBe(true)
    })
  })

  describe('getTokenExpirationTime', () => {
    it('should return expiration timestamp', () => {
      const expTime = Math.floor(Date.now() / 1000) + 3600
      const token = createMockJWT({ exp: expTime })

      expect(getTokenExpirationTime(token)).toBe(expTime)
    })

    it('should return 0 for token without exp claim', () => {
      const token = createMockJWT({ sub: '123' })

      expect(getTokenExpirationTime(token)).toBe(0)
    })
  })
})
