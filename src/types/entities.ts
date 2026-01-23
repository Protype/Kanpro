/**
 * Kanboard 群組
 */
export interface Group {
  id: number
  name: string
  external_id?: string | null
}

/**
 * Kanboard 使用者
 */
export interface User {
  id: number
  username: string
  name: string | null
  email: string | null
  role: 'app-admin' | 'app-manager' | 'app-user'
  is_active: boolean
  is_ldap_user?: boolean
  notifications_enabled?: number
  timezone?: string | null
  language?: string | null
  twofactor_activated?: boolean
  avatar_path?: string | null
}

/**
 * Kanboard 專案
 */
export interface Project {
  id: number
  name: string
  description?: string | null
  is_active: boolean | number | string  // API 可能回傳不同類型
  is_public: boolean | number | string
  is_private: boolean | number | string
  owner_id: number
  token?: string | null
  start_date?: string | null
  end_date?: string | null
  identifier?: string | null
  last_modified?: number
  // 優先級設定
  priority_default?: number
  priority_start?: number
  priority_end?: number
  // 專案 Email
  email?: string | null
}

/**
 * Kanboard 任務
 */
export interface Task {
  id: number
  title: string
  description?: string | null
  project_id: number
  column_id: number
  swimlane_id: number
  position: number
  is_active: boolean
  color_id: string
  priority: number
  owner_id: number
  creator_id: number
  date_creation: number
  date_modification: number
  date_due?: number
  date_started?: number
  date_completed?: number
  date_moved?: number
  time_estimated?: number
  time_spent?: number
  score?: number
  category_id?: number
  reference?: string | null
  external_provider?: string | null
  external_uri?: string | null
  recurrence_status?: number
  recurrence_trigger?: number
  recurrence_factor?: number
  recurrence_timeframe?: number
  recurrence_basedate?: number
  recurrence_parent?: number
  recurrence_child?: number
}

/**
 * Kanboard 欄位
 */
export interface Column {
  id: number
  title: string
  position: number
  project_id: number
  task_limit: number
  description: string
  hide_in_dashboard?: boolean
}

/**
 * Kanboard 泳道
 */
export interface Swimlane {
  id: number
  name: string
  position: number
  is_active: boolean
  project_id: number
  description?: string | null
}

/**
 * Kanboard 類別
 */
export interface Category {
  id: number
  name: string
  project_id: number
  description?: string | null
  color_id?: string | null
}

/**
 * Kanboard 子任務
 */
export interface Subtask {
  id: number
  title: string
  status: 0 | 1 | 2  // 0: 待辦, 1: 進行中, 2: 完成
  task_id: number
  user_id: number | null
  position: number
  time_estimated?: number
  time_spent?: number
}

/**
 * Kanboard 評論
 */
export interface Comment {
  id: number
  task_id: number
  user_id: number
  date_creation: number
  date_modification?: number
  comment: string
  username?: string
  name?: string
  email?: string
  avatar_path?: string
}

/**
 * Kanboard 任務檔案
 */
export interface TaskFile {
  id: number
  name: string
  path: string
  is_image: boolean
  task_id: number
  user_id: number
  date: number
  size: number
}

/**
 * Kanboard 標籤
 */
export interface Tag {
  id: number
  name: string
  project_id: number
  color_id?: string | null
}

/**
 * Kanboard 任務連結
 */
export interface TaskLink {
  id: number
  link_id: number
  task_id: number
  opposite_task_id: number
}

/**
 * Kanboard 看板資料
 */
export interface Board {
  columns: BoardColumn[]
}

export interface BoardColumn extends Column {
  tasks: Task[]
  nb_tasks: number
}

export interface BoardSwimlane extends Swimlane {
  columns: BoardColumn[]
  nb_tasks: number
}

/**
 * Kanboard 活動紀錄
 */
export interface Activity {
  id: number
  date_creation: number
  event_name: string
  creator_id: number
  project_id: number
  task_id?: number
  data?: Record<string, unknown>
  // API 回傳的額外欄位
  author_username?: string
  author_name?: string
  task?: {
    id: number
    title: string
    [key: string]: unknown
  }
}

/**
 * Kanboard 專案成員
 */
export interface ProjectMember {
  id: number
  username: string
  name: string | null
  email: string | null
  role: 'project-manager' | 'project-member' | 'project-viewer'
  is_active: boolean
  avatar?: string | null  // base64 encoded avatar image (from Kanpro Bridge)
}
