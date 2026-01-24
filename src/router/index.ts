import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Authentication pages (no sidebar)
    {
      path: '/login',
      component: () => import('@/layouts/AuthLayout.vue'),
      meta: { guest: true },
      children: [
        {
          path: '',
          name: 'login',
          component: () => import('@/views/LoginView.vue')
        }
      ]
    },

    // Main application (with sidebar)
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        // Global views
        {
          path: '',
          name: 'all-tasks',
          component: () => import('@/views/AllTasksView.vue'),
          meta: { sidebarMode: 'global' }
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
          meta: { sidebarMode: 'global' }
        },
        {
          path: 'activity',
          name: 'activity',
          component: () => import('@/views/ActivityView.vue'),
          meta: { sidebarMode: 'global' }
        },
        {
          path: 'my-tasks',
          name: 'my-tasks',
          component: () => import('@/views/MyTasksView.vue'),
          meta: { sidebarMode: 'global' }
        },
        {
          path: 'projects',
          name: 'projects',
          component: () => import('@/views/ProjectsView.vue'),
          meta: { sidebarMode: 'global' }
        },
        {
          path: 'projects/new',
          name: 'project-create',
          component: () => import('@/views/ProjectCreateView.vue'),
          meta: { sidebarMode: 'global' }
        },
        {
          path: 'settings',
          name: 'user-settings',
          component: () => import('@/views/UserSettingsView.vue'),
          meta: { sidebarMode: 'global' }
        },

        // Admin views
        {
          path: 'admin',
          meta: { sidebarMode: 'admin', requiresAdmin: true },
          children: [
            {
              path: '',
              name: 'admin-status',
              component: () => import('@/views/AdminStatusView.vue')
            },
            {
              path: 'settings',
              name: 'admin-settings',
              component: () => import('@/views/AdminSettingsView.vue')
            },
            {
              path: 'users',
              name: 'admin-users',
              component: () => import('@/views/AdminUsersView.vue')
            },
            {
              path: 'groups',
              name: 'admin-groups',
              component: () => import('@/views/AdminGroupsView.vue')
            }
          ]
        },

        // Project views - List is default
        {
          path: 'projects/:id',
          meta: { sidebarMode: 'project' },
          children: [
            {
              path: '',
              name: 'project-list',
              component: () => import('@/views/ListView.vue')
            },
            {
              path: 'overview',
              name: 'project-overview',
              component: () => import('@/views/ProjectOverviewView.vue')
            },
            {
              path: 'board',
              name: 'project-board',
              component: () => import('@/views/BoardView.vue')
            },
            {
              path: 'calendar',
              name: 'project-calendar',
              component: () => import('@/views/CalendarView.vue')
            },
            {
              path: 'activity',
              name: 'project-activity',
              component: () => import('@/views/ProjectActivityView.vue')
            },
            {
              path: 'settings',
              name: 'project-settings',
              component: () => import('@/views/ProjectSettingsView.vue')
            },
            {
              path: 'analytics',
              name: 'project-analytics',
              component: () => import('@/views/ProjectAnalyticsView.vue')
            },
            {
              path: 'tasks/new',
              name: 'task-create',
              component: () => import('@/views/TaskCreateView.vue')
            }
          ]
        }
      ]
    }
  ]
})

// 路由守衛
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  // 如果需要認證但尚未認證，先嘗試還原 session
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    const restored = await authStore.restoreSession()
    if (!restored) {
      return next({ name: 'login', query: { redirect: to.fullPath } })
    }
  }

  // 如果已登入但訪問 guest 頁面（如登入頁），導向首頁
  if (to.meta.guest && authStore.isAuthenticated) {
    return next({ name: 'all-tasks' })
  }

  // 如果需要 admin 權限但不是 admin，導向首頁
  if (to.matched.some(record => record.meta.requiresAdmin)) {
    if (authStore.user?.role !== 'app-admin') {
      return next({ name: 'all-tasks' })
    }
  }

  next()
})

export default router
