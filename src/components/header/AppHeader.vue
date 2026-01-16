<script setup lang="ts">
import { useSidebarStore } from '@/stores/sidebar'
import NotificationsDropdown from '@/components/NotificationsDropdown.vue'
import UserDropdown from '@/components/header/UserDropdown.vue'

const emit = defineEmits<{
  'open-search': []
}>()

const sidebarStore = useSidebarStore()

const openSearch = () => {
  emit('open-search')
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

    <!-- Spacer -->
    <div class="flex-1" />

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
