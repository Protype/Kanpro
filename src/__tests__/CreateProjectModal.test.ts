import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createI18n } from 'vue-i18n'
import CreateProjectModal from '@/components/CreateProjectModal.vue'
import { useProjectDraftStore } from '@/stores/projectDraft'
import { useAuthStore } from '@/stores/auth'
import en_US from '@/i18n/locales/en_US.json'
import zh_TW from '@/i18n/locales/zh_TW.json'

// Mock fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Create i18n instance for tests
const i18n = createI18n({
  legacy: false,
  locale: 'en_US',
  fallbackLocale: 'en_US',
  messages: { en_US, zh_TW }
})

// Create a mock router
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/projects/new', name: 'project-create', component: { template: '<div>Create</div>' } }
  ]
})

// Mock PhIcon component
const PhIcon = {
  name: 'PhIcon',
  props: ['icon'],
  template: '<span :data-icon="icon"></span>'
}

describe('CreateProjectModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockFetch.mockReset()

    // Setup auth store
    const authStore = useAuthStore()
    authStore._setTestCredentials({
      apiUrl: 'http://localhost/jsonrpc.php',
      username: 'admin',
      password: 'admin'
    })

    // Mock users API response
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        jsonrpc: '2.0',
        id: 1,
        result: []
      })
    })
  })

  function mountModal(props = { isOpen: true }) {
    return mount(CreateProjectModal, {
      props,
      global: {
        plugins: [router, i18n],
        stubs: {
          Teleport: true,
          PhIcon,
          UserAvatar: true
        }
      }
    })
  }

  describe('expand button', () => {
    it('should render expand button in header', () => {
      const wrapper = mountModal()
      const expandButton = wrapper.find('[data-testid="expand-button"]')

      expect(expandButton.exists()).toBe(true)
    })

    it('should have arrows-out icon', () => {
      const wrapper = mountModal()
      const expandButton = wrapper.find('[data-testid="expand-button"]')
      const icon = expandButton.find('[data-icon="arrows-out"]')

      expect(icon.exists()).toBe(true)
    })

    it('should navigate to /projects/new on click', async () => {
      const wrapper = mountModal()
      const expandButton = wrapper.find('[data-testid="expand-button"]')

      await expandButton.trigger('click')
      await flushPromises()

      expect(router.currentRoute.value.path).toBe('/projects/new')
    })

    it('should emit close event on expand', async () => {
      const wrapper = mountModal()
      const expandButton = wrapper.find('[data-testid="expand-button"]')

      await expandButton.trigger('click')

      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('should save draft data to store before expanding', async () => {
      const wrapper = mountModal()
      const draftStore = useProjectDraftStore()

      // Fill in form data
      const nameInput = wrapper.find('#project-name')
      await nameInput.setValue('Test Project')

      const descInput = wrapper.find('#project-description')
      await descInput.setValue('Test Description')

      const expandButton = wrapper.find('[data-testid="expand-button"]')
      await expandButton.trigger('click')

      expect(draftStore.draft.name).toBe('Test Project')
      expect(draftStore.draft.description).toBe('Test Description')
    })

    it('should save advanced settings to store before expanding', async () => {
      const wrapper = mountModal()
      const draftStore = useProjectDraftStore()

      // Fill in basic data
      const nameInput = wrapper.find('#project-name')
      await nameInput.setValue('Test Project')

      // Toggle advanced settings
      const advancedToggle = wrapper.find('button[type="button"]')
      await advancedToggle.trigger('click')

      // Fill in start date
      const startDateInput = wrapper.find('#project-start-date')
      if (startDateInput.exists()) {
        await startDateInput.setValue('2025-01-01')
      }

      const expandButton = wrapper.find('[data-testid="expand-button"]')
      await expandButton.trigger('click')

      expect(draftStore.draft.name).toBe('Test Project')
      expect(draftStore.draft.startDate).toBe('2025-01-01')
    })
  })

  describe('form fields', () => {
    it('should render project name input', () => {
      const wrapper = mountModal()
      const nameInput = wrapper.find('#project-name')

      expect(nameInput.exists()).toBe(true)
    })

    it('should render description textarea', () => {
      const wrapper = mountModal()
      const descInput = wrapper.find('#project-description')

      expect(descInput.exists()).toBe(true)
    })

    it('should render identifier input', () => {
      const wrapper = mountModal()
      const identifierInput = wrapper.find('#project-identifier')

      expect(identifierInput.exists()).toBe(true)
    })
  })
})
