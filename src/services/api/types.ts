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
 * Kanboard 客戶端設定
 */
export interface KanboardClientConfig {
  apiUrl: string
  username: string
  token: string
}

/**
 * Kanboard 客戶端介面
 */
export interface KanboardClient {
  call<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T>
}
