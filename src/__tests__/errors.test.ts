import { describe, it, expect } from 'vitest'
import {
  AppError,
  AuthenticationError,
  NetworkError,
  ApiError,
  ValidationError,
  ErrorCode,
  getErrorMessage
} from '@/utils/errors'

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create base error with code and message', () => {
      const error = new AppError(ErrorCode.UNKNOWN, 'Unknown error')

      expect(error).toBeInstanceOf(Error)
      expect(error.name).toBe('AppError')
      expect(error.code).toBe(ErrorCode.UNKNOWN)
      expect(error.message).toBe('Unknown error')
    })
  })

  describe('AuthenticationError', () => {
    it('should create authentication error', () => {
      const error = new AuthenticationError('Invalid credentials')

      expect(error).toBeInstanceOf(AppError)
      expect(error.name).toBe('AuthenticationError')
      expect(error.code).toBe(ErrorCode.AUTHENTICATION_FAILED)
      expect(error.message).toBe('Invalid credentials')
    })

    it('should use default message when not provided', () => {
      const error = new AuthenticationError()

      expect(error.message).toBe('認證失敗')
    })
  })

  describe('NetworkError', () => {
    it('should create network error', () => {
      const error = new NetworkError('Connection timeout')

      expect(error).toBeInstanceOf(AppError)
      expect(error.name).toBe('NetworkError')
      expect(error.code).toBe(ErrorCode.NETWORK_ERROR)
    })

    it('should use default message when not provided', () => {
      const error = new NetworkError()

      expect(error.message).toBe('網路連線失敗')
    })
  })

  describe('ApiError', () => {
    it('should create API error with response data', () => {
      const error = new ApiError('API call failed', -32600, { detail: 'Invalid' })

      expect(error).toBeInstanceOf(AppError)
      expect(error.name).toBe('ApiError')
      expect(error.code).toBe(ErrorCode.API_ERROR)
      expect(error.apiCode).toBe(-32600)
      expect(error.data).toEqual({ detail: 'Invalid' })
    })
  })

  describe('ValidationError', () => {
    it('should create validation error with field info', () => {
      const error = new ValidationError('Invalid email', 'email')

      expect(error).toBeInstanceOf(AppError)
      expect(error.name).toBe('ValidationError')
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR)
      expect(error.field).toBe('email')
    })
  })
})

describe('getErrorMessage', () => {
  it('should return message for known error codes', () => {
    expect(getErrorMessage(ErrorCode.AUTHENTICATION_FAILED)).toBe('認證失敗')
    expect(getErrorMessage(ErrorCode.NETWORK_ERROR)).toBe('網路連線失敗')
    expect(getErrorMessage(ErrorCode.API_ERROR)).toBe('API 呼叫失敗')
    expect(getErrorMessage(ErrorCode.VALIDATION_ERROR)).toBe('資料驗證失敗')
  })

  it('should return default message for unknown error codes', () => {
    expect(getErrorMessage(9999 as ErrorCode)).toBe('發生未知錯誤')
  })
})
