import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import UserDropdown from '@/components/header/UserDropdown.vue'
import { useAuthStore } from '@/stores/auth'

// Mock fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Create a mock router
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/settings', name: 'user-settings', component: { template: '<div>Settings</div>' } },
    { path: '/login', name: 'login', component: { template: '<div>Login</div>' } }
  ]
})

// Mock PhIcon component
const PhIcon = {
  name: 'PhIcon',
  props: ['icon'],
  template: '<span :data-icon="icon"></span>'
}

describe('UserDropdown', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    mockFetch.mockReset()

    // Setup auth store with user
    const authStore = useAuthStore()
    authStore._setTestCredentials({
      apiUrl: 'http://localhost/jsonrpc.php',
      username: 'admin',
      password: 'admin'
    })
    authStore.user = {
      id: 1,
      name: '管理員測試',
      username: 'admin',
      role: 'app-admin',
      email: 'admin@example.com'
    }

    // Mock API responses
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        jsonrpc: '2.0',
        id: 1,
        result: null
      })
    })

    await router.push('/')
    await router.isReady()
  })

  function mountDropdown() {
    return mount(UserDropdown, {
      global: {
        plugins: [router],
        stubs: {
          PhIcon,
          UserAvatar: true
        }
      }
    })
  }

  describe('avatar display', () => {
    it('should use UserAvatar component for user avatar', () => {
      const wrapper = mountDropdown()

      const avatar = wrapper.findComponent({ name: 'UserAvatar' })
      expect(avatar.exists()).toBe(true)
    })

    it('should pass user data to UserAvatar', () => {
      const wrapper = mountDropdown()

      const avatar = wrapper.findComponent({ name: 'UserAvatar' })
      expect(avatar.props('user')).toBeDefined()
      expect(avatar.props('user').name).toBe('管理員測試')
    })

    it('should pass avatar image data when available', async () => {
      const authStore = useAuthStore()
      authStore.avatarData = 'base64encodedimage'

      const wrapper = mountDropdown()

      const avatar = wrapper.findComponent({ name: 'UserAvatar' })
      expect(avatar.props('imageUrl')).toContain('base64encodedimage')
    })

    it('should use sm size for dropdown trigger avatar', () => {
      const wrapper = mountDropdown()

      // Find the trigger button's avatar (first one)
      const avatars = wrapper.findAllComponents({ name: 'UserAvatar' })
      expect(avatars.length).toBeGreaterThan(0)
      expect(avatars[0].props('size')).toBe('sm')
    })

    it('should use md size for dropdown menu avatar', async () => {
      const wrapper = mountDropdown()

      // Click to open dropdown
      const trigger = wrapper.find('button')
      await trigger.trigger('click')

      // Find all avatars - the second one should be in the menu
      const avatars = wrapper.findAllComponents({ name: 'UserAvatar' })
      expect(avatars.length).toBe(2)
      expect(avatars[1].props('size')).toBe('md')
    })
  })
})
