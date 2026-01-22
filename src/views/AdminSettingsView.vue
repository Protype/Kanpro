<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSystemStore } from '@/stores/system'
import { useAppConfig } from '@/composables/useAppConfig'
import { useToast } from '@/stores/toast'

const systemStore = useSystemStore()
const { configFileApiUrl, getStoredApiUrl } = useAppConfig()
const toast = useToast()

// Settings Storage Key
const SETTINGS_KEY = 'kanpro_settings'

// Local settings state
const boardRefreshInterval = ref(60)
const notificationCheckInterval = ref(300)
const enableDesktopNotifications = ref(false)

// Connection test state
const isTesting = ref(false)
const testResult = ref<{ success: boolean; latency?: number; error?: string } | null>(null)

// Available refresh intervals
const boardRefreshOptions = [
  { value: 0, label: '停用' },
  { value: 30, label: '30 秒' },
  { value: 60, label: '1 分鐘' },
  { value: 120, label: '2 分鐘' },
  { value: 300, label: '5 分鐘' }
]

const notificationCheckOptions = [
  { value: 0, label: '停用' },
  { value: 60, label: '1 分鐘' },
  { value: 300, label: '5 分鐘' },
  { value: 600, label: '10 分鐘' },
  { value: 1800, label: '30 分鐘' }
]

// 取得原始配置的 API URL
function getOriginalApiUrl(): string {
  const stored = getStoredApiUrl()
  if (stored) return stored
  if (configFileApiUrl.value) return configFileApiUrl.value
  return '-'
}

// Load settings from localStorage
function loadSettings(): void {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (saved) {
      const settings = JSON.parse(saved)
      boardRefreshInterval.value = settings.boardRefreshInterval ?? 60
      notificationCheckInterval.value = settings.notificationCheckInterval ?? 300
      enableDesktopNotifications.value = settings.enableDesktopNotifications ?? false
    }
  } catch {
    // Use defaults
  }
}

// Save settings to localStorage
function saveSettings(): void {
  const settings = {
    boardRefreshInterval: boardRefreshInterval.value,
    notificationCheckInterval: notificationCheckInterval.value,
    enableDesktopNotifications: enableDesktopNotifications.value
  }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  toast.success('設定已儲存')
}

// Test API connection
async function testConnection(): Promise<void> {
  isTesting.value = true
  testResult.value = null

  const result = await systemStore.testConnection()
  testResult.value = result
  isTesting.value = false

  if (result.success) {
    toast.success('連線成功', `延遲：${result.latency}ms`)
  } else {
    toast.error('連線失敗', result.error || '無法連線到伺服器')
  }
}

// Request notification permission
async function requestNotificationPermission(): Promise<void> {
  if (!('Notification' in window)) {
    toast.error('不支援', '此瀏覽器不支援桌面通知')
    enableDesktopNotifications.value = false
    return
  }

  if (Notification.permission === 'denied') {
    toast.error('權限被拒', '請在瀏覽器設定中允許通知')
    enableDesktopNotifications.value = false
    return
  }

  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      enableDesktopNotifications.value = false
      return
    }
  }

  saveSettings()
}

