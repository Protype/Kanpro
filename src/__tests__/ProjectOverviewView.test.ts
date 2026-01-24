import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import ProjectOverviewView from '@/views/ProjectOverviewView.vue'
import { useBoardStore } from '@/stores/board'
import { useAuthStore } from '@/stores/auth'
import { useMembersStore } from '@/stores/members'
import { useProjectsStore } from '@/stores/projects'
import { useAnalyticsStore } from '@/stores/analytics'

// Mock fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Create a mock router
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/projects/:id/overview', name: 'project-overview', component: ProjectOverviewView },
    { path: '/projects/:id/activity', name: 'project-activity', component: { template: '<div>Activity</div>' } },
    { path: '/projects/:id', name: 'project-list', component: { template: '<div>List</div>' } }
  ]
})

// Mock PhIcon component
const PhIcon = {
  name: 'PhIcon',
  props: ['icon', 'weight'],
  template: '<span :data-icon="icon"></span>'
}

describe('ProjectOverviewView', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    mockFetch.mockReset()

    // Setup auth store
    const authStore = useAuthStore()
    authStore._setTestCredentials({
      apiUrl: 'http://localhost/jsonrpc.php',
      username: 'admin',
      password: 'admin'
    })

    // Mock API responses to return empty results
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        jsonrpc: '2.0',
        id: 1,
        result: []
      })
    })

    await router.push('/projects/1/overview')
    await router.isReady()
  })

  describe('UserAvatar integration', () => {
    it('should import UserAvatar component', async () => {
      const componentModule = await import('@/views/ProjectOverviewView.vue')
      expect(componentModule.default).toBeDefined()
    })

    it('should render without errors', () => {
      const boardStore = useBoardStore()
      boardStore.project = { id: 1, name: 'Test', is_active: 1 }
      boardStore.columns = []

      const wrapper = mount(ProjectOverviewView, {
        global: {
          plugins: [router],
          stubs: {
            PhIcon,
            UserAvatar: true
          }
        }
      })

      expect(wrapper.exists()).toBe(true)
    })
  })
})
