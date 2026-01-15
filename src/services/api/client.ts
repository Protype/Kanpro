import type {
  KanboardClient,
  KanboardClientConfig,
  JsonRpcRequest,
  JsonRpcResponse
} from './types'

/**
 * Kanboard API 錯誤
 */
export class KanboardError extends Error {
  public readonly code: number
  public readonly data?: unknown

  constructor(code: number, message: string, data?: unknown) {
    super(message)
    this.name = 'KanboardError'
    this.code = code
    this.data = data
  }
}

/**
 * 判斷是否為舊版配置格式
 */
function isLegacyConfig(config: KanboardClientConfig): config is { apiUrl: string; username: string; token: string } {
  return 'token' in config && 'username' in config && !('authMode' in config)
}

/**
 * 取得認證標頭
 */
function getAuthHeader(config: KanboardClientConfig): string {
  // JWT 模式
  if ('authMode' in config && config.authMode === 'jwt') {
    return `Bearer ${config.accessToken}`
  }

  // Basic Auth 模式（新格式）
  if ('authMode' in config && config.authMode === 'basic') {
    const credentials = btoa(`${config.username}:${config.password}`)
    return `Basic ${credentials}`
  }

  // 舊版兼容（Legacy）
  if (isLegacyConfig(config)) {
    const credentials = btoa(`${config.username}:${config.token}`)
    return `Basic ${credentials}`
  }

  throw new Error('Invalid client configuration')
}

/**
 * 建立 Kanboard JSON-RPC 2.0 客戶端
 */
export function createKanboardClient(config: KanboardClientConfig): KanboardClient {
  let requestId = 0

  const getNextId = () => ++requestId

  const call = async <T = unknown>(
    method: string,
    params?: Record<string, unknown>
  ): Promise<T> => {
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      method,
      id: getNextId()
    }

    if (params) {
      request.params = params
    }

    const authHeader = getAuthHeader(config)

    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const jsonResponse = await response.json() as JsonRpcResponse<T>

    if ('error' in jsonResponse) {
      throw new KanboardError(
        jsonResponse.error.code,
        jsonResponse.error.message,
        jsonResponse.error.data
      )
    }

    return jsonResponse.result
  }

  return { call }
}
