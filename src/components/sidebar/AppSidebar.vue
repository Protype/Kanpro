<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSidebarStore } from '@/stores/sidebar'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import { useBoardStore } from '@/stores/board'

const route = useRoute()
const router = useRouter()
const sidebarStore = useSidebarStore()
const projectsStore = useProjectsStore()
const authStore = useAuthStore()
const boardStore = useBoardStore()

// Load projects on mount
onMounted(async () => {
  if (projectsStore.projects.length === 0) {
    await projectsStore.fetchProjects()
  }
})

// Load current project info when in project mode
watch(
  () => sidebarStore.currentProjectId,
  async (projectId) => {
    if (projectId && !boardStore.project) {
      await boardStore.fetchBoard(projectId)
    }
  },
  { immediate: true }
)

const currentProject = computed(() => {
  if (!sidebarStore.currentProjectId) return null
  return projectsStore.projects.find(p => p.id === sidebarStore.currentProjectId) || boardStore.project
})

const isProjectMode = computed(() => sidebarStore.mode === 'project')

// Navigation items for global mode
const globalNavItems = [
  { name: 'dashboard', label: '儀表板', icon: 'dashboard', route: '/dashboard' },
  { name: 'activity', label: '動態總覽', icon: 'activity', route: '/activity' },
  { name: 'all-tasks', label: '任務總覽', icon: 'tasks', route: '/' },
  { name: 'my-tasks', label: '我的任務', icon: 'user', route: '/my-tasks' }
]

// Navigation items for project mode
const projectNavItems = computed(() => {
  const id = sidebarStore.currentProjectId
  if (!id) return []
  return [
    { name: 'project-activity', label: '專案動態', icon: 'activity', route: `/projects/${id}/activity` },
    { name: 'project-list', label: '列表', icon: 'list', route: `/projects/${id}`, isView: true },
    { name: 'project-board', label: '看板', icon: 'board', route: `/projects/${id}/board`, isView: true },
    { name: 'project-calendar', label: '行事曆', icon: 'calendar', route: `/projects/${id}/calendar`, isView: true },
    { name: 'project-settings', label: '設定', icon: 'settings', route: `/projects/${id}/settings` },
    { name: 'project-analytics', label: '分析', icon: 'chart', route: `/projects/${id}/analytics` }
  ]
})

const isActive = (routePath: string) => {
  return route.path === routePath
}

