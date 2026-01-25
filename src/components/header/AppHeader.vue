<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSidebarStore } from '@/stores/sidebar'
import { useBoardStore } from '@/stores/board'
import NotificationsDropdown from '@/components/NotificationsDropdown.vue'
import UserDropdown from '@/components/header/UserDropdown.vue'

const emit = defineEmits<{
  'open-search': []
  'open-create-project': []
  'open-create-task': []
}>()

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const sidebarStore = useSidebarStore()
const boardStore = useBoardStore()

const currentProjectId = computed(() => sidebarStore.currentProjectId)
const currentProjectName = computed(() => boardStore.project?.name || '')

// Check if we're in admin context
const isAdminContext = computed(() => route.path.startsWith('/admin'))

// Check if we're on project create page
const isProjectCreatePage = computed(() => route.name === 'project-create')

// Responsive navigation state
const navContainerRef = ref<HTMLElement | null>(null)
const isNavCollapsed = ref(false)
const showMoreMenu = ref(false)

// Primary nav items (always visible)
const primaryNavItems = computed(() => {
  const id = currentProjectId.value
  if (!id) return []
  return [
    { name: 'project-overview', label: t('project.overview'), icon: 'squares-four', route: `/projects/${id}/overview` },
    { name: 'project-list', label: t('project.list'), icon: 'list', route: `/projects/${id}` },
    { name: 'project-board', label: t('project.board'), icon: 'table-columns', route: `/projects/${id}/board` },
    { name: 'project-calendar', label: t('project.calendar'), icon: 'calendar', route: `/projects/${id}/calendar` }
  ]
})

// Secondary nav items (collapse into dropdown when space is limited)
const secondaryNavItems = computed(() => {
  const id = currentProjectId.value
  if (!id) return []
  return [
    { name: 'project-activity', label: t('project.activity'), icon: 'lightning', route: `/projects/${id}/activity` },
    { name: 'project-analytics', label: t('project.analytics'), icon: 'chart-bar', route: `/projects/${id}/analytics` },
    { name: 'project-settings', label: t('nav.settings'), icon: 'gear', route: `/projects/${id}/settings` }
  ]
})

// All project nav items (for icon-only compact view)
const projectNavItems = computed(() => [...primaryNavItems.value, ...secondaryNavItems.value])

// Check if any secondary item is active
const isSecondaryActive = computed(() => {
  return secondaryNavItems.value.some(item => isActiveRoute(item.name))
})

const checkNavOverflow = () => {
  const windowWidth = window.innerWidth
  // Always collapse when window width is less than 1600px
  // This ensures the nav doesn't overflow on most screens
  isNavCollapsed.value = windowWidth < 1600
}

const setupResizeListener = () => {
  window.addEventListener('resize', checkNavOverflow)
  // Run immediately
  checkNavOverflow()
}

const cleanupResizeListener = () => {
  window.removeEventListener('resize', checkNavOverflow)
}

// Watch for project changes to re-check
watch(currentProjectId, () => {
  checkNavOverflow()
}, { immediate: true })

onMounted(() => {
  setupResizeListener()
})

onUnmounted(() => {
  cleanupResizeListener()
})

// Close more menu when clicking outside
const handleClickOutsideMoreMenu = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('[data-more-menu]')) {
    showMoreMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutsideMoreMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutsideMoreMenu)
})

// Admin navigation items
const adminNavItems = computed(() => [
  { name: 'admin-status', label: t('admin.systemStatus'), icon: 'pulse', route: '/admin' },
  { name: 'admin-settings', label: t('admin.systemSettings'), icon: 'gear', route: '/admin/settings' },
  { name: 'admin-users', label: t('admin.userManagement'), icon: 'users', route: '/admin/users' },
  { name: 'admin-groups', label: t('admin.groupManagement'), icon: 'users-three', route: '/admin/groups' }
])

function isActiveRoute(routeName: string): boolean {
  return route.name === routeName
}

function navigateTo(path: string): void {
  router.push(path)
}

function toggleMobileSidebar(): void {
  sidebarStore.toggleMobileOpen()
}

function openSearch(): void {
  emit('open-search')
}

function openCreateProject(): void {
  emit('open-create-project')
}

function openCreateTask(): void {
  emit('open-create-task')
}
</script>

