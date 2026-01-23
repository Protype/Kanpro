/**
 * 頭像相關工具函式
 */

/**
 * 根據名稱產生一致的背景色
 * 使用字串雜湊演算法將名稱映射到 HSL 色環上的色相值
 *
 * @param name - 使用者名稱或顯示名稱
 * @returns HSL 色彩字串，如 'hsl(120, 65%, 45%)'
 */
export function getAvatarColor(name: string): string {
  if (!name) return 'hsl(0, 0%, 50%)' // 灰色作為預設

  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash % 360)
  return `hsl(${hue}, 65%, 45%)`
}

/**
 * 取得名稱的首字母（大寫）
 *
 * @param name - 使用者名稱或顯示名稱
 * @returns 首字母大寫，如果名稱為空則回傳 '?'
 */
export function getAvatarInitial(name: string | null | undefined): string {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

/**
 * 取得使用者的顯示名稱
 * 優先使用 name，若無則使用 username
 *
 * @param user - 使用者物件，需有 name 和 username 屬性
 * @returns 顯示名稱
 */
export function getUserDisplayName(user: { name?: string | null; username?: string } | null | undefined): string {
  if (!user) return ''
  return user.name || user.username || ''
}