const isActiveView = (routeName: string) => {
  return route.name === routeName
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

const toggleProjectExpand = (projectId: number, event: Event) => {
  event.stopPropagation()
  sidebarStore.toggleProjectExpanded(projectId)
}

const goToGlobal = () => {
  router.push('/')
}
</script>

<template>
  <aside
    :class="[
      'flex flex-col bg-surface transition-all duration-300 z-40',
      sidebarStore.isExpanded ? 'w-64' : 'w-16',
      sidebarStore.isMobileOpen
        ? 'fixed inset-y-0 left-0 translate-x-0'
        : 'fixed inset-y-0 left-0 -translate-x-full lg:translate-x-0 lg:relative'
    ]"
  >
    <!-- Header -->
    <div class="flex items-center h-14 px-4 border-b border-edge">
      <router-link
        to="/"
        class="text-xl font-bold text-content hover:text-accent transition-colors"
        :class="{ 'mx-auto': !sidebarStore.isExpanded }"
      >
        <span v-if="sidebarStore.isExpanded">Kanpro</span>
        <span v-else class="text-base">K</span>
      </router-link>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto py-4 border-r border-edge">
      <!-- Project Mode: Back button and project name -->
      <div v-if="isProjectMode" class="px-3 mb-4">
        <button
          @click="goToGlobal"
          class="flex items-center gap-2 text-content-secondary hover:text-content text-sm mb-3 w-full cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span v-if="sidebarStore.isExpanded">返回總覽</span>
        </button>
        <h2
          v-if="sidebarStore.isExpanded && currentProject"
          class="text-lg font-semibold text-content truncate"
        >
          {{ currentProject.name }}
        </h2>
      </div>

      <!-- Navigation -->
      <nav class="px-3 space-y-1">
        <!-- Global Navigation -->
        <template v-if="!isProjectMode">
          <button
            v-for="item in globalNavItems"
            :key="item.name"
            @click="handleNavClick(item)"
            :class="[
              'flex items-center gap-3 w-full px-3 py-2 rounded-md transition-colors cursor-pointer',
              isActive(item.route)
                ? 'bg-accent text-content-inverse'
                : 'text-content-secondary hover:bg-surface-hover hover:text-content'
            ]"
          >
            <!-- Dashboard Icon -->
            <svg v-if="item.icon === 'dashboard'" class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            <!-- Activity Icon -->
            <svg v-else-if="item.icon === 'activity'" class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <!-- Tasks Icon -->
            <svg v-else-if="item.icon === 'tasks'" class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <!-- User Icon -->
            <svg v-else-if="item.icon === 'user'" class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span v-if="sidebarStore.isExpanded">{{ item.label }}</span>
          </button>
        </template>

        <!-- Project Navigation -->
        <template v-else>
          <!-- Task Views Section -->
          <div v-if="sidebarStore.isExpanded" class="mb-2">
            <span class="px-3 text-xs font-medium text-content-tertiary uppercase tracking-wider">
              任務視圖
            </span>
          </div>
          <button
            v-for="item in projectNavItems.filter(i => i.isView)"
            :key="item.name"
            @click="handleNavClick(item)"
            :class="[
              'flex items-center gap-3 w-full px-3 py-2 rounded-md transition-colors cursor-pointer',
              isActiveView(item.name)
                ? 'bg-accent text-content-inverse'
                : 'text-content-secondary hover:bg-surface-hover hover:text-content'
            ]"
          >
            <!-- List Icon -->
            <svg v-if="item.icon === 'list'" class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <!-- Board Icon -->
            <svg v-else-if="item.icon === 'board'" class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            <!-- Calendar Icon -->
            <svg v-else-if="item.icon === 'calendar'" class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span v-if="sidebarStore.isExpanded">{{ item.label }}</span>
          </button>

          <!-- Other Project Items -->
          <div v-if="sidebarStore.isExpanded" class="mt-4 mb-2">
            <span class="px-3 text-xs font-medium text-content-tertiary uppercase tracking-wider">
              專案
            </span>
          </div>
          <button
            v-for="item in projectNavItems.filter(i => !i.isView)"
            :key="item.name"
            @click="handleNavClick(item)"
            :class="[
              'flex items-center gap-3 w-full px-3 py-2 rounded-md transition-colors cursor-pointer',
              isActiveView(item.name)
                ? 'bg-accent text-content-inverse'
                : 'text-content-secondary hover:bg-surface-hover hover:text-content'
            ]"
          >
            <!-- Activity Icon -->
            <svg v-if="item.icon === 'activity'" class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <!-- Settings Icon -->
            <svg v-else-if="item.icon === 'settings'" class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <!-- Chart Icon -->
            <svg v-else-if="item.icon === 'chart'" class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span v-if="sidebarStore.isExpanded">{{ item.label }}</span>
          </button>
        </template>
      </nav>

      <!-- Projects Section (always visible) -->
      <div class="mt-6 px-3">
        <div
          v-if="sidebarStore.isExpanded"
          class="flex items-center justify-between mb-2"
        >
          <span class="text-xs font-medium text-content-tertiary uppercase tracking-wider">
            專案
          </span>
          <router-link
            to="/projects"
            class="text-xs text-accent hover:text-accent-hover cursor-pointer"
          >
            全部
          </router-link>
        </div>

        <!-- Projects List -->
        <div class="space-y-1">
          <div
            v-for="project in projectsStore.activeProjects.slice(0, 10)"
            :key="project.id"
          >
            <button
              @click="handleProjectClick(project.id)"
              :class="[
                'flex items-center gap-3 w-full px-3 py-2 rounded-md transition-colors cursor-pointer',
                sidebarStore.currentProjectId === project.id
                  ? 'bg-surface-active text-content'
                  : 'text-content-secondary hover:bg-surface-hover hover:text-content'
              ]"
            >
              <!-- Folder Icon -->
              <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span v-if="sidebarStore.isExpanded" class="truncate">{{ project.name }}</span>
              <!-- Expand/Collapse Button -->
              <button
                v-if="sidebarStore.isExpanded && !isProjectMode"
                @click="toggleProjectExpand(project.id, $event)"
                class="ml-auto p-1 text-content-tertiary hover:text-content-secondary cursor-pointer"
              >
                <svg
                  class="w-4 h-4 transition-transform"
                  :class="{ 'rotate-90': sidebarStore.isProjectExpanded(project.id) }"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </button>

            <!-- Expanded Project Sub-navigation -->
            <div
              v-if="sidebarStore.isExpanded && sidebarStore.isProjectExpanded(project.id) && !isProjectMode"
              class="ml-6 mt-1 space-y-1"
            >
              <router-link
                :to="`/projects/${project.id}/activity`"
                class="flex items-center gap-2 px-3 py-1.5 text-sm text-content-tertiary hover:text-content-secondary rounded-md hover:bg-surface-hover cursor-pointer"
              >
                專案動態
              </router-link>
              <router-link
                :to="`/projects/${project.id}`"
                class="flex items-center gap-2 px-3 py-1.5 text-sm text-content-tertiary hover:text-content-secondary rounded-md hover:bg-surface-hover cursor-pointer"
              >
                列表
              </router-link>
              <router-link
                :to="`/projects/${project.id}/board`"
                class="flex items-center gap-2 px-3 py-1.5 text-sm text-content-tertiary hover:text-content-secondary rounded-md hover:bg-surface-hover cursor-pointer"
              >
                看板
              </router-link>
              <router-link
                :to="`/projects/${project.id}/calendar`"
                class="flex items-center gap-2 px-3 py-1.5 text-sm text-content-tertiary hover:text-content-secondary rounded-md hover:bg-surface-hover cursor-pointer"
              >
                行事曆
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer: Toggle Button -->
    <div class="border-t border-edge border-r border-edge p-3">
      <button
        @click="toggleSidebar"
        class="p-2 text-content-tertiary hover:text-content-secondary hover:bg-surface-hover rounded-md transition-colors cursor-pointer"
        :title="sidebarStore.isExpanded ? '折疊側邊欄' : '展開側邊欄'"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="9" y1="3" x2="9" y2="21" />
        </svg>
      </button>
    </div>
  </aside>
</template>