<template>
  <header class="h-14 bg-surface border-b border-edge flex items-center px-4 gap-3 flex-shrink-0">
    <!-- Mobile Menu Button -->
    <button
      @click="toggleMobileSidebar"
      class="lg:hidden p-2 text-content-tertiary hover:text-content-secondary hover:bg-surface-hover rounded-md"
    >
      <ph-icon icon="list" class="w-5 h-5" />
    </button>

    <!-- Left side content -->
    <div class="hidden lg:flex items-center gap-1">
      <!-- Project Create Page Title -->
      <template v-if="isProjectCreatePage">
        <div class="flex items-center gap-2 min-w-0">
          <div class="w-7 h-7 bg-accent/10 rounded-md flex items-center justify-center flex-shrink-0">
            <ph-icon icon="folder-plus" class="w-4 h-4 text-accent" />
          </div>
          <span class="text-base font-semibold text-content">
            {{ t('project.createProject') }}
          </span>
        </div>
      </template>

      <!-- Quick Actions (Left side - only when NOT in project, admin context, or project create page) -->
      <template v-else-if="!currentProjectId && !isAdminContext">
        <!-- Create Project Button -->
        <button
          @click="openCreateProject"
          class="p-2 text-content-tertiary hover:text-content-secondary hover:bg-surface-hover rounded-md transition-colors"
          :title="t('project.newProject')"
        >
          <ph-icon icon="folder-simple-plus" weight="fill" class="w-5 h-5" />
        </button>

        <!-- Create Task Button -->
        <button
          @click="openCreateTask"
          class="p-2 text-content-tertiary hover:text-content-secondary hover:bg-surface-hover rounded-md transition-colors"
          :title="t('task.newTask')"
        >
          <ph-icon icon="plus-circle" weight="fill" class="w-5 h-5" />
        </button>

        <!-- Search Button (Left side when NOT in project) -->
        <button
          @click="openSearch"
          class="flex items-center gap-2 px-3 py-1.5 text-sm text-content-tertiary bg-surface-secondary hover:bg-surface-hover rounded-md transition-colors"
        >
          <ph-icon icon="magnifying-glass" weight="bold" class="w-4 h-4" />
          <span>{{ t('common.search') }}</span>
          <kbd class="px-1.5 py-0.5 text-xs bg-surface-tertiary rounded">⌘KK</kbd>
        </button>
      </template>

      <!-- Project Navigation (when in project context) - Style B -->
      <template v-if="currentProjectId && !isAdminContext">
        <!-- Project Name with Icon Box -->
        <div class="flex items-center gap-2 min-w-0">
          <div class="w-7 h-7 bg-accent/10 rounded-md flex items-center justify-center flex-shrink-0">
            <ph-icon icon="folder" class="w-4 h-4 text-accent" />
          </div>
          <span class="text-base font-semibold text-content truncate max-w-[200px] 2xl:max-w-[300px]">
            {{ currentProjectName }}
          </span>
        </div>

        <!-- Chevron Separator -->
        <ph-icon icon="caret-right" class="w-4 h-4 text-content-tertiary ml-1 flex-shrink-0" />

        <!-- Full Navigation (xl and above) -->
        <div ref="navContainerRef" class="hidden xl:flex items-center gap-1">
          <!-- Primary Nav Items (always visible) -->
          <button
            v-for="item in primaryNavItems"
            :key="item.name"
            @click="navigateTo(item.route)"
            :class="[
              'flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap',
              isActiveRoute(item.name)
                ? 'bg-accent text-content-inverse'
                : 'text-content-tertiary hover:text-content-secondary hover:bg-surface-hover'
            ]"
            :title="item.label"
          >
            <ph-icon :icon="item.icon" class="w-4 h-4" />
            <span>{{ item.label }}</span>
          </button>

          <!-- Secondary Nav Items (visible when not collapsed) -->
          <template v-if="!isNavCollapsed">
            <button
              v-for="item in secondaryNavItems"
              :key="item.name"
              @click="navigateTo(item.route)"
              :class="[
                'flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap',
                isActiveRoute(item.name)
                  ? 'bg-accent text-content-inverse'
                  : 'text-content-tertiary hover:text-content-secondary hover:bg-surface-hover'
              ]"
              :title="item.label"
            >
              <ph-icon :icon="item.icon" class="w-4 h-4" />
              <span>{{ item.label }}</span>
            </button>
          </template>

          <!-- More Dropdown (visible when collapsed) -->
          <div v-if="isNavCollapsed" class="relative" data-more-menu>
            <button
              @click.stop="showMoreMenu = !showMoreMenu"
              :class="[
                'flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap',
                isSecondaryActive
                  ? 'bg-accent text-content-inverse'
                  : 'text-content-tertiary hover:text-content-secondary hover:bg-surface-hover'
              ]"
            >
              <ph-icon icon="dots-three" class="w-4 h-4" />
              <span>{{ t('common.more') }}</span>
              <ph-icon icon="caret-down" class="w-3 h-3" />
            </button>

            <!-- Dropdown Menu -->
            <Transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <div
                v-if="showMoreMenu"
                class="absolute left-0 mt-2 w-48 bg-surface rounded-lg shadow-lg ring-1 ring-edge overflow-hidden z-50"
              >
                <div class="py-1">
                  <button
                    v-for="item in secondaryNavItems"
                    :key="item.name"
                    @click="navigateTo(item.route); showMoreMenu = false"
                    :class="[
                      'w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors',
                      isActiveRoute(item.name)
                        ? 'bg-accent/10 text-accent'
                        : 'text-content hover:bg-surface-hover'
                    ]"
                  >
                    <ph-icon :icon="item.icon" class="w-4 h-4" />
                    <span>{{ item.label }}</span>
                    <ph-icon
                      v-if="isActiveRoute(item.name)"
                      icon="check"
                      class="w-4 h-4 ml-auto"
                    />
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>

        <!-- Compact Navigation (lg to xl) - icons only with tooltips -->
        <div class="hidden lg:flex xl:hidden items-center gap-1">
          <button
            v-for="item in projectNavItems"
            :key="item.name"
            @click="navigateTo(item.route)"
            :class="[
              'p-2 rounded-md transition-colors',
              isActiveRoute(item.name)
                ? 'bg-accent text-content-inverse'
                : 'text-content-tertiary hover:text-content-secondary hover:bg-surface-hover'
            ]"
            :title="item.label"
          >
            <ph-icon :icon="item.icon" class="w-4 h-4" />
          </button>
        </div>
      </template>

      <!-- Admin Navigation (when in admin context) -->
      <template v-if="isAdminContext">
        <!-- Admin Title -->
        <div class="flex items-center gap-2 min-w-0">
          <ph-icon icon="gear-six" class="w-5 h-5 text-content-secondary flex-shrink-0" />
          <span class="text-base font-semibold text-content">
            {{ t('admin.administration') }}
          </span>
        </div>

        <!-- Separator -->
        <span class="text-content-tertiary mx-1">|</span>

        <!-- Full Navigation (xl and above) -->
        <div class="hidden xl:flex items-center gap-1">
          <button
            v-for="item in adminNavItems"
            :key="item.name"
            @click="navigateTo(item.route)"
            :class="[
              'flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-md transition-colors',
              isActiveRoute(item.name)
                ? 'bg-accent text-content-inverse'
                : 'text-content-tertiary hover:text-content-secondary hover:bg-surface-hover'
            ]"
            :title="item.label"
          >
            <ph-icon :icon="item.icon" class="w-4 h-4" />
            <span>{{ item.label }}</span>
          </button>
        </div>

        <!-- Compact Navigation (lg to xl) - icons only with tooltips -->
        <div class="hidden lg:flex xl:hidden items-center gap-1">
          <button
            v-for="item in adminNavItems"
            :key="item.name"
            @click="navigateTo(item.route)"
            :class="[
              'p-2 rounded-md transition-colors',
              isActiveRoute(item.name)
                ? 'bg-accent text-content-inverse'
                : 'text-content-tertiary hover:text-content-secondary hover:bg-surface-hover'
            ]"
            :title="item.label"
          >
            <ph-icon :icon="item.icon" class="w-4 h-4" />
          </button>
        </div>
      </template>
    </div>

    <!-- Spacer -->
    <div class="flex-1" />

    <!-- Right side content -->
    <div class="hidden lg:flex items-center gap-1">
      <!-- Quick Actions (Right side - when IN project context or on project create page) -->
      <template v-if="currentProjectId || isProjectCreatePage">
        <!-- Create Project Button -->
        <button
          @click="openCreateProject"
          class="p-2 text-content-tertiary hover:text-content-secondary hover:bg-surface-hover rounded-md transition-colors"
          :title="t('project.newProject')"
        >
          <ph-icon icon="folder-simple-plus" weight="fill" class="w-5 h-5" />
        </button>

        <!-- Create Task Button -->
        <button
          @click="openCreateTask"
          class="p-2 text-content-tertiary hover:text-content-secondary hover:bg-surface-hover rounded-md transition-colors"
          :title="t('task.newTask')"
        >
          <ph-icon icon="plus-circle" weight="fill" class="w-5 h-5" />
        </button>

        <!-- Search Button (Right side when IN project) -->
        <button
          @click="openSearch"
          class="flex items-center gap-2 px-3 py-1.5 text-sm text-content-tertiary bg-surface-secondary hover:bg-surface-hover rounded-md transition-colors"
        >
          <ph-icon icon="magnifying-glass" weight="bold" class="w-4 h-4" />
          <span>{{ t('common.search') }}</span>
          <kbd class="px-1.5 py-0.5 text-xs bg-surface-tertiary rounded">⌘KK</kbd>
        </button>
      </template>
    </div>

    <!-- Notifications -->
    <NotificationsDropdown />

    <!-- User Dropdown -->
    <UserDropdown />
  </header>
</template>
