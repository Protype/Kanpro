/**
 * 認證模式
 */
export type AuthMode = 'basic' | 'jwt'

/**
 * JSON-RPC 2.0 請求格式
 */
export interface JsonRpcRequest {
  jsonrpc: '2.0'
  method: string
  id: number
  params?: Record<string, unknown>
}

/**
 * JSON-RPC 2.0 成功回應格式
 */
export interface JsonRpcSuccessResponse<T = unknown> {
  jsonrpc: '2.0'
  id: number
  result: T
}

/**
 * JSON-RPC 2.0 錯誤回應格式
 */
export interface JsonRpcErrorResponse {
  jsonrpc: '2.0'
  id: number
  error: {
    code: number
    message: string
    data?: unknown
  }
}

/**
 * JSON-RPC 2.0 回應（成功或錯誤）
 */
export type JsonRpcResponse<T = unknown> = JsonRpcSuccessResponse<T> | JsonRpcErrorResponse

/**
 * Kanboard 客戶端設定（Basic Auth）
 */
export interface KanboardClientConfigBasic {
  apiUrl: string
  authMode: 'basic'
  username: string
  /** 密碼或 API Token */
  password: string
}

/**
 * Kanboard 客戶端設定（JWT）
 * 注意：Kanboard 的 JWT 認證使用 Basic Auth 格式（username:access_token）
 */
export interface KanboardClientConfigJWT {
  apiUrl: string
  authMode: 'jwt'
  /** 使用者名稱 */
  username: string
  /** JWT Access Token */
  accessToken: string
}

/**
 * Kanboard 客戶端設定（舊版兼容）
 * @deprecated 請使用 KanboardClientConfigBasic 或 KanboardClientConfigJWT
 */
export interface KanboardClientConfigLegacy {
  apiUrl: string
  username: string
  token: string
}

/**
 * Kanboard 客戶端設定
 */
export type KanboardClientConfig =
  | KanboardClientConfigBasic
  | KanboardClientConfigJWT
  | KanboardClientConfigLegacy

/**
 * Kanboard 客戶端介面
 */
export interface KanboardClient {
  call<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T>
}
