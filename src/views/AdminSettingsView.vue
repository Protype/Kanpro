<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSystemStore } from '@/stores/system'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/stores/toast'

const systemStore = useSystemStore()
const authStore = useAuthStore()
const toast = useToast()

// Settings Storage Key
const SETTINGS_KEY = 'kanpro_settings'

// Local settings state
const autoRefreshInterval = ref(30)
const enableDesktopNotifications = ref(false)

// Connection test state
const isTesting = ref(false)
const testResult = ref<{ success: boolean; latency?: number; error?: string } | null>(null)

// Available refresh intervals
const refreshIntervalOptions = [
  { value: 0, label: '停用' },
  { value: 15, label: '15 秒' },
  { value: 30, label: '30 秒' },
  { value: 60, label: '1 分鐘' },
  { value: 300, label: '5 分鐘' }
]

// Load settings from localStorage
function loadSettings(): void {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (saved) {
      const settings = JSON.parse(saved)
      autoRefreshInterval.value = settings.autoRefreshInterval ?? 30
      enableDesktopNotifications.value = settings.enableDesktopNotifications ?? false
    }
  } catch {
    // Use defaults
  }
}

// Save settings to localStorage
function saveSettings(): void {
  const settings = {
    autoRefreshInterval: autoRefreshInterval.value,
    enableDesktopNotifications: enableDesktopNotifications.value
  }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  toast.success('設定已儲存', '您的偏好設定已更新')
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
  <div class="h-full overflow-auto bg-surface-secondary">
    <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Left Column: Connection Settings -->
        <div class="bg-surface rounded-lg border border-edge p-6">
          <h2 class="text-lg font-semibold text-content mb-6">連線設定</h2>

          <div class="space-y-4">
            <!-- API URL (read-only) -->
            <div>
              <label class="block text-sm font-medium text-content-secondary mb-2">
                API 位址
              </label>
              <div class="flex gap-2">
                <input
                  type="text"
                  :value="authStore.apiUrl"
                  readonly
                  class="input flex-1 bg-surface-secondary cursor-not-allowed"
                  title="API 位址由登入時設定"
                />
                <button
                  @click="testConnection"
                  :disabled="isTesting"
                  class="btn-secondary whitespace-nowrap"
                >
                  <ph-icon
                    :icon="isTesting ? 'spinner' : 'plugs-connected'"
                    :class="['w-4 h-4 mr-2', isTesting && 'animate-spin']"
                  />
                  測試連線
                </button>
              </div>
              <p class="mt-1 text-xs text-content-tertiary">
                API 位址在登入時設定，如需變更請重新登入
              </p>
            </div>

            <!-- Connection Test Result -->
            <div v-if="testResult" class="mt-4">
              <div
                :class="[
                  'p-3 rounded-md',
                  testResult.success
                    ? 'bg-success/10 border border-success/20'
                    : 'bg-error/10 border border-error/20'
                ]"
              >
                <div class="flex items-center gap-2">
                  <ph-icon
                    :icon="testResult.success ? 'check-circle' : 'x-circle'"
                    :class="['w-5 h-5', testResult.success ? 'text-success' : 'text-error']"
                  />
                  <span :class="['text-sm font-medium', testResult.success ? 'text-success' : 'text-error']">
                    {{ testResult.success ? `連線成功 (${testResult.latency}ms)` : '連線失敗' }}
                  </span>
                </div>
                <p v-if="testResult.error" class="mt-1 text-sm text-error">
                  {{ testResult.error }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Interface Settings -->
        <div class="bg-surface rounded-lg border border-edge p-6">
          <h2 class="text-lg font-semibold text-content mb-6">介面設定</h2>

          <div class="space-y-6">
            <!-- Auto Refresh Interval -->
            <div>
              <label class="block text-sm font-medium text-content-secondary mb-2">
                自動刷新間隔
              </label>
              <select
                v-model="autoRefreshInterval"
                @change="saveSettings"
                class="input"
              >
                <option
                  v-for="option in refreshIntervalOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
              <p class="mt-1 text-xs text-content-tertiary">
                設定看板與任務列表的自動刷新頻率
              </p>
            </div>

            <!-- Desktop Notifications -->
            <div class="flex items-center justify-between">
              <div>
                <label class="block text-sm font-medium text-content">
                  啟用桌面通知
                </label>
                <p class="text-xs text-content-tertiary">
                  接收任務更新與提醒的桌面推播
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
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    enableDesktopNotifications ? 'translate-x-6' : 'translate-x-1'
                  ]"
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Kanboard Settings Placeholder -->
      <div class="mt-6 bg-surface rounded-lg border border-dashed border-edge p-6">
        <div class="flex items-start gap-3">
          <ph-icon icon="gear" class="w-5 h-5 text-content-tertiary flex-shrink-0 mt-0.5" />
          <div>
            <h3 class="text-sm font-medium text-content-tertiary">Kanboard 設定</h3>
            <p class="text-sm text-content-tertiary mt-1">
              暫時保留。此區域將顯示可透過 KanproBridge 讀取/修改的伺服器設定。
            </p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
