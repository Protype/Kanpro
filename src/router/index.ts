import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'projects',
      component: () => import('@/views/ProjectsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/projects/:id',
      name: 'project-board',
      component: () => import('@/views/BoardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guest: true }
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
    return next({ name: 'projects' })
  }

  next()
})

export default router
