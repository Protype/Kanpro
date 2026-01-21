<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSidebarStore } from '@/stores/sidebar'
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

// Check if we're in project context
const currentProjectId = computed(() => sidebarStore.currentProjectId)

// Project navigation items
const projectNavItems = computed(() => {
  const id = currentProjectId.value
  if (!id) return []
  return [
    { name: 'project-overview', label: '總覽', icon: 'squares-four', route: `/projects/${id}/overview` },
    { name: 'project-list', label: '列表', icon: 'list', route: `/projects/${id}` },
    { name: 'project-board', label: '看板', icon: 'table-columns', route: `/projects/${id}/board` },
    { name: 'project-calendar', label: '行事曆', icon: 'calendar', route: `/projects/${id}/calendar` },
    { name: 'project-activity', label: '動態', icon: 'bolt', route: `/projects/${id}/activity` },
    { name: 'project-analytics', label: '分析', icon: 'chart-bar', route: `/projects/${id}/analytics` },
    { name: 'project-settings', label: '設定', icon: 'gear', route: `/projects/${id}/settings` }
  ]
})

const isActiveRoute = (routeName: string) => {
  return route.name === routeName
}

const navigateTo = (path: string) => {
  router.push(path)
}

const openSearch = () => {
  emit('open-search')
}

const openCreateProject = () => {
  emit('open-create-project')
}

const openCreateTask = () => {
  emit('open-create-task')
}

const toggleMobileSidebar = () => {
  sidebarStore.toggleMobileOpen()
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
      <!-- Quick Actions (Left side - only when NOT in project context) -->
      <template v-if="!currentProjectId">
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
          <kbd class="px-1.5 py-0.5 text-xs bg-surface-tertiary rounded">⌘K</kbd>
        </button>
      </template>

      <!-- Project Navigation Buttons (when in project context) -->
      <template v-if="currentProjectId">
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
      </template>
    </div>

    <!-- Spacer -->
    <div class="flex-1" />

    <!-- Right side content -->
    <div class="hidden lg:flex items-center gap-1">
      <!-- Quick Actions (Right side - only when IN project context) -->
      <template v-if="currentProjectId">
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

        <div class="w-px h-5 bg-edge mx-1" />

        <!-- Search Button (Right side when IN project) -->
        <button
          @click="openSearch"
          class="flex items-center gap-2 px-3 py-1.5 text-sm text-content-tertiary bg-surface-secondary hover:bg-surface-hover rounded-md transition-colors"
        >
          <ph-icon icon="magnifying-glass" weight="bold" class="w-4 h-4" />
          <span>搜尋</span>
          <kbd class="px-1.5 py-0.5 text-xs bg-surface-tertiary rounded">⌘K</kbd>
        </button>
      </template>
    </div>

    <!-- Notifications -->
    <NotificationsDropdown />

    <!-- User Dropdown -->
    <UserDropdown />
  </header>
</template>
