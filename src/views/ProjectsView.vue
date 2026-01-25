<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useProjectsStore } from '@/stores/projects'
import SearchModal from '@/components/SearchModal.vue'
import type { Task } from '@/types'

defineProps<{
  showSearchModal?: boolean
}>()

const emit = defineEmits<{
  'close-search-modal': []
}>()

const router = useRouter()
const { t } = useI18n()
const projectsStore = useProjectsStore()

onMounted(() => {
  projectsStore.fetchProjects()
})

const goToProject = (projectId: number) => {
  router.push(`/projects/${projectId}`)
}

const handleSearchSelect = (task: Task) => {
  router.push(`/projects/${task.project_id}?task=${task.id}`)
  emit('close-search-modal')
}
</script>

<template>
  <div class="h-full overflow-auto bg-surface-secondary">
    <!-- Main Content -->
    <main class="mx-auto max-w-7xl px-4 py-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-content">{{ t('project.projects') }}</h1>
        <p class="text-content-secondary mt-1">{{ t('projects.allAccessible') }}</p>
      </div>

      <!-- Search -->
      <div class="mb-6">
        <input
          v-model="projectsStore.searchQuery"
          type="text"
          :placeholder="t('search.searchProjects') + '...'"
          class="input max-w-md"
        />
      </div>

      <!-- Loading -->
      <div v-if="projectsStore.isLoading" class="flex justify-center py-12">
        <ph-icon icon="spinner" class="spinner h-8 w-8" />
      </div>

      <!-- Error -->
      <div v-else-if="projectsStore.error" class="alert-error">
        <p>{{ projectsStore.error }}</p>
        <button
          @click="projectsStore.fetchProjects()"
          class="mt-2 text-sm underline hover:no-underline"
        >
          {{ t('projects.retry') }}
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="projectsStore.filteredProjects.length === 0" class="empty-state">
        <ph-icon icon="folder" class="empty-state-icon" />
        <p class="empty-state-description">
          {{ projectsStore.searchQuery ? t('projects.noMatchingProjects') : t('project.noProjects') }}
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
                {{ project.is_active ? t('common.active') : t('common.inactive') }}
              </span>
            </div>
            <p v-if="project.description" class="mt-2 text-sm text-content-secondary line-clamp-2">
              {{ project.description }}
            </p>
            <p v-else class="mt-2 text-sm text-content-tertiary italic">
              {{ t('sidebar.noDescription') }}
            </p>
            <div class="mt-4 flex items-center text-xs text-content-tertiary">
              <span
                v-if="project.is_public"
                class="flex items-center"
              >
                <ph-icon icon="globe" class="w-4 h-4 mr-1" />
                {{ t('projects.public') }}
              </span>
              <span
                v-else
                class="flex items-center"
              >
                <ph-icon icon="lock" class="w-4 h-4 mr-1" />
                {{ t('projects.private') }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Search Modal -->
    <SearchModal
      v-if="showSearchModal"
      @close="emit('close-search-modal')"
      @select="handleSearchSelect"
    />
  </div>
</template>
