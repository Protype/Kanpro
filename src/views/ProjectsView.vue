<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProjectsStore } from '@/stores/projects'
import NotificationsDropdown from '@/components/NotificationsDropdown.vue'

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
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Header -->
    <header class="bg-white shadow">
      <div class="mx-auto max-w-7xl px-4 py-4 flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-900">Kanpro</h1>
        <div class="flex items-center gap-4">
          <button
            @click="goToDashboard"
            class="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            儀表板
          </button>
          <NotificationsDropdown />
          <span class="text-gray-600">
            {{ authStore.user?.name || authStore.user?.username }}
          </span>
          <button
            @click="handleLogout"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
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
          class="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <!-- Loading -->
      <div v-if="projectsStore.isLoading" class="flex justify-center py-12">
        <svg class="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <!-- Error -->
      <div v-else-if="projectsStore.error" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <p class="text-red-600">{{ projectsStore.error }}</p>
        <button
          @click="projectsStore.fetchProjects()"
          class="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          重試
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="projectsStore.filteredProjects.length === 0" class="text-center py-12">
        <div class="text-gray-400 mb-4">
          <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>
        <p class="text-gray-500">
          {{ projectsStore.searchQuery ? '找不到符合的專案' : '尚無專案' }}
        </p>
      </div>

      <!-- Projects Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="project in projectsStore.filteredProjects"
          :key="project.id"
          @click="goToProject(project.id)"
          class="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
        >
          <div class="p-6">
            <div class="flex items-start justify-between">
              <h3 class="text-lg font-semibold text-gray-900 truncate">
                {{ project.name }}
              </h3>
              <span
                :class="[
                  'px-2 py-1 text-xs font-medium rounded',
                  project.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
                ]"
              >
                {{ project.is_active ? '啟用' : '停用' }}
              </span>
            </div>
            <p v-if="project.description" class="mt-2 text-sm text-gray-600 line-clamp-2">
              {{ project.description }}
            </p>
            <p v-else class="mt-2 text-sm text-gray-400 italic">
              無描述
            </p>
            <div class="mt-4 flex items-center text-xs text-gray-500">
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
