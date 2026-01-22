<script setup lang="ts">
import { onMounted } from 'vue'
import { useSystemStore } from '@/stores/system'
import { useAuthStore } from '@/stores/auth'

const systemStore = useSystemStore()
const authStore = useAuthStore()

onMounted(async () => {
  await systemStore.fetchAll()
})

function getConnectionStatusColor(status: string): string {
  switch (status) {
    case 'connected':
      return 'text-success'
    case 'disconnected':
      return 'text-error'
    default:
      return 'text-content-tertiary'
  }
}

function getConnectionStatusText(status: string): string {
  switch (status) {
    case 'connected':
      return '正常'
    case 'disconnected':
      return '無法連線'
    default:
      return '檢查中...'
  }
}
</script>

<template>
  <div class="h-full overflow-auto bg-surface-secondary">
    <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <!-- Loading State -->
      <div v-if="systemStore.isLoading" class="flex items-center justify-center py-12">
        <ph-icon icon="spinner" class="w-8 h-8 text-accent animate-spin" />
      </div>

      <!-- Content -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Left Column: Kanboard Server -->
        <div class="bg-surface rounded-lg border border-edge p-6">
          <h2 class="text-lg font-semibold text-content mb-6">Kanboard 伺服器</h2>

          <div class="space-y-4">
            <!-- Version -->
            <div class="flex items-center justify-between py-2 border-b border-edge">
              <span class="text-sm text-content-tertiary">版本</span>
              <span class="text-sm font-medium text-content font-mono">
                {{ systemStore.kanboardVersion || '-' }}
              </span>
            </div>

            <!-- Timezone -->
            <div class="flex items-center justify-between py-2 border-b border-edge">
              <span class="text-sm text-content-tertiary">時區</span>
              <span class="text-sm font-medium text-content">
                {{ systemStore.kanboardTimezone || '-' }}
              </span>
            </div>

            <!-- API URL -->
            <div class="flex items-center justify-between py-2 border-b border-edge">
              <span class="text-sm text-content-tertiary">API 位址</span>
              <span class="text-sm text-content truncate max-w-[200px]" :title="authStore.apiUrl">
                {{ authStore.apiUrl || '-' }}
              </span>
            </div>

            <!-- Connection Status -->
            <div class="flex items-center justify-between py-2">
              <span class="text-sm text-content-tertiary">連線狀態</span>
              <span class="flex items-center gap-2">
                <span
                  :class="[
                    'w-2 h-2 rounded-full',
                    systemStore.connectionStatus === 'connected' ? 'bg-success' :
                    systemStore.connectionStatus === 'disconnected' ? 'bg-error' : 'bg-content-tertiary'
                  ]"
                />
                <span :class="['text-sm font-medium', getConnectionStatusColor(systemStore.connectionStatus)]">
                  {{ getConnectionStatusText(systemStore.connectionStatus) }}
                </span>
                <span v-if="systemStore.apiLatency !== null" class="text-sm text-content-tertiary">
                  ({{ systemStore.apiLatency }}ms)
                </span>
              </span>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="systemStore.error" class="mt-4 p-3 bg-error/10 border border-error/20 rounded-md">
            <p class="text-sm text-error">{{ systemStore.error }}</p>
          </div>
        </div>

        <!-- Right Column: KanproBridge Plugin -->
        <div class="bg-surface rounded-lg border border-edge p-6">
          <h2 class="text-lg font-semibold text-content mb-6">KanproBridge 外掛</h2>

          <!-- Bridge not available -->
          <div v-if="systemStore.bridgeError" class="p-4 bg-warning/10 border border-warning/20 rounded-md">
            <div class="flex items-start gap-3">
              <ph-icon icon="warning" class="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p class="text-sm font-medium text-warning">無法取得外掛狀態</p>
                <p class="text-sm text-content-secondary mt-1">{{ systemStore.bridgeError }}</p>
              </div>
            </div>
          </div>

          <!-- Bridge available -->
          <div v-else-if="systemStore.bridgeStatus" class="space-y-4">
            <!-- Version -->
            <div class="flex items-center justify-between py-2 border-b border-edge">
              <span class="text-sm text-content-tertiary">版本</span>
              <span class="text-sm font-medium text-content font-mono">
                {{ systemStore.bridgeStatus.version }}
              </span>
            </div>

            <!-- Module Status List -->
            <div class="pt-2">
              <h3 class="text-sm font-medium text-content-secondary mb-3">功能模組</h3>

              <div class="space-y-3">
                <div
                  v-for="module in systemStore.moduleStatuses"
                  :key="module.id"
                  class="flex items-start gap-3"
                >
                  <!-- Status Indicator -->
                  <span
                    :class="[
                      'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                      module.enabled ? 'bg-success' : 'bg-content-tertiary/30'
                    ]"
                  />

                  <!-- Module Info -->
                  <div class="flex-1 min-w-0">
                    <p
                      :class="[
                        'text-sm font-medium',
                        module.enabled ? 'text-content' : 'text-content-tertiary'
                      ]"
                    >
                      {{ module.name }}
                    </p>
                    <p
                      :class="[
                        'text-xs',
                        module.enabled ? 'text-content-secondary' : 'text-content-tertiary'
                      ]"
                    >
                      {{ module.description }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Loading state for bridge -->
          <div v-else class="flex items-center justify-center py-8">
            <ph-icon icon="spinner" class="w-6 h-6 text-accent animate-spin" />
          </div>
        </div>
      </div>

      <!-- Refresh Button -->
      <div class="mt-6 flex justify-end">
        <button
          @click="systemStore.fetchAll"
          :disabled="systemStore.isLoading"
          class="btn-secondary"
        >
          <ph-icon
            icon="arrow-clockwise"
            :class="['w-4 h-4 mr-2', systemStore.isLoading && 'animate-spin']"
          />
          重新整理
        </button>
      </div>
    </main>
  </div>
</template>
