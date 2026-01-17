<script setup lang="ts">
import { watch, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useSidebarStore } from '@/stores/sidebar'
import { useAuthStore } from '@/stores/auth'
import AppSidebar from '@/components/sidebar/AppSidebar.vue'
import AppHeader from '@/components/header/AppHeader.vue'
import ReauthModal from '@/components/ReauthModal.vue'
import CreateProjectModal from '@/components/CreateProjectModal.vue'
import CommandBar from '@/components/CommandBar.vue'

const route = useRoute()
const sidebarStore = useSidebarStore()
const authStore = useAuthStore()

const showCommandBar = ref(false)
const commandBarMode = ref<'search' | 'add'>('search')
const showCreateProjectModal = ref(false)
const lastCmdKTime = ref(0)
const DOUBLE_PRESS_THRESHOLD = 300 // ms

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
// New behavior:
// - Single press ⌘K → New task mode
// - Double press ⌘K+K → Search mode
const handleKeydown = (e: KeyboardEvent) => {
  // Cmd/Ctrl + K for command bar
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()

    const now = Date.now()
    const timeSinceLastPress = now - lastCmdKTime.value
    const isDoublePress = timeSinceLastPress < DOUBLE_PRESS_THRESHOLD
    lastCmdKTime.value = now

    if (showCommandBar.value) {
      // CommandBar is open
      if (isDoublePress) {
        // Double press while open: switch to search mode
        commandBarMode.value = 'search'
      } else {
        // Single press while open: toggle mode
        commandBarMode.value = commandBarMode.value === 'search' ? 'add' : 'search'
      }
    } else {
      // CommandBar is closed
      if (isDoublePress) {
        // Double press: open in search mode
        commandBarMode.value = 'search'
      } else {
        // Single press: open in add mode (new default)
        commandBarMode.value = 'add'
      }
      showCommandBar.value = true
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

const handleCommandBarClose = () => {
  showCommandBar.value = false
}

const openCommandBar = () => {
  commandBarMode.value = 'search'
  showCommandBar.value = true
}

const openCreateTask = () => {
  commandBarMode.value = 'add'
  showCommandBar.value = true
}

const openCreateProjectModal = () => {
  showCreateProjectModal.value = true
}

const handleCreateProjectClose = () => {
  showCreateProjectModal.value = false
}
</script>

<template>
  <div class="flex h-screen bg-surface-secondary overflow-hidden">
    <!-- Sidebar -->
    <AppSidebar />

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Header -->
      <AppHeader
        @open-search="openCommandBar"
        @open-create-project="openCreateProjectModal"
        @open-create-task="openCreateTask"
      />

      <!-- Page Content -->
      <main class="flex-1 overflow-auto">
        <router-view />
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

    <!-- Create Project Modal -->
    <CreateProjectModal
      :is-open="showCreateProjectModal"
      @close="handleCreateProjectClose"
    />

    <!-- Command Bar -->
    <CommandBar
      :is-open="showCommandBar"
      :project-id="sidebarStore.currentProjectId || 0"
      :initial-mode="commandBarMode"
      @close="handleCommandBarClose"
    />
  </div>
</template>
