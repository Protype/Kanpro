/**
 * 錯誤代碼
 */
export enum ErrorCode {
  UNKNOWN = 1000,
  AUTHENTICATION_FAILED = 1001,
  NETWORK_ERROR = 1002,
  API_ERROR = 1003,
  VALIDATION_ERROR = 1004,
  NOT_FOUND = 1005,
  PERMISSION_DENIED = 1006
}

/**
 * 錯誤訊息對照表
 */
const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.UNKNOWN]: '發生未知錯誤',
  [ErrorCode.AUTHENTICATION_FAILED]: '認證失敗',
  [ErrorCode.NETWORK_ERROR]: '網路連線失敗',
  [ErrorCode.API_ERROR]: 'API 呼叫失敗',
  [ErrorCode.VALIDATION_ERROR]: '資料驗證失敗',
  [ErrorCode.NOT_FOUND]: '找不到資源',
  [ErrorCode.PERMISSION_DENIED]: '權限不足'
}

/**
 * 取得錯誤訊息
 */
export function getErrorMessage(code: ErrorCode): string {
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES[ErrorCode.UNKNOWN]
}

/**
 * 基礎應用錯誤類別
 */
export class AppError extends Error {
  public readonly code: ErrorCode

  constructor(code: ErrorCode, message: string) {
    super(message)
    this.name = 'AppError'
    this.code = code
  }
}

/**
 * 認證錯誤
 */
export class AuthenticationError extends AppError {
  constructor(message?: string) {
    super(ErrorCode.AUTHENTICATION_FAILED, message ?? getErrorMessage(ErrorCode.AUTHENTICATION_FAILED))
    this.name = 'AuthenticationError'
  }
}

/**
 * 網路錯誤
 */
export class NetworkError extends AppError {
  constructor(message?: string) {
    super(ErrorCode.NETWORK_ERROR, message ?? getErrorMessage(ErrorCode.NETWORK_ERROR))
    this.name = 'NetworkError'
  }
}

/**
 * API 錯誤
 */
export class ApiError extends AppError {
  public readonly apiCode: number
  public readonly data?: unknown

  constructor(message: string, apiCode: number, data?: unknown) {
    super(ErrorCode.API_ERROR, message)
    this.name = 'ApiError'
    this.apiCode = apiCode
    this.data = data
  }
}

/**
 * 驗證錯誤
 */
export class ValidationError extends AppError {
  public readonly field?: string

  constructor(message: string, field?: string) {
    super(ErrorCode.VALIDATION_ERROR, message)
    this.name = 'ValidationError'
    this.field = field
  }
}

/**
 * 權限錯誤
 */
export class PermissionError extends AppError {
  constructor(message?: string) {
    super(ErrorCode.PERMISSION_DENIED, message ?? getErrorMessage(ErrorCode.PERMISSION_DENIED))
    this.name = 'PermissionError'
  }
}

/**
 * 找不到資源錯誤
 */
export class NotFoundError extends AppError {
  constructor(message?: string) {
    super(ErrorCode.NOT_FOUND, message ?? getErrorMessage(ErrorCode.NOT_FOUND))
    this.name = 'NotFoundError'
  }
}
