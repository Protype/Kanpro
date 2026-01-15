import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ReauthModal from '@/components/ReauthModal.vue'
import { useAuthStore } from '@/stores/auth'

const mockFetch = vi.fn()

describe('ReauthModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('rendering', () => {
    it('should not render when session is not locked', () => {
      const wrapper = mount(ReauthModal, {
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      expect(wrapper.find('[data-testid="reauth-modal"]').exists()).toBe(false)
    })

    it('should render when session is locked', async () => {
      const authStore = useAuthStore()
      authStore._setTestCredentials({
        apiUrl: 'http://localhost/jsonrpc.php',
        username: 'admin',
        password: 'admin'
      })

      // Manually set session locked state
      authStore.isSessionLocked = true

      const wrapper = mount(ReauthModal, {
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      expect(wrapper.find('[data-testid="reauth-modal"]').exists()).toBe(true)
    })

    it('should display username', async () => {
      const authStore = useAuthStore()
      authStore._setTestCredentials({
        apiUrl: 'http://localhost/jsonrpc.php',
        username: 'testuser',
        password: 'password'
      })

      authStore.isSessionLocked = true

      const wrapper = mount(ReauthModal, {
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      expect(wrapper.text()).toContain('testuser')
    })

    it('should have password input field', async () => {
      const authStore = useAuthStore()
      authStore._setTestCredentials({
        apiUrl: 'http://localhost/jsonrpc.php',
        username: 'admin',
        password: 'admin'
      })

      authStore.isSessionLocked = true

      const wrapper = mount(ReauthModal, {
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      const passwordInput = wrapper.find('[data-testid="password-input"]')
      expect(passwordInput.exists()).toBe(true)
      expect(passwordInput.attributes('type')).toBe('password')
    })

    it('should have reauth button', async () => {
      const authStore = useAuthStore()
      authStore._setTestCredentials({
        apiUrl: 'http://localhost/jsonrpc.php',
        username: 'admin',
        password: 'admin'
      })

      authStore.isSessionLocked = true

      const wrapper = mount(ReauthModal, {
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      expect(wrapper.find('[data-testid="reauth-btn"]').exists()).toBe(true)
    })

    it('should have logout button', async () => {
      const authStore = useAuthStore()
      authStore._setTestCredentials({
        apiUrl: 'http://localhost/jsonrpc.php',
        username: 'admin',
        password: 'admin'
      })

      authStore.isSessionLocked = true

      const wrapper = mount(ReauthModal, {
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      expect(wrapper.find('[data-testid="logout-btn"]').exists()).toBe(true)
    })
  })

  describe('reauthentication', () => {
    it('should call reauthenticate with password on form submit', async () => {
      const authStore = useAuthStore()
      authStore._setTestCredentials({
        apiUrl: 'http://localhost/jsonrpc.php',
        username: 'admin',
        password: 'oldpassword'
      })

      authStore.isSessionLocked = true

      // Mock getMe for Basic Auth reauthentication
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: { id: 1, username: 'admin', name: 'Admin', email: 'admin@test.com', role: 'app-admin', is_active: true }
        })
      })

      const wrapper = mount(ReauthModal, {
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      await wrapper.find('[data-testid="password-input"]').setValue('newpassword')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Should have attempted reauthentication
      expect(mockFetch).toHaveBeenCalled()
    })

    it('should show loading state during reauthentication', async () => {
      const authStore = useAuthStore()
      authStore._setTestCredentials({
        apiUrl: 'http://localhost/jsonrpc.php',
        username: 'admin',
        password: 'admin'
      })

      authStore.isSessionLocked = true

      let resolvePromise: (value: unknown) => void
      mockFetch.mockReturnValueOnce(
        new Promise((resolve) => {
          resolvePromise = resolve
        })
      )

      const wrapper = mount(ReauthModal, {
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      await wrapper.find('[data-testid="password-input"]').setValue('password')
      await wrapper.find('form').trigger('submit')
      await wrapper.vm.$nextTick()

      // Should show loading state (button text changes to 驗證中...)
      expect(wrapper.find('[data-testid="reauth-btn"]').text()).toContain('驗證中')

      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: { id: 1, username: 'admin', name: 'Admin', email: 'admin@test.com', role: 'app-admin', is_active: true }
        })
      })
      await flushPromises()
    })

    it('should show error message on failed reauthentication', async () => {
      const authStore = useAuthStore()
      authStore._setTestCredentials({
        apiUrl: 'http://localhost/jsonrpc.php',
        username: 'admin',
        password: 'admin'
      })

      authStore.isSessionLocked = true

      // Mock failed getMe (invalid credentials)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      })

      const wrapper = mount(ReauthModal, {
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      await wrapper.find('[data-testid="password-input"]').setValue('wrongpassword')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Should show error
      expect(wrapper.find('[data-testid="error-message"]').exists()).toBe(true)
    })

    it('should disable submit button when password is empty', async () => {
      const authStore = useAuthStore()
      authStore._setTestCredentials({
        apiUrl: 'http://localhost/jsonrpc.php',
        username: 'admin',
        password: 'admin'
      })

      authStore.isSessionLocked = true

      const wrapper = mount(ReauthModal, {
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      const reauthBtn = wrapper.find('[data-testid="reauth-btn"]')
      expect(reauthBtn.attributes('disabled')).toBeDefined()
    })
  })

  describe('logout', () => {
    it('should call abandonReauth when clicking logout button', async () => {
      const authStore = useAuthStore()
      authStore._setTestCredentials({
        apiUrl: 'http://localhost/jsonrpc.php',
        username: 'admin',
        password: 'admin'
      })

      authStore.isSessionLocked = true

      const abandonReauthSpy = vi.spyOn(authStore, 'abandonReauth')

      const wrapper = mount(ReauthModal, {
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      await wrapper.find('[data-testid="logout-btn"]').trigger('click')

      expect(abandonReauthSpy).toHaveBeenCalled()
    })
  })

  describe('form submission', () => {
    it('should submit form on Enter key press', async () => {
      const authStore = useAuthStore()
      authStore._setTestCredentials({
        apiUrl: 'http://localhost/jsonrpc.php',
        username: 'admin',
        password: 'admin'
      })

      authStore.isSessionLocked = true

      // Mock getMe for Basic Auth reauthentication
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: { id: 1, username: 'admin', name: 'Admin', email: 'admin@test.com', role: 'app-admin', is_active: true }
        })
      })

      const wrapper = mount(ReauthModal, {
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      await wrapper.find('[data-testid="password-input"]').setValue('password')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(mockFetch).toHaveBeenCalled()
    })
  })
})
