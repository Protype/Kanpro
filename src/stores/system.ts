import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'

/**
 * KanproBridge 外掛狀態
 */
export interface KanproBridgeStatus {
  name: string
  version: string
  description?: string
  methods: string[]
}

/**
 * KanproBridge 模組定義
 */
export interface BridgeModule {
  id: string
  name: string
  description: string
  methods: string[]  // 模組需要的 API 方法
}

/**
 * 預定義的 KanproBridge 模組清單
 */
export const BRIDGE_MODULES: BridgeModule[] = [
  {
    id: 'jwt',
    name: 'JWT 認證',
    description: '登入驗證、Token 管理',
    methods: ['getJWTToken', 'refreshJWTToken', 'revokeJWTToken']
  },
  {
    id: 'avatar',
    name: '使用者頭像',
    description: '頭像上傳與顯示',
    methods: ['uploadUserAvatar', 'getUserAvatar', 'removeUserAvatar']
  },
  {
    id: 'metadata',
    name: '使用者元資料',
    description: '偏好設定儲存',
    methods: ['getUserMetadata', 'getUserMetadataByName', 'saveUserMetadata', 'removeUserMetadata']
  },
  {
    id: 'password',
    name: '密碼管理',
    description: '密碼變更功能',
    methods: ['changeUserPassword', 'resetUserPassword']
  },
  {
    id: 'profile',
    name: '使用者設定檔',
    description: '個人資料編輯',
    methods: ['getUserProfile', 'updateUserProfile']
  }
]

export const useSystemStore = defineStore('system', () => {
  // === Kanboard 伺服器狀態 ===
  const kanboardVersion = ref<string | null>(null)
  const kanboardTimezone = ref<string | null>(null)
  const apiLatency = ref<number | null>(null)
  const connectionStatus = ref<'connected' | 'disconnected' | 'checking'>('checking')

  // === KanproBridge 狀態 ===
  const bridgeStatus = ref<KanproBridgeStatus | null>(null)
  const bridgeError = ref<string | null>(null)

  // === 載入狀態 ===
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // === 計算屬性 ===

  /**
   * 取得 API URL（從 auth store）
   */
  const apiUrl = computed(() => {
    const authStore = useAuthStore()
    return authStore.apiUrl
  })

  /**
   * 檢查模組是否啟用
   */
  function isModuleEnabled(moduleId: string): boolean {
    if (!bridgeStatus.value) return false
    if (!bridgeStatus.value.methods) return false

    const module = BRIDGE_MODULES.find(m => m.id === moduleId)
    if (!module) return false

    // 檢查模組所需的所有方法是否都存在
    return module.methods.every(method =>
      bridgeStatus.value!.methods.includes(method)
    )
  }

  /**
   * 取得模組狀態列表
   */
  const moduleStatuses = computed(() => {
    return BRIDGE_MODULES.map(module => ({
      ...module,
      enabled: isModuleEnabled(module.id)
    }))
  })

  // === 方法 ===

  /**
   * 載入 Kanboard 伺服器資訊
   */
  async function fetchKanboardInfo(): Promise<void> {
    const authStore = useAuthStore()

    connectionStatus.value = 'checking'

    try {
      const client = authStore.getClient()

      // 測量 API 延遲
      const startTime = performance.now()
      const version = await client.call<string>('getVersion')
      const endTime = performance.now()

      apiLatency.value = Math.round(endTime - startTime)
      kanboardVersion.value = version
      connectionStatus.value = 'connected'

      // 取得時區
      const timezone = await client.call<string>('getTimezone')
      kanboardTimezone.value = timezone
    } catch (err) {
      connectionStatus.value = 'disconnected'
      error.value = err instanceof Error ? err.message : '無法連線到 Kanboard 伺服器'
    }
  }

  /**
   * 載入 KanproBridge 外掛狀態
   */
  async function fetchBridgeStatus(): Promise<void> {
    const authStore = useAuthStore()

    bridgeError.value = null

    try {
      const client = authStore.getClient()
      const status = await client.call<KanproBridgeStatus>('getKanproBridgeStatus')
      bridgeStatus.value = status
    } catch (err) {
      bridgeError.value = err instanceof Error ? err.message : '無法取得 KanproBridge 狀態'
      bridgeStatus.value = null
    }
  }

  /**
   * 載入所有系統資訊
   */
  async function fetchAll(): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      await Promise.all([
        fetchKanboardInfo(),
        fetchBridgeStatus()
      ])
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 測試 API 連線
   */
  async function testConnection(): Promise<{ success: boolean; latency?: number; error?: string }> {
    const authStore = useAuthStore()

    try {
      const client = authStore.getClient()
      const startTime = performance.now()
      await client.call<string>('getVersion')
      const endTime = performance.now()
      const latency = Math.round(endTime - startTime)

      return { success: true, latency }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : '連線失敗'
      }
    }
  }

  /**
   * 重置狀態
   */
  function $reset(): void {
    kanboardVersion.value = null
    kanboardTimezone.value = null
    apiLatency.value = null
    connectionStatus.value = 'checking'
    bridgeStatus.value = null
    bridgeError.value = null
    isLoading.value = false
    error.value = null
  }

  return {
    // 狀態
    kanboardVersion,
    kanboardTimezone,
    apiLatency,
    connectionStatus,
    bridgeStatus,
    bridgeError,
    isLoading,
    error,

    // 計算屬性
    apiUrl,
    moduleStatuses,

    // 方法
    isModuleEnabled,
    fetchKanboardInfo,
    fetchBridgeStatus,
    fetchAll,
    testConnection,
    $reset
  }
})
