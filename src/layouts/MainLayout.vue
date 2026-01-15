<script setup lang="ts">
import { watch, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useSidebarStore } from '@/stores/sidebar'
import { useAuthStore } from '@/stores/auth'
import AppSidebar from '@/components/sidebar/AppSidebar.vue'
import AppHeader from '@/components/header/AppHeader.vue'
import ReauthModal from '@/components/ReauthModal.vue'

const route = useRoute()
const sidebarStore = useSidebarStore()
const authStore = useAuthStore()

const showSearchModal = ref(false)

// Update sidebar mode based on route
watch(
  () => route.path,
  (path) => {
    // Check if we're in a project context
    const projectMatch = path.match(/^\/projects\/(\d+)/)
    if (projectMatch) {
      sidebarStore.setCurrentProject(Number(projectMatch[1]))
    } else {
      sidebarStore.setCurrentProject(null)
    }
  },
  { immediate: true }
)

// Close mobile sidebar on route change
watch(
  () => route.path,
  () => {
    sidebarStore.closeMobile()
  }
)

// Keyboard shortcut handler
const handleKeydown = (e: KeyboardEvent) => {
  // Cmd/Ctrl + K to open search
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    showSearchModal.value = true
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

const handleSearchModalClose = () => {
  showSearchModal.value = false
}

const openSearchModal = () => {
  showSearchModal.value = true
}
</script>

<template>
  <div class="flex h-screen bg-surface-secondary overflow-hidden">
    <!-- Sidebar -->
    <AppSidebar />

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Header -->
      <AppHeader @open-search="openSearchModal" />

      <!-- Page Content -->
      <main class="flex-1 overflow-auto">
        <router-view
          :show-search-modal="showSearchModal"
          @close-search-modal="handleSearchModalClose"
        />
      </main>
    </div>

    <!-- Mobile Sidebar Overlay -->
    <Transition
      enter-active-class="transition-opacity ease-out duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="sidebarStore.isMobileOpen"
        class="fixed inset-0 bg-black/50 z-30 lg:hidden"
        @click="sidebarStore.closeMobile"
      />
    </Transition>

    <!-- Session Lock Overlay -->
    <Transition
      enter-active-class="transition-opacity ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="authStore.isSessionLocked"
        class="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
      />
    </Transition>

    <!-- Reauth Modal -->
    <ReauthModal />
  </div>
</template>
