<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSystemStore } from '@/stores/system'
import { useAppConfig } from '@/composables/useAppConfig'
import { useToast } from '@/stores/toast'

const { t } = useI18n()
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
const boardRefreshOptions = computed(() => [
  { value: 0, label: t('settings.disabled') },
  { value: 30, label: t('settings.seconds', { n: 30 }) },
  { value: 60, label: t('settings.minute', { n: 1 }) },
  { value: 120, label: t('settings.minutes', { n: 2 }) },
  { value: 300, label: t('settings.minutes', { n: 5 }) }
])

const notificationCheckOptions = computed(() => [
  { value: 0, label: t('settings.disabled') },
  { value: 5, label: t('settings.seconds', { n: 5 }) },
  { value: 10, label: t('settings.seconds', { n: 10 }) },
  { value: 30, label: t('settings.seconds', { n: 30 }) },
  { value: 60, label: t('settings.minute', { n: 1 }) },
  { value: 300, label: t('settings.minutes', { n: 5 }) },
  { value: 600, label: t('settings.minutes', { n: 10 }) }
])

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
  toast.success(t('settings.saved'))
}

// Test API connection
async function testConnection(): Promise<void> {
  isTesting.value = true
  testResult.value = null

  const result = await systemStore.testConnection()
  testResult.value = result
  isTesting.value = false

  if (result.success) {
    toast.success(t('settings.connectionSuccess'), t('settings.latency', { ms: result.latency }))
  } else {
    toast.error(t('settings.connectionFailed'), result.error || t('settings.cannotConnect'))
  }
}

// Request notification permission
async function requestNotificationPermission(): Promise<void> {
  if (!('Notification' in window)) {
    toast.error(t('settings.notSupported'), t('settings.browserNotSupport'))
    enableDesktopNotifications.value = false
    return
  }

  if (Notification.permission === 'denied') {
    toast.error(t('settings.permissionDenied'), t('settings.allowInBrowserSettings'))
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
              {{ t('settings.connectionSettings') }}
            </h2>
          </div>
          <div class="p-4 space-y-4">
            <!-- API URL -->
            <div>
              <label class="block text-sm font-medium text-content-secondary mb-2">
                {{ t('settings.apiUrl') }}
              </label>
              <div class="flex gap-2">
                <input
                  type="text"
                  :value="getOriginalApiUrl()"
                  readonly
                  class="input flex-1 bg-surface-secondary cursor-not-allowed font-mono text-sm"
                  :title="t('settings.apiUrlSetOnLogin')"
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
                  {{ t('settings.test') }}
                </button>
              </div>
              <p class="mt-1.5 text-xs text-content-tertiary">
                {{ t('settings.apiUrlHint') }}
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
                  {{ testResult.success ? t('settings.connectionSuccessWithLatency', { ms: testResult.latency }) : t('settings.connectionFailed') }}
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
              {{ t('settings.desktopNotifications') }}
            </h2>
          </div>
          <div class="p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-content">{{ t('settings.enableDesktopNotifications') }}</p>
                <p class="text-xs text-content-tertiary mt-0.5">
                  {{ t('settings.desktopNotificationsDesc') }}
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
              {{ t('settings.notificationPermissionHint') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Auto Refresh Settings (Full Width) -->
      <div class="card overflow-hidden mt-4">
        <div class="px-4 py-3 bg-surface-secondary border-b border-edge">
          <h2 class="text-sm font-semibold text-content-secondary uppercase tracking-wide">
            {{ t('settings.autoRefresh') }}
          </h2>
        </div>
        <table class="table">
          <tbody class="divide-y divide-edge">
            <tr class="table-row">
              <td class="table-cell">
                <div>
                  <p class="font-medium text-content">{{ t('settings.boardAndTaskList') }}</p>
                  <p class="text-xs text-content-tertiary mt-0.5">
                    {{ t('settings.boardRefreshDesc') }}
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
                  <p class="font-medium text-content">{{ t('settings.notificationCheck') }}</p>
                  <p class="text-xs text-content-tertiary mt-0.5">
                    {{ t('settings.notificationCheckDesc') }}
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
        <div class="px-4 py-3 bg-surface-secondary border-t border-edge space-y-1">
          <p class="text-xs text-content-tertiary">
            <ph-icon icon="info" class="w-3.5 h-3.5 inline mr-1" />
            {{ t('settings.boardRefreshHint') }}
          </p>
          <p class="text-xs text-content-tertiary">
            <ph-icon icon="bell" class="w-3.5 h-3.5 inline mr-1" />
            {{ t('settings.notificationCheckHint') }}
          </p>
        </div>
      </div>
    </main>
  </div>
</template>
