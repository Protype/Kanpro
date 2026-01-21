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
 * 從配置取得認證密鑰
 * 注意：Kanboard 的 JWT 認證使用 X-API-Auth 格式（username:access_token）
 */
function getAuthSecret(config: KanboardClientConfig): string {
  if ('authMode' in config) {
    if (config.authMode === 'jwt') return config.accessToken
    if (config.authMode === 'basic') return config.password
  }

  // 舊版兼容（Legacy）: 有 token 且無 authMode
  if ('token' in config && 'username' in config) {
    return config.token
  }

  throw new Error('Invalid client configuration')
}

/**
 * 取得認證標頭值
 * 使用 X-API-Auth header 格式：base64(username:password)
 * 避免 401 回應觸發瀏覽器原生認證對話框
 */
function getAuthHeaderValue(config: KanboardClientConfig): string {
  const secret = getAuthSecret(config)
  return btoa(`${config.username}:${secret}`)
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

    const authHeaderValue = getAuthHeaderValue(config)

    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Auth': authHeaderValue
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
