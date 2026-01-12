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

    const credentials = btoa(`${config.username}:${config.token}`)

    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
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
