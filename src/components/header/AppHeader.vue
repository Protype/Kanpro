<script setup lang="ts">
import { useSidebarStore } from '@/stores/sidebar'
import NotificationsDropdown from '@/components/NotificationsDropdown.vue'
import UserDropdown from '@/components/header/UserDropdown.vue'

const emit = defineEmits<{
  'open-search': []
  'open-create-project': []
  'open-create-task': []
}>()

const sidebarStore = useSidebarStore()

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

    <!-- Quick Actions (Left side) -->
    <div class="hidden lg:flex items-center gap-1">
      <!-- Create Project Button -->
      <button
        @click="openCreateProject"
        class="p-2 text-content-tertiary hover:text-content-secondary hover:bg-surface-hover rounded-md transition-colors text-base"
        title="新增專案"
      >
        <ph-icon icon="folder-simple-plus" weight="fill" class="w-5 h-5" />
      </button>

      <!-- Create Task Button -->
      <button
        @click="openCreateTask"
        class="p-2 text-content-tertiary hover:text-content-secondary hover:bg-surface-hover rounded-md transition-colors text-sm"
        title="新增任務"
      >
        <ph-icon icon="plus-circle" weight="fill" class="w-[19px] h-[19px]" />
      </button>

      <!-- Search Button -->
      <button
        @click="openSearch"
        class="flex items-center gap-2 px-3 py-1.5 text-sm text-content-tertiary bg-surface-secondary hover:bg-surface-hover rounded-md transition-colors ml-1"
      >
        <ph-icon icon="magnifying-glass" weight="bold" class="w-4 h-4" />
        <span>搜尋</span>
        <kbd class="px-1.5 py-0.5 text-xs bg-surface-tertiary rounded">⌘K</kbd>
      </button>
    </div>

    <!-- Spacer -->
    <div class="flex-1" />

    <!-- Notifications -->
    <NotificationsDropdown />

    <!-- User Dropdown -->
    <UserDropdown />
  </header>
</template>
