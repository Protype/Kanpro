import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import AdminUsersView from '@/views/AdminUsersView.vue'
import { useAuthStore } from '@/stores/auth'

// Mock fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Create a mock router
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/admin/users', name: 'admin-users', component: AdminUsersView }
  ]
})

// Mock PhIcon component
const PhIcon = {
  name: 'PhIcon',
  props: ['icon', 'weight'],
  template: '<span :data-icon="icon"></span>'
}

describe('AdminUsersView', () => {
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
    authStore.user = {
      id: 1,
      name: 'Admin',
      username: 'admin',
      role: 'app-admin',
      email: 'admin@example.com',
      is_active: true
    }

    // Mock API responses for users list
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        jsonrpc: '2.0',
        id: 1,
        result: [
          { id: 1, name: 'Admin User', username: 'admin', email: 'admin@test.com', role: 'app-admin', is_active: 1 },
          { id: 2, name: 'John Doe', username: 'john', email: 'john@test.com', role: 'app-user', is_active: 1 }
        ]
      })
    })

    await router.push('/admin/users')
    await router.isReady()
  })

  function mountView() {
    return mount(AdminUsersView, {
      global: {
        plugins: [router],
        stubs: {
          PhIcon,
          UserAvatar: true
        }
      }
    })
  }

  describe('user list avatars', () => {
    it('should use UserAvatar component for user avatars', async () => {
      const wrapper = mountView()
      await flushPromises()

      const avatars = wrapper.findAllComponents({ name: 'UserAvatar' })
      expect(avatars.length).toBeGreaterThanOrEqual(2)
    })

    it('should pass user data to UserAvatar', async () => {
      const wrapper = mountView()
      await flushPromises()

      const avatars = wrapper.findAllComponents({ name: 'UserAvatar' })
      const adminAvatar = avatars.find(a =>
        a.props('user')?.name === 'Admin User' ||
        a.props('name') === 'Admin User'
      )
      expect(adminAvatar).toBeDefined()
    })

    it('should use sm size for user list avatars', async () => {
      const wrapper = mountView()
      await flushPromises()

      const avatars = wrapper.findAllComponents({ name: 'UserAvatar' })
      avatars.forEach(avatar => {
        expect(avatar.props('size')).toBe('sm')
      })
    })
  })
})
