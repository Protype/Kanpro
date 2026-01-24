<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useMembersStore } from '@/stores/members'

const props = defineProps<{
  projectId: number
}>()

const authStore = useAuthStore()
const membersStore = useMembersStore()

// 標準角色的說明文字
const standardRoleDescriptions: Record<string, string> = {
  'project-manager': '可管理專案設定、成員和所有任務',
  'project-member': '可建立和編輯任務',
  'project-viewer': '只能檢視專案內容，無法編輯'
}

// 根據角色 ID 取得顏色
const getRoleColor = (roleId: string, isCustom: boolean): string => {
  if (isCustom) return 'green'
  switch (roleId) {
    case 'project-manager': return 'purple'
    case 'project-member': return 'blue'
    case 'project-viewer': return 'gray'
    default: return 'gray'
  }
}

const getRoleColorClass = (color: string): string => {
  switch (color) {
    case 'purple':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    case 'blue':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case 'green':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    case 'gray':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  }
}

// 計算屬性：從 store 取得角色列表
const roles = computed(() => {
  return membersStore.projectRoles.map(role => ({
    id: role.id,
    name: role.name,
    description: role.isCustom ? '自定義角色' : (standardRoleDescriptions[role.id] || ''),
    color: getRoleColor(role.id, role.isCustom),
    isCustom: role.isCustom
  }))
})

// 是否有自定義角色
const hasCustomRoles = computed(() => {
  return membersStore.projectRoles.some(r => r.isCustom)
})

onMounted(async () => {
  await membersStore.fetchProjectRoles(props.projectId)
})

watch(() => props.projectId, async (newId) => {
  if (newId) {
    await membersStore.fetchProjectRoles(newId)
  }
})

// Generate Kanboard project roles URL
const kanboardRolesUrl = computed(() => {
  const apiUrl = authStore.apiUrl
  if (!apiUrl) return null

  // Remove /jsonrpc.php if present and construct the project roles URL
  const baseUrl = apiUrl.replace(/\/jsonrpc\.php$/, '')
  return `${baseUrl}/?controller=ProjectRoleController&action=show&project_id=${props.projectId}`
})

const openKanboardRoles = () => {
  if (kanboardRolesUrl.value) {
    window.open(kanboardRolesUrl.value, '_blank')
  }
}
</script>

<template>
  <div class="p-5">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4 h-8">
      <div class="flex items-center gap-2">
        <ph-icon icon="identification-badge" class="w-5 h-5 text-content-tertiary" />
        <h3 class="text-base font-semibold text-content">
          專案角色
        </h3>
      </div>
      <button
        v-if="kanboardRolesUrl"
        @click="openKanboardRoles"
        class="p-2 text-content-tertiary hover:text-content-secondary hover:bg-surface-hover rounded-md transition-colors"
        title="進階角色設定"
      >
        <ph-icon icon="arrow-square-out" class="w-5 h-5" />
      </button>
    </div>

    <div class="space-y-3">
      <!-- Roles list -->
      <div class="space-y-2">
        <div
          v-for="role in roles"
          :key="role.id"
          class="group p-3 bg-surface-secondary/50 rounded-lg"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <!-- Role badge -->
              <div
                class="px-2 py-1 text-xs font-medium rounded-md"
                :class="getRoleColorClass(role.color)"
              >
                {{ role.name }}
                <span v-if="role.isCustom" class="ml-1 opacity-70">✦</span>
              </div>
            </div>
          </div>
          <p class="text-xs text-content-tertiary mt-2">
            {{ role.description }}
          </p>
        </div>
      </div>

      <!-- Advanced settings link -->
      <div class="pt-3 border-t border-edge">
        <button
          v-if="kanboardRolesUrl"
          @click="openKanboardRoles"
          class="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-content-secondary hover:text-content bg-surface-secondary hover:bg-surface-hover rounded-lg transition-colors"
        >
          <ph-icon icon="gear-fine" class="w-4 h-4" />
          <span>進階角色設定</span>
          <ph-icon icon="arrow-square-out" class="w-4 h-4" />
        </button>
        <p v-if="!hasCustomRoles" class="text-xs text-content-tertiary text-center mt-2">
          自訂角色需在 Kanboard 後台設定
        </p>
      </div>
    </div>
  </div>
</template>
