<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProjectsStore } from '@/stores/projects'
import NotificationsDropdown from '@/components/NotificationsDropdown.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'

const router = useRouter()
const authStore = useAuthStore()
const projectsStore = useProjectsStore()

onMounted(() => {
  projectsStore.fetchProjects()
})

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

const goToProject = (projectId: number) => {
  router.push(`/projects/${projectId}`)
}

const goToDashboard = () => {
  router.push('/dashboard')
}

const goToSettings = () => {
  router.push('/settings')
}
</script>

<template>
  <div class="min-h-screen bg-surface-secondary">
    <!-- Header -->
    <header class="page-header">
      <div class="page-header-content">
        <h1 class="page-title">Kanpro</h1>
        <div class="flex items-center gap-4">
          <button @click="goToDashboard" class="link text-sm font-medium">
            儀表板
          </button>
          <NotificationsDropdown />
          <ThemeToggle />
          <button
            @click="goToSettings"
            class="text-content-secondary hover:text-content"
            title="使用者設定"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <span class="text-content-secondary text-sm">
            {{ authStore.user?.name || authStore.user?.username }}
          </span>
          <button @click="handleLogout" class="btn-secondary btn-sm">
            登出
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="mx-auto max-w-7xl px-4 py-6">
      <!-- Search -->
      <div class="mb-6">
        <input
          v-model="projectsStore.searchQuery"
          type="text"
          placeholder="搜尋專案..."
          class="input max-w-md"
        />
      </div>

      <!-- Loading -->
      <div v-if="projectsStore.isLoading" class="flex justify-center py-12">
        <svg class="spinner h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <!-- Error -->
      <div v-else-if="projectsStore.error" class="alert-error">
        <p>{{ projectsStore.error }}</p>
        <button
          @click="projectsStore.fetchProjects()"
          class="mt-2 text-sm underline hover:no-underline"
        >
          重試
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="projectsStore.filteredProjects.length === 0" class="empty-state">
        <svg class="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <p class="empty-state-description">
          {{ projectsStore.searchQuery ? '找不到符合的專案' : '尚無專案' }}
        </p>
      </div>

      <!-- Projects Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="project in projectsStore.filteredProjects"
          :key="project.id"
          @click="goToProject(project.id)"
          class="card-hover"
        >
          <div class="p-6">
            <div class="flex items-start justify-between">
              <h3 class="text-lg font-semibold text-content truncate">
                {{ project.name }}
              </h3>
              <span
                :class="[
                  'px-2 py-1 text-xs font-medium rounded',
                  project.is_active
                    ? 'bg-success/10 text-success'
                    : 'bg-surface-tertiary text-content-secondary'
                ]"
              >
                {{ project.is_active ? '啟用' : '停用' }}
              </span>
            </div>
            <p v-if="project.description" class="mt-2 text-sm text-content-secondary line-clamp-2">
              {{ project.description }}
            </p>
            <p v-else class="mt-2 text-sm text-content-tertiary italic">
              無描述
            </p>
            <div class="mt-4 flex items-center text-xs text-content-tertiary">
              <span
                v-if="project.is_public"
                class="flex items-center"
              >
                <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                公開
              </span>
              <span
                v-else
                class="flex items-center"
              >
                <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                私人
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