// Handle notification toggle
function handleNotificationToggle(): void {
  if (enableDesktopNotifications.value) {
    requestNotificationPermission()
  } else {
    saveSettings()
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<template>
  <div class="h-full flex flex-col bg-surface-secondary">
    <main class="flex-1 p-4 overflow-auto">
      <!-- Two Column Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Left Column: Connection Settings -->
        <div class="card overflow-hidden">
          <div class="px-4 py-3 bg-surface-secondary border-b border-edge">
            <h2 class="text-sm font-semibold text-content-secondary uppercase tracking-wide">
              連線設定
            </h2>
          </div>
          <div class="p-4 space-y-4">
            <!-- API URL -->
            <div>
              <label class="block text-sm font-medium text-content-secondary mb-2">
                API 位址
              </label>
              <div class="flex gap-2">
                <input
                  type="text"
                  :value="getOriginalApiUrl()"
                  readonly
                  class="input flex-1 bg-surface-secondary cursor-not-allowed font-mono text-sm"
                  title="API 位址由登入時設定"
                />
                <button
                  @click="testConnection"
                  :disabled="isTesting"
                  class="btn-secondary whitespace-nowrap"
                >
                  <ph-icon
                    :icon="isTesting ? 'spinner' : 'plugs-connected'"
                    :class="['w-4 h-4 mr-1.5', isTesting && 'animate-spin']"
                  />
                  測試
                </button>
              </div>
              <p class="mt-1.5 text-xs text-content-tertiary">
                API 位址在登入時設定，如需變更請重新登入
              </p>
            </div>

            <!-- Connection Test Result -->
            <div v-if="testResult">
              <div
                :class="[
                  'p-3 rounded-md flex items-center gap-2',
                  testResult.success
                    ? 'bg-success/10 border border-success/20'
                    : 'bg-error/10 border border-error/20'
                ]"
              >
                <ph-icon
                  :icon="testResult.success ? 'check-circle' : 'x-circle'"
                  :class="['w-5 h-5', testResult.success ? 'text-success' : 'text-error']"
                />
                <span :class="['text-sm font-medium', testResult.success ? 'text-success' : 'text-error']">
                  {{ testResult.success ? `連線成功 (${testResult.latency}ms)` : '連線失敗' }}
                </span>
                <span v-if="testResult.error" class="text-sm text-error ml-2">
                  {{ testResult.error }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Desktop Notifications -->
        <div class="card overflow-hidden">
          <div class="px-4 py-3 bg-surface-secondary border-b border-edge">
            <h2 class="text-sm font-semibold text-content-secondary uppercase tracking-wide">
              桌面通知
            </h2>
          </div>
          <div class="p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-content">啟用桌面通知</p>
                <p class="text-xs text-content-tertiary mt-0.5">
                  接收任務指派、評論、到期提醒的桌面推播
                </p>
              </div>
              <button
                @click="enableDesktopNotifications = !enableDesktopNotifications; handleNotificationToggle()"
                :class="[
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  enableDesktopNotifications ? 'bg-accent' : 'bg-surface-tertiary'
                ]"
                role="switch"
                :aria-checked="enableDesktopNotifications"
              >
                <span
                  :class="[
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm',
                    enableDesktopNotifications ? 'translate-x-6' : 'translate-x-1'
                  ]"
                />
              </button>
            </div>
          </div>
          <div class="px-4 py-3 bg-surface-secondary border-t border-edge">
            <p class="text-xs text-content-tertiary">
              <ph-icon icon="info" class="w-3.5 h-3.5 inline mr-1" />
              桌面通知需要瀏覽器權限，首次啟用時會要求授權
            </p>
          </div>
        </div>
      </div>

      <!-- Auto Refresh Settings (Full Width) -->
      <div class="card overflow-hidden mt-4">
        <div class="px-4 py-3 bg-surface-secondary border-b border-edge">
          <h2 class="text-sm font-semibold text-content-secondary uppercase tracking-wide">
            自動更新
          </h2>
        </div>
        <table class="table">
          <tbody class="divide-y divide-edge">
            <tr class="table-row">
              <td class="table-cell">
                <div>
                  <p class="font-medium text-content">看板與任務列表</p>
                  <p class="text-xs text-content-tertiary mt-0.5">
                    自動刷新看板和任務列表的資料
                  </p>
                </div>
              </td>
              <td class="table-cell w-48">
                <select
                  v-model="boardRefreshInterval"
                  @change="saveSettings"
                  class="select"
                >
                  <option
                    v-for="option in boardRefreshOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </td>
            </tr>
            <tr class="table-row">
              <td class="table-cell">
                <div>
                  <p class="font-medium text-content">系統通知檢查</p>
                  <p class="text-xs text-content-tertiary mt-0.5">
                    檢查新通知的頻率（任務指派、評論、到期提醒等）
                  </p>
                </div>
              </td>
              <td class="table-cell w-48">
                <select
                  v-model="notificationCheckInterval"
                  @change="saveSettings"
                  class="select"
                >
                  <option
                    v-for="option in notificationCheckOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="px-4 py-3 bg-surface-secondary border-t border-edge">
          <p class="text-xs text-content-tertiary">
            <ph-icon icon="info" class="w-3.5 h-3.5 inline mr-1" />
            自動更新僅在頁面可見時運作，切換到其他分頁時會暫停以節省資源
          </p>
        </div>
      </div>
    </main>
  </div>
</template>
