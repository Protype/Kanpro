<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSidebarStore } from '@/stores/sidebar'
import { useBoardStore } from '@/stores/board'
import NotificationsDropdown from '@/components/NotificationsDropdown.vue'
import UserDropdown from '@/components/header/UserDropdown.vue'

const emit = defineEmits<{
  'open-search': []
  'open-create-project': []
  'open-create-task': []
}>()

const route = useRoute()
const router = useRouter()
const sidebarStore = useSidebarStore()
const boardStore = useBoardStore()

const currentProjectId = computed(() => sidebarStore.currentProjectId)
const currentProjectName = computed(() => boardStore.project?.name || '')

// Check if we're in admin context
const isAdminContext = computed(() => route.path.startsWith('/admin'))

// Check if we're on project create page
const isProjectCreatePage = computed(() => route.name === 'project-create')

const projectNavItems = computed(() => {
  const id = currentProjectId.value
  if (!id) return []
  return [
    { name: 'project-overview', label: '總覽', icon: 'squares-four', route: `/projects/${id}/overview` },
    { name: 'project-list', label: '列表', icon: 'list', route: `/projects/${id}` },
    { name: 'project-board', label: '看板', icon: 'table-columns', route: `/projects/${id}/board` },
    { name: 'project-calendar', label: '行事曆', icon: 'calendar', route: `/projects/${id}/calendar` },
    { name: 'project-activity', label: '動態', icon: 'lightning', route: `/projects/${id}/activity` },
    { name: 'project-analytics', label: '分析', icon: 'chart-bar', route: `/projects/${id}/analytics` },
    { name: 'project-settings', label: '設定', icon: 'gear', route: `/projects/${id}/settings` }
  ]
})

// Admin navigation items
const adminNavItems = [
  { name: 'admin-status', label: '系統狀態', icon: 'pulse', route: '/admin' },
  { name: 'admin-settings', label: '系統設定', icon: 'gear', route: '/admin/settings' },
  { name: 'admin-users', label: '使用者管理', icon: 'users', route: '/admin/users' },
  { name: 'admin-groups', label: '群組管理', icon: 'users-three', route: '/admin/groups' }
]

function isActiveRoute(routeName: string): boolean {
  return route.name === routeName
}

function navigateTo(path: string): void {
  router.push(path)
}

function toggleMobileSidebar(): void {
  sidebarStore.toggleMobileOpen()
}

function openSearch(): void {
  emit('open-search')
}

function openCreateProject(): void {
  emit('open-create-project')
}

function openCreateTask(): void {
  emit('open-create-task')
}
</script>

