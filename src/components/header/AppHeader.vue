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
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>

    <!-- Create Project Button (Left side) -->
    <button
      @click="openCreateProject"
      class="hidden lg:flex p-2 text-content-tertiary hover:text-content-secondary hover:bg-surface-hover rounded-md transition-colors"
      title="新增專案"
    >
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      </svg>
    </button>

    <!-- Spacer -->
    <div class="flex-1" />

    <!-- Create Task Button (Right side) -->
    <button
      @click="openCreateTask"
      class="p-2 text-content-tertiary hover:text-accent hover:bg-surface-hover rounded-md transition-colors"
      title="新增任務"
    >
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
    </button>

    <!-- Search Button -->
    <button
      @click="openSearch"
      class="flex items-center gap-2 px-3 py-1.5 text-sm text-content-tertiary bg-surface-secondary hover:bg-surface-hover rounded-md transition-colors"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <span class="hidden sm:inline">搜尋</span>
      <kbd class="hidden sm:inline-block px-1.5 py-0.5 text-xs bg-surface-tertiary rounded">⌘K</kbd>
    </button>

    <!-- Notifications -->
    <NotificationsDropdown />

    <!-- User Dropdown -->
    <UserDropdown />
  </header>
</template>
