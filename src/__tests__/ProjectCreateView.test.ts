import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import ProjectCreateView from '@/views/ProjectCreateView.vue'
import { useProjectDraftStore } from '@/stores/projectDraft'
import { useAuthStore } from '@/stores/auth'
import { useProjectsStore } from '@/stores/projects'

// Mock fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Create a mock router
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/projects/new', name: 'project-create', component: ProjectCreateView },
    { path: '/projects/:id/board', name: 'project-board', component: { template: '<div>Board</div>' } }
  ]
})

// Mock PhIcon component
const PhIcon = {
  name: 'PhIcon',
  props: ['icon'],
  template: '<span :data-icon="icon"></span>'
}

describe('ProjectCreateView', () => {
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

    // Navigate to the create page
    await router.push('/projects/new')
    await router.isReady()

    // Default mock for any API call
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        jsonrpc: '2.0',
        id: 1,
        result: []
      })
    })
  })

  function mountView() {
    return mount(ProjectCreateView, {
      global: {
        plugins: [router],
        stubs: {
          PhIcon,
          UserAvatar: true
        }
      }
    })
  }

  describe('rendering', () => {
    it('should render page title', () => {
      const wrapper = mountView()
      expect(wrapper.find('h1').text()).toBe('建立新專案')
    })

    it('should render create button', () => {
      const wrapper = mountView()
      const createBtn = wrapper.find('button.btn-primary')
      expect(createBtn.text()).toContain('建立專案')
    })

    it('should render cancel button', () => {
      const wrapper = mountView()
      const cancelBtn = wrapper.find('button.btn-secondary')
      expect(cancelBtn.text()).toBe('取消')
    })

    it('should render project name input', () => {
      const wrapper = mountView()
      const input = wrapper.find('#projectName')
      expect(input.exists()).toBe(true)
    })

    it('should render description textarea', () => {
      const wrapper = mountView()
      const textarea = wrapper.find('#projectDescription')
      expect(textarea.exists()).toBe(true)
    })

    it('should render identifier input', () => {
      const wrapper = mountView()
      const input = wrapper.find('#projectIdentifier')
      expect(input.exists()).toBe(true)
    })
  })

  describe('form validation', () => {
    it('should disable create button when name is empty', () => {
      const wrapper = mountView()
      const createBtn = wrapper.find('button.btn-primary')
      expect((createBtn.element as HTMLButtonElement).disabled).toBe(true)
    })

    it('should enable create button when name is filled', async () => {
      const wrapper = mountView()
      const draftStore = useProjectDraftStore()

      draftStore.updateDraft({ name: 'Test Project' })
      await wrapper.vm.$nextTick()

      const createBtn = wrapper.find('button.btn-primary')
      expect((createBtn.element as HTMLButtonElement).disabled).toBe(false)
    })
  })

  describe('draft store integration', () => {
    it('should update draft store when form fields change', async () => {
      const wrapper = mountView()
      const draftStore = useProjectDraftStore()

      const nameInput = wrapper.find('#projectName')
      await nameInput.setValue('New Project')

      expect(draftStore.draft.name).toBe('New Project')
    })

    it('should load data from draft store on mount', async () => {
      const draftStore = useProjectDraftStore()
      draftStore.updateDraft({
        name: 'Pre-filled Project',
        description: 'Pre-filled Description'
      })

      const wrapper = mountView()
      await wrapper.vm.$nextTick()

      expect((wrapper.find('#projectName').element as HTMLInputElement).value).toBe('Pre-filled Project')
      expect((wrapper.find('#projectDescription').element as HTMLTextAreaElement).value).toBe('Pre-filled Description')
    })
  })

  describe('management sections', () => {
    it('should render members section', () => {
      const wrapper = mountView()
      const membersSection = wrapper.text()
      expect(membersSection).toContain('成員')
    })

    it('should render categories section', () => {
      const wrapper = mountView()
      const categoriesSection = wrapper.text()
      expect(categoriesSection).toContain('類別')
    })

    it('should render columns section', () => {
      const wrapper = mountView()
      const columnsSection = wrapper.text()
      expect(columnsSection).toContain('欄位')
    })

    it('should render swimlanes section', () => {
      const wrapper = mountView()
      const swimlanesSection = wrapper.text()
      expect(swimlanesSection).toContain('泳道')
    })
  })

  describe('category management', () => {
    it('should add category to cache', async () => {
      const wrapper = mountView()
      const draftStore = useProjectDraftStore()

      // Find category name input and add button
      const inputs = wrapper.findAll('input[placeholder="類別名稱"]')
      expect(inputs.length).toBeGreaterThan(0)

      const categoryInput = inputs[0]
      await categoryInput.setValue('Bug')

      // Find the add button in the category section
      const categorySection = wrapper.findAll('.settings-card')[1]
      const addBtn = categorySection.find('button.btn-secondary')
      await addBtn.trigger('click')

      expect(draftStore.cachedCategories).toHaveLength(1)
      expect(draftStore.cachedCategories[0].name).toBe('Bug')
    })
  })

  describe('column management', () => {
    it('should add column to cache', async () => {
      const wrapper = mountView()
      const draftStore = useProjectDraftStore()

      const inputs = wrapper.findAll('input[placeholder="欄位名稱"]')
      expect(inputs.length).toBeGreaterThan(0)

      const columnInput = inputs[0]
      await columnInput.setValue('Backlog')

      const columnSection = wrapper.findAll('.settings-card')[2]
      const addBtn = columnSection.find('button.btn-secondary')
      await addBtn.trigger('click')

      expect(draftStore.cachedColumns).toHaveLength(1)
      expect(draftStore.cachedColumns[0].title).toBe('Backlog')
    })
  })

  describe('swimlane management', () => {
    it('should add swimlane to cache', async () => {
      const wrapper = mountView()
      const draftStore = useProjectDraftStore()

      const inputs = wrapper.findAll('input[placeholder="泳道名稱"]')
      expect(inputs.length).toBeGreaterThan(0)

      const swimlaneInput = inputs[0]
      await swimlaneInput.setValue('Sprint 1')

      const swimlaneSection = wrapper.findAll('.settings-card')[3]
      const addBtn = swimlaneSection.find('button.btn-secondary')
      await addBtn.trigger('click')

      expect(draftStore.cachedSwimlanes).toHaveLength(1)
      expect(draftStore.cachedSwimlanes[0].name).toBe('Sprint 1')
    })
  })

  describe('project creation', () => {
    it('should call createProject API on submit', async () => {
      const wrapper = mountView()
      const draftStore = useProjectDraftStore()

      draftStore.updateDraft({ name: 'Test Project' })
      await wrapper.vm.$nextTick()

      // Mock successful project creation
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: 123 // project ID
        })
      })

      const createBtn = wrapper.find('button.btn-primary')
      await createBtn.trigger('click')
      await flushPromises()

      // Verify createProject API was called
      const calls = mockFetch.mock.calls
      const createProjectCall = calls.find(call => {
        try {
          const body = JSON.parse(call[1].body)
          return body.method === 'createProject'
        } catch {
          return false
        }
      })

      expect(createProjectCall).toBeDefined()
      const body = JSON.parse(createProjectCall![1].body)
      expect(body.params.name).toBe('Test Project')
    })

    it('should reset draft store after successful creation', async () => {
      const wrapper = mountView()
      const draftStore = useProjectDraftStore()

      draftStore.updateDraft({ name: 'Test Project' })
      draftStore.addCachedCategory({ name: 'Bug' })
      await wrapper.vm.$nextTick()

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: 123
        })
      })

      const createBtn = wrapper.find('button.btn-primary')
      await createBtn.trigger('click')
      await flushPromises()

      expect(draftStore.draft.name).toBe('')
      expect(draftStore.cachedCategories).toHaveLength(0)
    })

    it('should show error message on creation failure', async () => {
      const wrapper = mountView()
      const draftStore = useProjectDraftStore()

      draftStore.updateDraft({ name: 'Test Project' })
      await wrapper.vm.$nextTick()

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: false
        })
      })

      const createBtn = wrapper.find('button.btn-primary')
      await createBtn.trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('建立專案失敗')
    })
  })

  describe('cancel action', () => {
    it('should reset draft store on cancel', async () => {
      const wrapper = mountView()
      const draftStore = useProjectDraftStore()

      draftStore.updateDraft({ name: 'Test Project' })
      await wrapper.vm.$nextTick()

      const cancelBtn = wrapper.find('button.btn-secondary')
      await cancelBtn.trigger('click')

      expect(draftStore.draft.name).toBe('')
    })
  })
})