<template>
  <header class="h-14 bg-surface border-b border-edge flex items-center px-4 gap-3 flex-shrink-0">
    <!-- Mobile Menu Button -->
    <button
      @click="toggleMobileSidebar"
      class="lg:hidden p-2 text-content-tertiary hover:text-content-secondary hover:bg-surface-hover rounded-md"
    >
      <ph-icon icon="list" class="w-5 h-5" />
    </button>

    <!-- Left side content -->
    <div class="hidden lg:flex items-center gap-1">
      <!-- Project Create Page Title -->
      <template v-if="isProjectCreatePage">
        <div class="flex items-center gap-2 min-w-0">
          <div class="w-7 h-7 bg-accent/10 rounded-md flex items-center justify-center flex-shrink-0">
            <ph-icon icon="folder-plus" class="w-4 h-4 text-accent" />
          </div>
          <span class="text-base font-semibold text-content">
            建立新專案
          </span>
        </div>
      </template>

      <!-- Quick Actions (Left side - only when NOT in project, admin context, or project create page) -->
      <template v-else-if="!currentProjectId && !isAdminContext">
        <!-- Create Project Button -->
        <button
          @click="openCreateProject"
          class="p-2 text-content-tertiary hover:text-content-secondary hover:bg-surface-hover rounded-md transition-colors"
          title="新增專案"
        >
          <ph-icon icon="folder-simple-plus" weight="fill" class="w-5 h-5" />
        </button>

        <!-- Create Task Button -->
        <button
          @click="openCreateTask"
          class="p-2 text-content-tertiary hover:text-content-secondary hover:bg-surface-hover rounded-md transition-colors"
          title="新增任務"
        >
          <ph-icon icon="plus-circle" weight="fill" class="w-5 h-5" />
        </button>

        <!-- Search Button (Left side when NOT in project) -->
        <button
          @click="openSearch"
          class="flex items-center gap-2 px-3 py-1.5 text-sm text-content-tertiary bg-surface-secondary hover:bg-surface-hover rounded-md transition-colors"
        >
          <ph-icon icon="magnifying-glass" weight="bold" class="w-4 h-4" />
          <span>搜尋</span>
          <kbd class="px-1.5 py-0.5 text-xs bg-surface-tertiary rounded">⌘KK</kbd>
        </button>
      </template>

      <!-- Project Navigation (when in project context) - Style B -->
      <template v-if="currentProjectId && !isAdminContext">
        <!-- Project Name with Icon Box -->
        <div class="flex items-center gap-2 min-w-0">
          <div class="w-7 h-7 bg-accent/10 rounded-md flex items-center justify-center flex-shrink-0">
            <ph-icon icon="folder" class="w-4 h-4 text-accent" />
          </div>
          <span class="text-base font-semibold text-content truncate max-w-[200px] 2xl:max-w-[300px]">
            {{ currentProjectName }}
          </span>
        </div>

        <!-- Chevron Separator -->
        <ph-icon icon="caret-right" class="w-4 h-4 text-content-tertiary ml-1 flex-shrink-0" />

        <!-- Full Navigation (xl and above) -->
        <div class="hidden xl:flex items-center gap-1">
          <button
            v-for="item in projectNavItems"
            :key="item.name"
            @click="navigateTo(item.route)"
            :class="[
              'flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-md transition-colors',
              isActiveRoute(item.name)
                ? 'bg-accent text-content-inverse'
                : 'text-content-tertiary hover:text-content-secondary hover:bg-surface-hover'
            ]"
            :title="item.label"
          >
            <ph-icon :icon="item.icon" class="w-4 h-4" />
            <span>{{ item.label }}</span>
          </button>
        </div>

        <!-- Compact Navigation (lg to xl) - icons only with tooltips -->
        <div class="hidden lg:flex xl:hidden items-center gap-1">
          <button
            v-for="item in projectNavItems"
            :key="item.name"
            @click="navigateTo(item.route)"
            :class="[
              'p-2 rounded-md transition-colors',
              isActiveRoute(item.name)
                ? 'bg-accent text-content-inverse'
                : 'text-content-tertiary hover:text-content-secondary hover:bg-surface-hover'
            ]"
            :title="item.label"
          >
            <ph-icon :icon="item.icon" class="w-4 h-4" />
          </button>
        </div>
      </template>

      <!-- Admin Navigation (when in admin context) -->
      <template v-if="isAdminContext">
        <!-- Admin Title -->
        <div class="flex items-center gap-2 min-w-0">
          <ph-icon icon="gear-six" class="w-5 h-5 text-content-secondary flex-shrink-0" />
          <span class="text-base font-semibold text-content">
            系統管理
          </span>
        </div>

        <!-- Separator -->
        <span class="text-content-tertiary mx-1">|</span>

        <!-- Full Navigation (xl and above) -->
        <div class="hidden xl:flex items-center gap-1">
          <button
            v-for="item in adminNavItems"
            :key="item.name"
            @click="navigateTo(item.route)"
            :class="[
              'flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-md transition-colors',
              isActiveRoute(item.name)
                ? 'bg-accent text-content-inverse'
                : 'text-content-tertiary hover:text-content-secondary hover:bg-surface-hover'
            ]"
            :title="item.label"
          >
            <ph-icon :icon="item.icon" class="w-4 h-4" />
            <span>{{ item.label }}</span>
          </button>
        </div>

        <!-- Compact Navigation (lg to xl) - icons only with tooltips -->
        <div class="hidden lg:flex xl:hidden items-center gap-1">
          <button
            v-for="item in adminNavItems"
            :key="item.name"
            @click="navigateTo(item.route)"
            :class="[
              'p-2 rounded-md transition-colors',
              isActiveRoute(item.name)
                ? 'bg-accent text-content-inverse'
                : 'text-content-tertiary hover:text-content-secondary hover:bg-surface-hover'
            ]"
            :title="item.label"
          >
            <ph-icon :icon="item.icon" class="w-4 h-4" />
          </button>
        </div>
      </template>
    </div>

    <!-- Spacer -->
    <div class="flex-1" />

    <!-- Right side content -->
    <div class="hidden lg:flex items-center gap-1">
      <!-- Quick Actions (Right side - when IN project context or on project create page) -->
      <template v-if="currentProjectId || isProjectCreatePage">
        <!-- Create Project Button -->
        <button
          @click="openCreateProject"
          class="p-2 text-content-tertiary hover:text-content-secondary hover:bg-surface-hover rounded-md transition-colors"
          title="新增專案"
        >
          <ph-icon icon="folder-simple-plus" weight="fill" class="w-5 h-5" />
        </button>

        <!-- Create Task Button -->
        <button
          @click="openCreateTask"
          class="p-2 text-content-tertiary hover:text-content-secondary hover:bg-surface-hover rounded-md transition-colors"
          title="新增任務"
        >
          <ph-icon icon="plus-circle" weight="fill" class="w-5 h-5" />
        </button>

        <!-- Search Button (Right side when IN project) -->
        <button
          @click="openSearch"
          class="flex items-center gap-2 px-3 py-1.5 text-sm text-content-tertiary bg-surface-secondary hover:bg-surface-hover rounded-md transition-colors"
        >
          <ph-icon icon="magnifying-glass" weight="bold" class="w-4 h-4" />
          <span>搜尋</span>
          <kbd class="px-1.5 py-0.5 text-xs bg-surface-tertiary rounded">⌘KK</kbd>
        </button>
      </template>
    </div>

    <!-- Notifications -->
    <NotificationsDropdown />

    <!-- User Dropdown -->
    <UserDropdown />
  </header>
</template>
