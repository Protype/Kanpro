/**
 * JWT 工具函式
 * 用於解析 JWT token 並檢查過期狀態
 */

/**
 * JWT Payload 基本欄位
 */
export interface JWTPayload {
  /** 主體（通常是使用者 ID） */
  sub?: string
  /** 過期時間（Unix timestamp） */
  exp?: number
  /** 發行時間（Unix timestamp） */
  iat?: number
  /** 其他自訂欄位 */
  [key: string]: unknown
}

/**
 * 解析 JWT token 的 payload
 * @param token JWT token 字串
 * @returns 解析後的 payload 物件
 * @throws 如果 token 格式無效
 */
export function parseJWTPayload(token: string): JWTPayload {
  const parts = token.split('.')

  if (parts.length !== 3) {
    throw new Error('Invalid JWT format: token must have 3 parts')
  }

  const payloadBase64 = parts[1]

  try {
    // Base64url 解碼（處理 URL 安全字元）
    const base64 = payloadBase64
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const jsonString = atob(base64)
    const payload = JSON.parse(jsonString)

    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Invalid JWT payload: must be an object')
    }

    return payload as JWTPayload
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JWT payload: not valid JSON')
    }
    throw error
  }
}

/**
 * 檢查 JWT token 是否已過期
 * @param token JWT token 字串
 * @returns true 如果已過期，false 如果仍有效
 */
export function isTokenExpired(token: string): boolean {
  const payload = parseJWTPayload(token)

  if (!payload.exp) {
    // 沒有 exp 欄位，視為永不過期
    return false
  }

  const now = Math.floor(Date.now() / 1000)
  return payload.exp <= now
}

/**
 * 檢查 JWT token 是否即將過期
 * @param token JWT token 字串
 * @param thresholdSeconds 閾值秒數（預設 300 秒 = 5 分鐘）
 * @returns true 如果在閾值時間內即將過期
 */
export function isTokenExpiringSoon(token: string, thresholdSeconds = 300): boolean {
  const payload = parseJWTPayload(token)

  if (!payload.exp) {
    return false
  }

  const now = Math.floor(Date.now() / 1000)
  return (payload.exp - now) < thresholdSeconds
}

/**
 * 取得 JWT token 的過期時間
 * @param token JWT token 字串
 * @returns 過期時間（Unix timestamp），如果沒有 exp 欄位則回傳 0
 */
export function getTokenExpirationTime(token: string): number {
  const payload = parseJWTPayload(token)
  return payload.exp ?? 0
}
