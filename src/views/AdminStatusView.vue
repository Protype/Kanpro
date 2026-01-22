<script setup lang="ts">
import { onMounted } from 'vue'
import { useSystemStore } from '@/stores/system'
import { useAppConfig } from '@/composables/useAppConfig'

const systemStore = useSystemStore()
const { configFileApiUrl, getStoredApiUrl } = useAppConfig()

onMounted(async () => {
  await systemStore.fetchAll()
})

// 取得原始配置的 API URL（不是 normalized 的版本）
function getOriginalApiUrl(): string {
  const stored = getStoredApiUrl()
  if (stored) return stored
  if (configFileApiUrl.value) return configFileApiUrl.value
  return '-'
}

function getConnectionStatusBadge(status: string): string {
  switch (status) {
    case 'connected':
      return 'badge-success'
    case 'disconnected':
      return 'badge-error'
    default:
      return 'badge-neutral'
  }
}

function getConnectionStatusText(status: string): string {
  switch (status) {
    case 'connected':
      return '正常'
    case 'disconnected':
      return '無法連線'
    default:
      return '檢查中'
  }
}
</script>

<template>
  <div class="h-full flex flex-col bg-surface-secondary">
    <!-- Loading -->
    <div v-if="systemStore.isLoading" class="flex-1 flex items-center justify-center">
      <ph-icon icon="spinner" class="animate-spin h-8 w-8 text-accent" />
    </div>

    <!-- Content -->
    <main v-else class="flex-1 p-4 overflow-auto">
      <!-- Toolbar -->
      <div class="card mb-4 p-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <h1 class="text-lg font-semibold text-content">系統狀態</h1>
          <span
            :class="['text-xs', getConnectionStatusBadge(systemStore.connectionStatus)]"
          >
            {{ getConnectionStatusText(systemStore.connectionStatus) }}
            <span v-if="systemStore.apiLatency !== null" class="ml-1">
              ({{ systemStore.apiLatency }}ms)
            </span>
          </span>
        </div>
        <button
          @click="systemStore.fetchAll"
          :disabled="systemStore.isLoading"
          class="btn-secondary btn-sm"
        >
          <ph-icon
            icon="arrow-clockwise"
            :class="['w-4 h-4 mr-1.5', systemStore.isLoading && 'animate-spin']"
          />
          重新整理
        </button>
      </div>

      <!-- Error Alert -->
      <div v-if="systemStore.error" class="alert-error mb-4">
        <div class="flex items-center gap-2">
          <ph-icon icon="warning" class="w-5 h-5" />
          <span>{{ systemStore.error }}</span>
        </div>
      </div>

      <!-- Kanboard Server Info -->
      <div class="card overflow-hidden mb-4">
        <div class="px-4 py-3 bg-surface-secondary border-b border-edge">
          <h2 class="text-sm font-semibold text-content-secondary uppercase tracking-wide">
            Kanboard 伺服器
          </h2>
        </div>
        <table class="table">
          <tbody class="divide-y divide-edge">
            <tr class="table-row">
              <td class="table-cell text-content-secondary w-48">版本</td>
              <td class="table-cell font-mono">
                {{ systemStore.kanboardVersion || '-' }}
              </td>
            </tr>
            <tr class="table-row">
              <td class="table-cell text-content-secondary">時區</td>
              <td class="table-cell">
                {{ systemStore.kanboardTimezone || '-' }}
              </td>
            </tr>
            <tr class="table-row">
              <td class="table-cell text-content-secondary">API 位址</td>
              <td class="table-cell font-mono text-sm">
                {{ getOriginalApiUrl() }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- KanproBridge Plugin -->
      <div class="card overflow-hidden">
        <div class="px-4 py-3 bg-surface-secondary border-b border-edge flex items-center justify-between">
          <h2 class="text-sm font-semibold text-content-secondary uppercase tracking-wide">
            KanproBridge 外掛
          </h2>
          <span
            v-if="systemStore.bridgeStatus"
            class="badge-success"
          >
            v{{ systemStore.bridgeStatus.version }}
          </span>
          <span
            v-else-if="systemStore.bridgeError"
            class="badge-warning"
          >
            未安裝
          </span>
        </div>

        <!-- Bridge Error -->
        <div v-if="systemStore.bridgeError" class="p-4">
          <div class="alert-warning">
            <div class="flex items-start gap-3">
              <ph-icon icon="warning" class="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p class="font-medium">無法取得外掛狀態</p>
                <p class="text-sm mt-1 opacity-80">{{ systemStore.bridgeError }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Bridge Modules -->
        <table v-else-if="systemStore.bridgeStatus" class="table">
          <thead class="table-header">
            <tr>
              <th class="table-header-cell">功能模組</th>
              <th class="table-header-cell">說明</th>
              <th class="table-header-cell w-24 text-center">狀態</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-edge">
            <tr
              v-for="module in systemStore.moduleStatuses"
              :key="module.id"
              class="table-row"
            >
              <td class="table-cell font-medium">
                {{ module.name }}
              </td>
              <td class="table-cell text-content-secondary">
                {{ module.description }}
              </td>
              <td class="table-cell text-center">
                <span
                  :class="module.enabled ? 'badge-success' : 'badge-neutral'"
                >
                  {{ module.enabled ? '啟用' : '停用' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Loading -->
        <div v-else class="p-8 text-center text-content-tertiary">
          <ph-icon icon="spinner" class="w-6 h-6 animate-spin mx-auto" />
        </div>
      </div>
    </main>
  </div>
</template>
