<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSidebarStore } from '@/stores/sidebar'
import { useProjectsStore } from '@/stores/projects'
import { useBoardStore } from '@/stores/board'

const route = useRoute()
const router = useRouter()
const sidebarStore = useSidebarStore()
const projectsStore = useProjectsStore()
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

const goToGlobal = () => {
  router.push('/')
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
        :title="sidebarStore.isExpanded ? '折疊側邊欄' : '展開側邊欄'"
      >
        <font-awesome-icon
          icon="chevron-left"
          class="w-4 h-4 transition-transform"
          :class="{ 'rotate-180': !sidebarStore.isExpanded }"
        />
      </button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto py-4 border-r border-edge">
      <!-- Project Mode: Back button and project name -->
      <div v-if="isProjectMode" :class="['mb-4', sidebarStore.isExpanded ? 'px-3' : 'px-2']">
        <button
          @click="goToGlobal"
          :class="[
            'flex items-center text-content-secondary hover:text-content text-sm mb-3 w-full cursor-pointer',
            sidebarStore.isExpanded ? 'gap-2' : 'justify-center'
          ]"
        >
          <font-awesome-icon icon="chevron-left" class="w-4 h-4 flex-shrink-0" />
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
              'flex items-center w-full py-2 rounded-md transition-colors cursor-pointer',
              sidebarStore.isExpanded ? 'gap-3 px-3' : 'justify-center',
              isActive(item.route)
                ? 'bg-accent text-content-inverse'
                : 'text-content-secondary hover:bg-surface-hover hover:text-content'
            ]"
          >
            <!-- Dashboard Icon -->
            <font-awesome-icon v-if="item.icon === 'dashboard'" icon="gauge" class="w-5 h-5 flex-shrink-0" />
            <!-- Activity Icon -->
            <font-awesome-icon v-else-if="item.icon === 'activity'" icon="bolt" class="w-5 h-5 flex-shrink-0" />
            <!-- Tasks Icon -->
            <font-awesome-icon v-else-if="item.icon === 'tasks'" icon="list-check" class="w-5 h-5 flex-shrink-0" />
            <!-- User Icon -->
            <font-awesome-icon v-else-if="item.icon === 'user'" icon="user" class="w-5 h-5 flex-shrink-0" />
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
              'flex items-center w-full py-2 rounded-md transition-colors cursor-pointer',
              sidebarStore.isExpanded ? 'gap-3 px-3' : 'justify-center',
              isActiveView(item.name)
                ? 'bg-accent text-content-inverse'
                : 'text-content-secondary hover:bg-surface-hover hover:text-content'
            ]"
          >
            <!-- List Icon -->
            <font-awesome-icon v-if="item.icon === 'list'" icon="list" class="w-5 h-5 flex-shrink-0" />
            <!-- Board Icon -->
            <font-awesome-icon v-else-if="item.icon === 'board'" icon="table-columns" class="w-5 h-5 flex-shrink-0" />
            <!-- Calendar Icon -->
            <font-awesome-icon v-else-if="item.icon === 'calendar'" icon="calendar" class="w-5 h-5 flex-shrink-0" />
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
              'flex items-center w-full py-2 rounded-md transition-colors cursor-pointer',
              sidebarStore.isExpanded ? 'gap-3 px-3' : 'justify-center',
              isActiveView(item.name)
                ? 'bg-accent text-content-inverse'
                : 'text-content-secondary hover:bg-surface-hover hover:text-content'
            ]"
          >
            <!-- Activity Icon -->
            <font-awesome-icon v-if="item.icon === 'activity'" icon="bolt" class="w-5 h-5 flex-shrink-0" />
            <!-- Settings Icon -->
            <font-awesome-icon v-else-if="item.icon === 'settings'" icon="gear" class="w-5 h-5 flex-shrink-0" />
            <!-- Chart Icon -->
            <font-awesome-icon v-else-if="item.icon === 'chart'" icon="chart-bar" class="w-5 h-5 flex-shrink-0" />
            <span v-if="sidebarStore.isExpanded">{{ item.label }}</span>
          </button>
        </template>
      </nav>

      <!-- Projects Section (always visible) -->
      <div class="mt-6 px-3">
        <div
          v-if="sidebarStore.isExpanded"
          class="flex items-center justify-between mb-3"
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
              <font-awesome-icon icon="folder" class="w-5 h-5 text-content-secondary" />
            </template>
            <!-- Expanded: Card content -->
            <template v-else>
              <div class="flex items-center gap-2 mb-1">
                <font-awesome-icon icon="folder" class="w-4 h-4 text-accent flex-shrink-0" />
                <span class="text-sm font-medium text-content truncate">{{ project.name }}</span>
              </div>
              <p v-if="project.description" class="text-xs text-content-tertiary truncate">
                {{ project.description }}
              </p>
              <p v-else class="text-xs text-content-tertiary">
                無描述
              </p>
            </template>
          </button>
        </div>
      </div>
    </div>

  </aside>
</template>
