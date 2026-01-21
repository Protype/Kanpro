import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createKanboardClient, createJWTAuthService } from '@/services/api'
import type { JWTTokenResponse } from '@/services/api/jwt'
import { parseJWTPayload, isTokenExpiringSoon } from '@/utils/jwt'
import type { User } from '@/types'

const STORAGE_KEY = 'kanpro_auth'
const TOKEN_REFRESH_THRESHOLD = 300 // 5 分鐘

interface LoginCredentials {
  apiUrl: string
  username: string
  password: string
  rememberMe?: boolean
}

/**
 * 儲存的認證資料（純 JWT 模式）
 */
interface SavedCredentials {
  apiUrl: string
  username: string
  accessToken: string
  refreshToken: string
  tokenExpiresAt: number
  autoRefresh: boolean  // 是否自動刷新 token（由「記住我」控制）
}

export const useAuthStore = defineStore('auth', () => {
  // === 基本狀態 ===
  const user = ref<User | null>(null)
  const apiUrl = ref('')
  const username = ref('')

  // === JWT 狀態 ===
  const accessToken = ref('')
  const refreshToken = ref('')
  const tokenExpiresAt = ref(0)
  const autoRefresh = ref(true)  // 是否自動刷新 token

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

  // 舊版兼容：token 屬性（指向 accessToken）
  const token = computed(() => accessToken.value)

  // === 私有方法 ===

  /**
   * 儲存認證資料到 localStorage
   */
  function saveCredentials(): void {
    const credentials: SavedCredentials = {
      apiUrl: apiUrl.value,
      username: username.value,
      accessToken: accessToken.value,
      refreshToken: refreshToken.value,
      tokenExpiresAt: tokenExpiresAt.value,
      autoRefresh: autoRefresh.value
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials))
  }

  /**
   * 清除所有狀態
   */
  function clearState(): void {
    user.value = null
    apiUrl.value = ''
    username.value = ''
    accessToken.value = ''
    refreshToken.value = ''
    tokenExpiresAt.value = 0
    autoRefresh.value = true
    isSessionLocked.value = false
  }

  /**
   * 從 Token 回應更新狀態
   * @returns 解析後的過期時間
   */
  function updateTokenState(tokenResponse: JWTTokenResponse): number {
    const payload = parseJWTPayload(tokenResponse.access_token)
    const expiresAt = payload.exp ?? 0

    accessToken.value = tokenResponse.access_token
    refreshToken.value = tokenResponse.refresh_token
    tokenExpiresAt.value = expiresAt

    return expiresAt
  }

  // === 公開方法 ===

  /**
   * 登入（純 JWT 模式）
   * 若 JWT 外掛未安裝，拋出錯誤並提供安裝說明
   */
  async function login(credentials: LoginCredentials): Promise<void> {
    // 檢查 JWT 外掛是否可用
    const pluginInfo = await jwtService.checkPlugin(
      credentials.apiUrl,
      credentials.username,
      credentials.password
    )

    if (!pluginInfo) {
      throw new Error(
        'KanproBridge 外掛未安裝或 JWT 功能未啟用。\n' +
        '請在 Kanboard 伺服器上安裝 KanproBridge 外掛並啟用 JWT Authentication：\n' +
        'https://github.com/Protype/Kanboard-Plugin-KanproBridge'
      )
    }

    // 取得 JWT token
    const tokenResponse = await jwtService.getToken(
      credentials.apiUrl,
      credentials.username,
      credentials.password
    )

    // 使用 JWT 驗證身份
    const client = createKanboardClient({
      apiUrl: credentials.apiUrl,
      authMode: 'jwt',
      username: credentials.username,
      accessToken: tokenResponse.access_token
    })

    const result = await client.call<User>('getMe')

    // 更新狀態
    user.value = result
    apiUrl.value = credentials.apiUrl
    username.value = credentials.username
    updateTokenState(tokenResponse)
    autoRefresh.value = credentials.rememberMe ?? false

    // 永遠保存 session
    saveCredentials()
  }

  /**
   * 登出
   * 注意：撤銷順序很重要 - 必須先撤銷 refresh token，再撤銷 access token
   * 因為撤銷 access token 後，該 token 就無法再用於認證其他 API 請求
   */
  async function logout(): Promise<void> {
    // 撤銷 token（順序重要！）
    if (accessToken.value) {
      try {
        // 先撤銷 refresh token（此時 access token 仍有效可用於認證）
        if (refreshToken.value) {
          await jwtService.revokeToken(
            apiUrl.value,
            username.value,
            accessToken.value,
            refreshToken.value
          )
        }
        // 最後才撤銷 access token
        await jwtService.revokeToken(
          apiUrl.value,
          username.value,
          accessToken.value,
          accessToken.value
        )
      } catch {
        // 撤銷失敗不影響登出
      }
    }

    // 重置所有相關 store（延遲導入避免循環依賴）
    const { useProjectsStore } = await import('./projects')
    const { useSidebarStore } = await import('./sidebar')
    const { useBoardStore } = await import('./board')
    const { useTasksStore } = await import('./tasks')

    useProjectsStore().$reset()
    useSidebarStore().$reset()
    useBoardStore().$reset()
    useTasksStore().$reset()

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

      // 驗證必要欄位
      if (!credentials.accessToken || !credentials.refreshToken) {
        localStorage.removeItem(STORAGE_KEY)
        return false
      }

      // 檢查 token 是否過期
      const now = Math.floor(Date.now() / 1000)
      const isExpired = credentials.tokenExpiresAt && credentials.tokenExpiresAt < now

      if (isExpired) {
        // 如果 autoRefresh 為 false，token 過期就不還原 session
        if (credentials.autoRefresh === false) {
          localStorage.removeItem(STORAGE_KEY)
          return false
        }

        // Token 已過期，嘗試使用 refresh token
        try {
          const newTokens = await jwtService.refreshToken(
            credentials.apiUrl,
            credentials.username,
            credentials.accessToken,
            credentials.refreshToken
          )
          const payload = parseJWTPayload(newTokens.access_token)
          credentials.accessToken = newTokens.access_token
          credentials.refreshToken = newTokens.refresh_token
          credentials.tokenExpiresAt = payload.exp ?? 0
        } catch {
          localStorage.removeItem(STORAGE_KEY)
          return false
        }
      }

      // 驗證 token 有效性
      const client = createKanboardClient({
        apiUrl: credentials.apiUrl,
        authMode: 'jwt',
        username: credentials.username,
        accessToken: credentials.accessToken
      })

      const result = await client.call<User>('getMe')

      // 恢復狀態
      user.value = result
      apiUrl.value = credentials.apiUrl
      username.value = credentials.username
      accessToken.value = credentials.accessToken
      refreshToken.value = credentials.refreshToken
      tokenExpiresAt.value = credentials.tokenExpiresAt
      autoRefresh.value = credentials.autoRefresh ?? true

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
    if (!refreshToken.value) return false

    try {
      const newTokens = await jwtService.refreshToken(
        apiUrl.value,
        username.value,
        accessToken.value,
        refreshToken.value
      )

      updateTokenState(newTokens)
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
    if (isTokenExpiringSoon(accessToken.value, TOKEN_REFRESH_THRESHOLD)) {
      // 如果 autoRefresh 為 false，不自動刷新，改為要求重新認證
      if (!autoRefresh.value) {
        return false
      }
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

    // 重新取得 token
    const tokenResponse = await jwtService.getToken(
      apiUrl.value,
      username.value,
      password
    )

    updateTokenState(tokenResponse)
    saveCredentials()

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

    if (!accessToken.value) {
      throw new Error('No access token')
    }

    return createKanboardClient({
      apiUrl: apiUrl.value,
      authMode: 'jwt',
      username: username.value,
      accessToken: accessToken.value
    })
  }

  interface UpdateUserParams {
    name?: string
    email?: string
  }

  interface AvatarResponse {
    imageData: string | null
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
    if (!valid) {
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
   * 取得當前使用者頭像
   */
  async function getAvatar(): Promise<string | null> {
    if (!user.value) {
      throw new Error('Not authenticated')
    }

    const valid = await ensureValidToken()
    if (!valid) {
      const reauthed = await requireReauth()
      if (!reauthed) {
        throw new Error('Authentication required')
      }
    }

    const client = getClient()

    try {
      const result = await client.call<AvatarResponse>('getUserAvatar', {
        userId: user.value.id
      })
      return result?.imageData ?? null
    } catch (error) {
      // 如果頭像功能未啟用或沒有頭像，回傳 null
      if (error instanceof Error && error.message.includes('-32601')) {
        return null
      }
      throw error
    }
  }

  /**
   * 上傳當前使用者頭像
   * @param imageData Base64 編碼的圖片資料（PNG/JPG/GIF）
   */
  async function uploadAvatar(imageData: string): Promise<boolean> {
    if (!user.value) {
      throw new Error('Not authenticated')
    }

    const valid = await ensureValidToken()
    if (!valid) {
      const reauthed = await requireReauth()
      if (!reauthed) {
        throw new Error('Authentication required')
      }
    }

    const client = getClient()

    const result = await client.call<boolean>('uploadUserAvatar', {
      userId: user.value.id,
      imageData
    })

    return result
  }

  /**
   * 移除當前使用者頭像
   */
  async function removeAvatar(): Promise<boolean> {
    if (!user.value) {
      throw new Error('Not authenticated')
    }

    const valid = await ensureValidToken()
    if (!valid) {
      const reauthed = await requireReauth()
      if (!reauthed) {
        throw new Error('Authentication required')
      }
    }

    const client = getClient()

    const result = await client.call<boolean>('removeUserAvatar', {
      userId: user.value.id
    })

    return result
  }

  /**
   * 設置測試用認證狀態
   * 僅供測試使用
   */
  function _setTestCredentials(credentials: {
    apiUrl: string
    username: string
    password?: string  // 舊版相容：會被當作 accessToken
    accessToken?: string
    refreshToken?: string
  }): void {
    apiUrl.value = credentials.apiUrl
    username.value = credentials.username
    // 舊版相容：password 會被當作 accessToken
    accessToken.value = credentials.accessToken ?? credentials.password ?? ''
    refreshToken.value = credentials.refreshToken ?? ''
  }

  return {
    // 狀態
    user,
    apiUrl,
    username,
    token,
    accessToken,
    refreshToken,
    tokenExpiresAt,
    autoRefresh,
    isSessionLocked,

    // 計算屬性
    isAuthenticated,

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
    getAvatar,
    uploadAvatar,
    removeAvatar,

    // 測試用
    _setTestCredentials
  }
})
