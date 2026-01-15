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
   * @param refreshToken refresh token
   * @returns 新的 access_token 和 refresh_token
   */
  refreshToken(apiUrl: string, refreshToken: string): Promise<JWTTokenResponse>

  /**
   * 撤銷 token
   * @param apiUrl API 端點
   * @param accessToken 用於認證的 access token
   * @param tokenToRevoke 要撤銷的 token
   * @returns 是否成功撤銷
   */
  revokeToken(apiUrl: string, accessToken: string, tokenToRevoke: string): Promise<boolean>
}

/**
 * 認證方式類型
 */
type AuthHeader =
  | { type: 'none' }
  | { type: 'basic'; username: string; password: string }
  | { type: 'bearer'; token: string }

/**
 * 建立 JWT 認證服務
 */
export function createJWTAuthService(): JWTAuthService {
  let requestId = 0

  const getNextId = () => ++requestId

  /**
   * 發送 JSON-RPC 請求（通用方法）
   */
  async function call<T>(
    apiUrl: string,
    method: string,
    auth: AuthHeader,
    params?: Record<string, unknown>
  ): Promise<T> {
    const request: Record<string, unknown> = {
      jsonrpc: '2.0',
      method,
      id: getNextId()
    }

    if (params) {
      request.params = params
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (auth.type === 'basic') {
      headers['Authorization'] = `Basic ${btoa(`${auth.username}:${auth.password}`)}`
    } else if (auth.type === 'bearer') {
      headers['Authorization'] = `Bearer ${auth.token}`
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const json = await response.json()

    if ('error' in json) {
      throw new Error(json.error.message)
    }

    return json.result as T
  }

  return {
    async checkPlugin(apiUrl: string, username: string, password: string): Promise<JWTPluginInfo | null> {
      try {
        return await call<JWTPluginInfo>(
          apiUrl,
          'getJWTPlugin',
          { type: 'basic', username, password }
        )
      } catch {
        return null
      }
    },

    async getToken(
      apiUrl: string,
      username: string,
      password: string
    ): Promise<JWTTokenResponse> {
      return await call<JWTTokenResponse>(
        apiUrl,
        'getJWTToken',
        { type: 'basic', username, password }
      )
    },

    async refreshToken(apiUrl: string, refreshToken: string): Promise<JWTTokenResponse> {
      return await call<JWTTokenResponse>(
        apiUrl,
        'refreshJWTToken',
        { type: 'none' },
        { refresh_token: refreshToken }
      )
    },

    async revokeToken(
      apiUrl: string,
      accessToken: string,
      tokenToRevoke: string
    ): Promise<boolean> {
      try {
        await call(
          apiUrl,
          'revokeJWTToken',
          { type: 'bearer', token: accessToken },
          { token: tokenToRevoke }
        )
        return true
      } catch {
        return false
      }
    }
  }
}
