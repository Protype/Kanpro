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
   * 使用 refresh_token 換取新的 access_token
   * @param apiUrl API 端點
   * @param refreshToken refresh token
   * @returns 新的 access_token
   */
  refreshToken(apiUrl: string, refreshToken: string): Promise<string>

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
 * 建立 JWT 認證服務
 */
export function createJWTAuthService(): JWTAuthService {
  let requestId = 0

  const getNextId = () => ++requestId

  /**
   * 發送 JSON-RPC 請求（無認證）
   */
  async function callWithoutAuth<T>(
    apiUrl: string,
    method: string,
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

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
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

  /**
   * 發送 JSON-RPC 請求（Basic Auth）
   */
  async function callWithBasicAuth<T>(
    apiUrl: string,
    method: string,
    username: string,
    password: string,
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

    const credentials = btoa(`${username}:${password}`)

    const response = await fetch(apiUrl, {
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

    const json = await response.json()

    if ('error' in json) {
      throw new Error(json.error.message)
    }

    return json.result as T
  }

  /**
   * 發送 JSON-RPC 請求（Bearer Token）
   */
  async function callWithBearerToken<T>(
    apiUrl: string,
    method: string,
    accessToken: string,
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

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
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
        return await callWithBasicAuth<JWTPluginInfo>(apiUrl, 'getJWTPlugin', username, password)
      } catch {
        return null
      }
    },

    async getToken(
      apiUrl: string,
      username: string,
      password: string
    ): Promise<JWTTokenResponse> {
      return await callWithBasicAuth<JWTTokenResponse>(
        apiUrl,
        'getJWTToken',
        username,
        password
      )
    },

    async refreshToken(apiUrl: string, refreshToken: string): Promise<string> {
      const result = await callWithoutAuth<{ access_token: string }>(
        apiUrl,
        'refreshJWTToken',
        { refresh_token: refreshToken }
      )
      return result.access_token
    },

    async revokeToken(
      apiUrl: string,
      accessToken: string,
      tokenToRevoke: string
    ): Promise<boolean> {
      try {
        await callWithBearerToken(
          apiUrl,
          'revokeJWTToken',
          accessToken,
          { token: tokenToRevoke }
        )
        return true
      } catch {
        return false
      }
    }
  }
}
