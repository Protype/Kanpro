import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createKanboardClient, createJWTAuthService } from '@/services/api'
import { parseJWTPayload, isTokenExpiringSoon } from '@/utils/jwt'
import type { User } from '@/types'
import type { AuthMode } from '@/services/api'

const STORAGE_KEY = 'kanpro_auth'
const TOKEN_REFRESH_THRESHOLD = 300 // 5 分鐘

interface LoginCredentials {
  apiUrl: string
  username: string
  password: string
  rememberMe?: boolean
}

/**
 * 儲存的認證資料
 * 注意：Basic Auth 模式不儲存密碼
 */
interface SavedCredentials {
  apiUrl: string
  username: string
  authMode: AuthMode
  // JWT 模式
  accessToken?: string
  refreshToken?: string
  tokenExpiresAt?: number
  // 舊版兼容（會在下次登入時轉換）
  token?: string
}

export const useAuthStore = defineStore('auth', () => {
  // === 基本狀態 ===
  const user = ref<User | null>(null)
  const apiUrl = ref('')
  const username = ref('')

  // === 認證模式 ===
  const authMode = ref<AuthMode>('basic')

  // === JWT 狀態 ===
  const accessToken = ref('')
  const refreshToken = ref('')
  const tokenExpiresAt = ref(0)

  // === 會話密碼（僅存於記憶體，不持久化）===
  const sessionPassword = ref('')

  // === 重新認證狀態 ===
  const isSessionLocked = ref(false)
  const pendingReauthResolvers = ref<Array<{
    resolve: (value: boolean) => void
    reject: (error: Error) => void
  }>>([])

  // === 服務實例 ===
  const jwtService = createJWTAuthService()

  // === 計算屬性 ===
  const isAuthenticated = computed(() => !!user.value)
  const isJWTMode = computed(() => authMode.value === 'jwt')

  // 舊版兼容：token 屬性
  const token = computed(() => {
    if (authMode.value === 'jwt') {
      return accessToken.value
    }
    return sessionPassword.value
  })

  // === 私有方法 ===

  /**
   * 儲存認證資料到 localStorage
   */
  function saveCredentials(): void {
    const credentials: SavedCredentials = {
      apiUrl: apiUrl.value,
      username: username.value,
      authMode: authMode.value
    }

    if (authMode.value === 'jwt') {
      credentials.accessToken = accessToken.value
      credentials.refreshToken = refreshToken.value
      credentials.tokenExpiresAt = tokenExpiresAt.value
    }
    // Basic Auth 模式不儲存密碼

    localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials))
  }

  /**
   * 清除所有狀態
   */
  function clearState(): void {
    user.value = null
    apiUrl.value = ''
    username.value = ''
    authMode.value = 'basic'
    accessToken.value = ''
    refreshToken.value = ''
    tokenExpiresAt.value = 0
    sessionPassword.value = ''
    isSessionLocked.value = false
  }

  // === 公開方法 ===

  /**
   * 登入
   * 自動偵測 JWT 外掛，選擇認證模式
   */
  async function login(credentials: LoginCredentials): Promise<void> {
    // 先檢查 JWT 外掛是否可用
    const pluginInfo = await jwtService.checkPlugin(
      credentials.apiUrl,
      credentials.username,
      credentials.password
    )

    if (pluginInfo) {
      // JWT 模式
      await loginWithJWT(credentials)
    } else {
      // Basic Auth 模式
      await loginWithBasicAuth(credentials)
    }
  }

  /**
   * JWT 模式登入
   */
  async function loginWithJWT(credentials: LoginCredentials): Promise<void> {
    // 取得 JWT token
    const tokenResponse = await jwtService.getToken(
      credentials.apiUrl,
      credentials.username,
      credentials.password
    )

    // 解析 token 取得過期時間
    const payload = parseJWTPayload(tokenResponse.access_token)

    // 使用 JWT 驗證身份
    const client = createKanboardClient({
      apiUrl: credentials.apiUrl,
      authMode: 'jwt',
      accessToken: tokenResponse.access_token
    })

    const result = await client.call<User>('getMe')

    // 更新狀態
    user.value = result
    apiUrl.value = credentials.apiUrl
    username.value = credentials.username
    authMode.value = 'jwt'
    accessToken.value = tokenResponse.access_token
    refreshToken.value = tokenResponse.refresh_token
    tokenExpiresAt.value = payload.exp ?? 0

    // 持久化
    if (credentials.rememberMe) {
      saveCredentials()
    }
  }

  /**
   * Basic Auth 模式登入
   */
  async function loginWithBasicAuth(credentials: LoginCredentials): Promise<void> {
    const client = createKanboardClient({
      apiUrl: credentials.apiUrl,
      authMode: 'basic',
      username: credentials.username,
      password: credentials.password
    })

    const result = await client.call<User>('getMe')

    // 更新狀態
    user.value = result
    apiUrl.value = credentials.apiUrl
    username.value = credentials.username
    authMode.value = 'basic'
    sessionPassword.value = credentials.password

    // 持久化（不儲存密碼）
    if (credentials.rememberMe) {
      saveCredentials()
    }
  }

  /**
   * 登出
   */
  async function logout(): Promise<void> {
    // JWT 模式：撤銷 token
    if (authMode.value === 'jwt' && accessToken.value) {
      try {
        await jwtService.revokeToken(
          apiUrl.value,
          accessToken.value,
          accessToken.value
        )
        // 也撤銷 refresh token
        if (refreshToken.value) {
          await jwtService.revokeToken(
            apiUrl.value,
            accessToken.value,
            refreshToken.value
          )
        }
      } catch {
        // 撤銷失敗不影響登出
      }
    }

    // 清除狀態
    clearState()

    // 清除持久化儲存
    localStorage.removeItem(STORAGE_KEY)
  }

  /**
   * 還原 Session
   */
  async function restoreSession(): Promise<boolean> {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) {
      return false
    }

    try {
      const credentials: SavedCredentials = JSON.parse(saved)

      // 舊版資料轉換
      if (credentials.token && !credentials.authMode) {
        return await restoreLegacySession(credentials)
      }

      // JWT 模式恢復
      if (credentials.authMode === 'jwt' && credentials.accessToken) {
        return await restoreJWTSession(credentials)
      }

      // Basic Auth 模式恢復（需要重新登入）
      if (credentials.authMode === 'basic') {
        // Basic Auth 無法恢復（密碼未儲存）
        // 設定 apiUrl 和 username 以便重新登入時預填
        apiUrl.value = credentials.apiUrl
        username.value = credentials.username
        return false
      }

      return false
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      return false
    }
  }

  /**
   * 恢復舊版 Session（向後兼容）
   */
  async function restoreLegacySession(credentials: SavedCredentials): Promise<boolean> {
    if (!credentials.token) return false

    try {
      const client = createKanboardClient({
        apiUrl: credentials.apiUrl,
        username: credentials.username,
        token: credentials.token
      })

      const result = await client.call<User>('getMe')

      user.value = result
      apiUrl.value = credentials.apiUrl
      username.value = credentials.username
      authMode.value = 'basic'
      sessionPassword.value = credentials.token

      return true
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      return false
    }
  }

  /**
   * 恢復 JWT Session
   */
  async function restoreJWTSession(credentials: SavedCredentials): Promise<boolean> {
    if (!credentials.accessToken) return false

    // 檢查 token 是否過期
    const now = Math.floor(Date.now() / 1000)
    if (credentials.tokenExpiresAt && credentials.tokenExpiresAt < now) {
      // Token 已過期，嘗試使用 refresh token
      if (credentials.refreshToken) {
        try {
          const newAccessToken = await jwtService.refreshToken(
            credentials.apiUrl,
            credentials.refreshToken
          )
          credentials.accessToken = newAccessToken
          const payload = parseJWTPayload(newAccessToken)
          credentials.tokenExpiresAt = payload.exp ?? 0
        } catch {
          localStorage.removeItem(STORAGE_KEY)
          return false
        }
      } else {
        localStorage.removeItem(STORAGE_KEY)
        return false
      }
    }

    // 驗證 token 有效性
    try {
      const client = createKanboardClient({
        apiUrl: credentials.apiUrl,
        authMode: 'jwt',
        accessToken: credentials.accessToken
      })

      const result = await client.call<User>('getMe')

      // 恢復狀態
      user.value = result
      apiUrl.value = credentials.apiUrl
      username.value = credentials.username
      authMode.value = 'jwt'
      accessToken.value = credentials.accessToken
      refreshToken.value = credentials.refreshToken || ''
      tokenExpiresAt.value = credentials.tokenExpiresAt || 0

      // 更新儲存
      saveCredentials()

      return true
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      return false
    }
  }

  /**
   * 刷新 Access Token
   */
  async function refreshAccessToken(): Promise<boolean> {
    if (!isJWTMode.value || !refreshToken.value) return false

    try {
      const newAccessToken = await jwtService.refreshToken(
        apiUrl.value,
        refreshToken.value
      )

      const payload = parseJWTPayload(newAccessToken)

      accessToken.value = newAccessToken
      tokenExpiresAt.value = payload.exp ?? 0

      // 更新持久化儲存
      saveCredentials()

      return true
    } catch {
      return false
    }
  }

  /**
   * 確保 Token 有效
   * 在 API 呼叫前調用
   */
  async function ensureValidToken(): Promise<boolean> {
    if (!isJWTMode.value) return true

    if (isTokenExpiringSoon(accessToken.value, TOKEN_REFRESH_THRESHOLD)) {
      return await refreshAccessToken()
    }

    return true
  }

  /**
   * 觸發重新認證
   * 當 token 失效時調用
   */
  async function requireReauth(): Promise<boolean> {
    if (isSessionLocked.value) {
      // 已經在等待重新認證，加入等待佇列
      return new Promise((resolve, reject) => {
        pendingReauthResolvers.value.push({ resolve, reject })
      })
    }

    isSessionLocked.value = true

    return new Promise((resolve, reject) => {
      pendingReauthResolvers.value.push({ resolve, reject })
    })
  }

  /**
   * 重新認證
   * 使用密碼重新取得 token
   */
  async function reauthenticate(password: string): Promise<void> {
    if (!apiUrl.value || !username.value) {
      throw new Error('Missing credentials')
    }

    if (isJWTMode.value) {
      // JWT 模式：重新取得 token
      const tokenResponse = await jwtService.getToken(
        apiUrl.value,
        username.value,
        password
      )

      const payload = parseJWTPayload(tokenResponse.access_token)

      accessToken.value = tokenResponse.access_token
      refreshToken.value = tokenResponse.refresh_token
      tokenExpiresAt.value = payload.exp ?? 0

      saveCredentials()
    } else {
      // Basic Auth 模式：驗證密碼
      const client = createKanboardClient({
        apiUrl: apiUrl.value,
        authMode: 'basic',
        username: username.value,
        password: password
      })

      await client.call<User>('getMe')
      sessionPassword.value = password
    }

    // 解除鎖定，通知所有等待者
    isSessionLocked.value = false
    pendingReauthResolvers.value.forEach(({ resolve }) => resolve(true))
    pendingReauthResolvers.value = []
  }

  /**
   * 放棄重新認證
   * 清除狀態並拒絕所有等待者
   */
  function abandonReauth(): void {
    isSessionLocked.value = false
    pendingReauthResolvers.value.forEach(({ reject }) => {
      reject(new Error('Authentication abandoned'))
    })
    pendingReauthResolvers.value = []
    clearState()
    localStorage.removeItem(STORAGE_KEY)
  }

  /**
   * 取得 API 客戶端
   */
  function getClient() {
    if (!apiUrl.value || !username.value) {
      throw new Error('Not authenticated')
    }

    if (authMode.value === 'jwt') {
      if (!accessToken.value) {
        throw new Error('No access token')
      }

      return createKanboardClient({
        apiUrl: apiUrl.value,
        authMode: 'jwt',
        accessToken: accessToken.value
      })
    }

    // Basic Auth 模式
    if (!sessionPassword.value) {
      throw new Error('Session expired, please login again')
    }

    return createKanboardClient({
      apiUrl: apiUrl.value,
      authMode: 'basic',
      username: username.value,
      password: sessionPassword.value
    })
  }

  interface UpdateUserParams {
    name?: string
    email?: string
  }

  /**
   * 更新當前使用者
   */
  async function updateCurrentUser(params: UpdateUserParams): Promise<boolean> {
    if (!user.value) {
      throw new Error('Not authenticated')
    }

    // 確保 token 有效
    const valid = await ensureValidToken()
    if (!valid && isJWTMode.value) {
      const reauthed = await requireReauth()
      if (!reauthed) {
        throw new Error('Authentication required')
      }
    }

    const client = getClient()

    const result = await client.call<boolean>('updateUser', {
      id: user.value.id,
      ...params
    })

    if (result) {
      // Refresh user data
      const updatedUser = await client.call<User>('getMe')
      user.value = updatedUser
    }

    return result
  }

  /**
   * 設置測試用認證狀態
   * 僅供測試使用
   */
  function _setTestCredentials(credentials: {
    apiUrl: string
    username: string
    password: string
    mode?: AuthMode
  }): void {
    apiUrl.value = credentials.apiUrl
    username.value = credentials.username
    sessionPassword.value = credentials.password
    authMode.value = credentials.mode ?? 'basic'
  }

  return {
    // 狀態
    user,
    apiUrl,
    username,
    token,
    authMode,
    accessToken,
    refreshToken,
    tokenExpiresAt,
    isSessionLocked,

    // 計算屬性
    isAuthenticated,
    isJWTMode,

    // 方法
    login,
    logout,
    restoreSession,
    refreshAccessToken,
    ensureValidToken,
    requireReauth,
    reauthenticate,
    abandonReauth,
    getClient,
    updateCurrentUser,

    // 測試用
    _setTestCredentials
  }
})
