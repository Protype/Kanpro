<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSidebarStore } from '@/stores/sidebar'
import { useProjectsStore } from '@/stores/projects'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const sidebarStore = useSidebarStore()
const projectsStore = useProjectsStore()

// Load projects on mount
onMounted(async () => {
  if (projectsStore.projects.length === 0) {
    await projectsStore.fetchProjects()
  }
})

// Navigation items
const globalNavItems = computed(() => [
  { name: 'dashboard', label: t('nav.dashboard'), icon: 'dashboard', route: '/dashboard' },
  { name: 'activity', label: t('activity.activity'), icon: 'activity', route: '/activity' },
  { name: 'all-tasks', label: t('nav.allTasks'), icon: 'tasks', route: '/' },
  { name: 'my-tasks', label: t('nav.myTasks'), icon: 'user', route: '/my-tasks' }
])

const isActive = (routePath: string) => {
  return route.path === routePath
}

const handleNavClick = (item: { route: string }) => {
  router.push(item.route)
}

const toggleSidebar = () => {
  sidebarStore.toggleExpanded()
}

const handleProjectClick = (projectId: number) => {
  router.push(`/projects/${projectId}`)
}
</script>

<template>
  <aside
    :class="[
      'group flex flex-col bg-surface transition-all duration-300 z-40',
      sidebarStore.isExpanded ? 'w-64' : 'w-16',
      sidebarStore.isMobileOpen
        ? 'fixed inset-y-0 left-0 translate-x-0'
        : 'fixed inset-y-0 left-0 -translate-x-full lg:translate-x-0 lg:relative'
    ]"
  >
    <!-- Header -->
    <div class="relative flex items-center h-14 px-4 border-r border-edge">
      <router-link
        to="/"
        class="text-xl font-bold text-content hover:text-accent transition-colors"
        :class="{ 'mx-auto': !sidebarStore.isExpanded }"
      >
        <span v-if="sidebarStore.isExpanded">Kanpro</span>
        <span v-else class="text-base">K</span>
      </router-link>
      <!-- Toggle Button (hover 時顯示) -->
      <button
        @click="toggleSidebar"
        class="absolute -right-3 top-1/2 -translate-y-1/2 p-1 bg-surface border border-edge rounded-full text-content-tertiary hover:text-content-secondary hover:bg-surface-hover transition-all cursor-pointer z-10 opacity-0 group-hover:opacity-100"
        :title="sidebarStore.isExpanded ? t('sidebar.collapse') : t('sidebar.expand')"
      >
        <ph-icon
          icon="chevron-left"
          class="w-4 h-4 transition-transform"
          :class="{ 'rotate-180': !sidebarStore.isExpanded }"
        />
      </button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto py-4 border-r border-edge">
      <!-- Navigation (always show global nav) -->
      <nav class="px-3 space-y-1">
        <button
          v-for="item in globalNavItems"
          :key="item.name"
          @click="handleNavClick(item)"
          :class="[
            'flex items-center w-full py-2 rounded-md transition-colors cursor-pointer',
            sidebarStore.isExpanded ? 'gap-3 px-3' : 'justify-center',
            isActive(item.route)
              ? 'bg-accent text-content-inverse'
              : 'text-content-secondary hover:bg-surface-hover hover:text-content'
          ]"
        >
          <!-- Dashboard Icon -->
          <ph-icon v-if="item.icon === 'dashboard'" icon="gauge" class="w-5 h-5 flex-shrink-0" />
          <!-- Activity Icon -->
          <ph-icon v-else-if="item.icon === 'activity'" icon="bolt" class="w-5 h-5 flex-shrink-0" />
          <!-- Tasks Icon -->
          <ph-icon v-else-if="item.icon === 'tasks'" icon="list-check" class="w-5 h-5 flex-shrink-0" />
          <!-- User Icon -->
          <ph-icon v-else-if="item.icon === 'user'" icon="user" class="w-5 h-5 flex-shrink-0" />
          <span v-if="sidebarStore.isExpanded">{{ item.label }}</span>
        </button>
      </nav>

      <!-- Projects Section (always visible) -->
      <div class="mt-6 px-3">
        <div
          v-if="sidebarStore.isExpanded"
          class="flex items-center justify-between mb-3"
        >
          <span class="text-xs font-medium text-content-tertiary uppercase tracking-wider">
            {{ t('project.projects') }}
          </span>
          <router-link
            to="/projects"
            class="text-xs text-accent hover:text-accent-hover cursor-pointer"
          >
            {{ t('common.all') }}
          </router-link>
        </div>

        <!-- Projects List - Card Style -->
        <div :class="sidebarStore.isExpanded ? 'space-y-2' : 'space-y-2'">
          <button
            v-for="project in projectsStore.activeProjects.slice(0, 10)"
            :key="project.id"
            @click="handleProjectClick(project.id)"
            :class="[
              'w-full rounded-lg transition-all duration-200 cursor-pointer',
              sidebarStore.isExpanded
                ? 'p-3 text-left bg-surface-secondary border border-edge hover:shadow-md hover:-translate-y-0.5'
                : 'p-2 flex justify-center hover:bg-surface-hover',
              sidebarStore.currentProjectId === project.id
                ? 'ring-2 ring-accent shadow-md'
                : ''
            ]"
          >
            <!-- Collapsed: Icon only -->
            <template v-if="!sidebarStore.isExpanded">
              <ph-icon icon="folder" class="w-5 h-5 text-content-secondary" />
            </template>
            <!-- Expanded: Card content -->
            <template v-else>
              <div class="flex items-center gap-2 mb-1">
                <ph-icon icon="folder" class="w-4 h-4 text-accent flex-shrink-0" />
                <span class="text-sm font-medium text-content truncate">{{ project.name }}</span>
              </div>
              <p v-if="project.description" class="text-xs text-content-tertiary truncate">
                {{ project.description }}
              </p>
              <p v-else class="text-xs text-content-tertiary">
                {{ t('sidebar.noDescription') }}
              </p>
            </template>
          </button>
        </div>
      </div>
    </div>

  </aside>
</template>
