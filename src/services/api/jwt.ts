/**
 * JWT 認證服務
 * 提供與 Kanboard JWTAuth 外掛的互動功能
 */

/**
 * JWT 外掛資訊
 */
export interface JWTPluginInfo {
  name: string
  version: string
  methods: string[]
}

/**
 * JWT Token 回應
 */
export interface JWTTokenResponse {
  access_token: string
  refresh_token: string
}

export type { JWTTokenResponse as TokenPair }

/**
 * JWT 認證服務介面
 */
export interface JWTAuthService {
  /**
   * 檢查 JWT 外掛是否可用
   * @param apiUrl API 端點
   * @param username 使用者名稱
   * @param password 密碼
   * @returns 外掛資訊，如果不可用則回傳 null
   */
  checkPlugin(apiUrl: string, username: string, password: string): Promise<JWTPluginInfo | null>

  /**
   * 使用帳號密碼取得 JWT token
   * @param apiUrl API 端點
   * @param username 使用者名稱
   * @param password 密碼
   * @returns JWT token（access_token + refresh_token）
   */
  getToken(apiUrl: string, username: string, password: string): Promise<JWTTokenResponse>

  /**
   * 使用 refresh_token 換取新的 token（Token Rotation）
   * @param apiUrl API 端點
   * @param username 使用者名稱
   * @param accessToken 用於認證的 access token
   * @param refreshToken refresh token
   * @returns 新的 access_token 和 refresh_token
   */
  refreshToken(apiUrl: string, username: string, accessToken: string, refreshToken: string): Promise<JWTTokenResponse>

  /**
   * 撤銷 token
   * @param apiUrl API 端點
   * @param username 使用者名稱
   * @param accessToken 用於認證的 access token
   * @param tokenToRevoke 要撤銷的 token
   * @returns 是否成功撤銷
   */
  revokeToken(apiUrl: string, username: string, accessToken: string, tokenToRevoke: string): Promise<boolean>
}

/**
 * 建立 JWT 認證服務
 */
export function createJWTAuthService(): JWTAuthService {
  let requestId = 0

  /**
   * 發送 JSON-RPC 請求
   * 使用 X-API-Auth header 進行認證，避免 401 回應觸發瀏覽器原生對話框
   * 格式：base64(username:password)
   */
  async function call<T>(
    apiUrl: string,
    method: string,
    username: string,
    password: string,
    params?: Record<string, unknown>
  ): Promise<T> {
    const request: Record<string, unknown> = {
      jsonrpc: '2.0',
      method,
      id: ++requestId
    }

    if (params) {
      request.params = params
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Auth': btoa(`${username}:${password}`)
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const json = await response.json()

    if ('error' in json) {
      throw new Error(`[${json.error.code}] ${json.error.message}`)
    }

    return json.result as T
  }

  return {
    async checkPlugin(apiUrl: string, username: string, password: string): Promise<JWTPluginInfo | null> {
      try {
        return await call<JWTPluginInfo>(apiUrl, 'getKanproBridgePlugin', username, password)
      } catch (error) {
        if (error instanceof Error) {
          // HTTP 401 或 JSON-RPC error code 401：認證失敗
          if (error.message.includes('[401]') || error.message.includes('HTTP 401')) {
            throw new Error('認證失敗：帳號或密碼錯誤')
          }
          // JSON-RPC error code -32600：無效請求格式（header 格式錯誤）
          if (error.message.includes('[-32600]')) {
            throw new Error('認證格式錯誤：' + error.message.replace(/\[-?\d+\]\s*/, ''))
          }
          // JSON-RPC error code -32601：方法不存在（外掛未安裝或 JWT 未啟用）
          if (error.message.includes('[-32601]')) {
            return null
          }
        }
        throw error
      }
    },

    async getToken(apiUrl: string, username: string, password: string): Promise<JWTTokenResponse> {
      return await call<JWTTokenResponse>(apiUrl, 'getJWTToken', username, password)
    },

    async refreshToken(apiUrl: string, username: string, accessToken: string, refreshToken: string): Promise<JWTTokenResponse> {
      return await call<JWTTokenResponse>(
        apiUrl,
        'refreshJWTToken',
        username,
        accessToken,
        { refresh_token: refreshToken }
      )
    },

    async revokeToken(apiUrl: string, username: string, accessToken: string, tokenToRevoke: string): Promise<boolean> {
      try {
        await call(apiUrl, 'revokeJWTToken', username, accessToken, { token: tokenToRevoke })
        return true
      } catch {
        return false
      }
    }
  }
}
