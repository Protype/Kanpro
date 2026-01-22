/**
 * 任務相關的工具函數
 */

/**
 * 檢查任務是否已逾期
 */
export function isTaskOverdue(dateDue?: number, isActive?: boolean): boolean {
  if (!dateDue) return false
  const overdue = dateDue * 1000 < Date.now()
  // 如果有提供 isActive 參數，則同時檢查任務是否仍在進行中
  if (isActive !== undefined) {
    return overdue && isActive
  }
  return overdue
}

/**
 * 格式化日期為本地化字串
 */
export function formatTaskDate(timestamp?: number): string {
  if (!timestamp) return '-'
  return new Date(timestamp * 1000).toLocaleDateString('zh-TW')
}

/**
 * 格式化日期為簡短格式（月/日）
 */
export function formatShortDate(timestamp?: number): string {
  if (!timestamp) return ''
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString('zh-TW', {
    month: 'short',
    day: 'numeric'
  })
}

/**
 * 任務顏色 ID 對應的圓點 CSS class
 */
export const taskColorDotClasses: Record<string, string> = {
  yellow: 'bg-yellow-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  grey: 'bg-gray-500',
  cyan: 'bg-cyan-500',
  lime: 'bg-lime-500',
  pink: 'bg-pink-500',
  teal: 'bg-teal-500',
  amber: 'bg-amber-500',
  brown: 'bg-amber-700',
  deep_orange: 'bg-orange-600',
  dark_grey: 'bg-gray-600',
  light_green: 'bg-green-400',
  white: 'bg-gray-200'
}

/**
 * 取得任務顏色圓點的 CSS class
 */
export function getTaskColorDotClass(colorId: string): string {
  return taskColorDotClasses[colorId] || 'bg-yellow-500'
}

/**
 * 任務顏色 ID 對應的日曆背景 CSS class
 */
export const taskColorBgClasses: Record<string, string> = {
  yellow: 'bg-yellow-400',
  blue: 'bg-blue-400',
  green: 'bg-green-400',
  purple: 'bg-purple-400',
  red: 'bg-red-400',
  orange: 'bg-orange-400',
  grey: 'bg-gray-400',
  cyan: 'bg-cyan-400',
  lime: 'bg-lime-400',
  pink: 'bg-pink-400',
  teal: 'bg-teal-400',
  amber: 'bg-amber-400',
  brown: 'bg-amber-700',
  deep_orange: 'bg-orange-600',
  dark_grey: 'bg-gray-600',
  white: 'bg-gray-200'
}

/**
 * 取得任務顏色背景的 CSS class（用於日曆）
 */
export function getTaskColorBgClass(colorId: string): string {
  return taskColorBgClasses[colorId] || 'bg-gray-400'
}
