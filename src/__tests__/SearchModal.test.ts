import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import SearchModal from '@/components/SearchModal.vue'
import { useAuthStore } from '@/stores/auth'
import type { Task } from '@/types'

const mockFetch = vi.fn()

const mockTasks: Task[] = [
  {
    id: 1,
    title: '測試任務一',
    description: '描述內容',
    project_id: 1,
    column_id: 1,
    swimlane_id: 1,
    position: 1,
    is_active: true,
    color_id: 'blue',
    priority: 0,
    owner_id: 1,
    creator_id: 1,
    date_creation: 1704067200,
    date_modification: 1704067200
  },
  {
    id: 2,
    title: '測試任務二',
    description: '另一個描述',
    project_id: 1,
    column_id: 2,
    swimlane_id: 1,
    position: 1,
    is_active: true,
    color_id: 'green',
    priority: 1,
    owner_id: 2,
    creator_id: 1,
    date_creation: 1704067200,
    date_modification: 1704067200
  }
]

describe('SearchModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockReset()

    // Setup auth store with credentials
    const authStore = useAuthStore()
    authStore._setTestCredentials({ apiUrl: 'http://localhost/jsonrpc.php',
    username: 'admin',
    password: 'admin' })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('rendering', () => {
    it('should not render when closed', () => {
      const wrapper = mount(SearchModal, {
        props: {
          isOpen: false,
          projectId: 1
        },
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      expect(wrapper.find('[data-testid="search-modal"]').exists()).toBe(false)
    })

    it('should render when open', () => {
      const wrapper = mount(SearchModal, {
        props: {
          isOpen: true,
          projectId: 1
        },
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      expect(wrapper.find('[data-testid="search-modal"]').exists()).toBe(true)
    })

    it('should have search input', () => {
      const wrapper = mount(SearchModal, {
        props: {
          isOpen: true,
          projectId: 1
        },
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      expect(wrapper.find('[data-testid="search-input"]').exists()).toBe(true)
    })
  })

  describe('search functionality', () => {
    it('should search when typing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockTasks
        })
      })

      const wrapper = mount(SearchModal, {
        props: {
          isOpen: true,
          projectId: 1
        },
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      const input = wrapper.find('[data-testid="search-input"]')
      await input.setValue('測試')

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 350))
      await flushPromises()

      expect(wrapper.findAll('[data-testid="search-result-item"]').length).toBe(2)
    })

    it('should display task titles in results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockTasks
        })
      })

      const wrapper = mount(SearchModal, {
        props: {
          isOpen: true,
          projectId: 1
        },
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      const input = wrapper.find('[data-testid="search-input"]')
      await input.setValue('測試')

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 350))
      await flushPromises()

      expect(wrapper.text()).toContain('測試任務一')
      expect(wrapper.text()).toContain('測試任務二')
    })

    it('should show no results message when empty', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: []
        })
      })

      const wrapper = mount(SearchModal, {
        props: {
          isOpen: true,
          projectId: 1
        },
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      const input = wrapper.find('[data-testid="search-input"]')
      await input.setValue('不存在的任務')

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 350))
      await flushPromises()

      expect(wrapper.text()).toContain('找不到符合的任務')
    })
  })

  describe('events', () => {
    it('should emit close when clicking backdrop', async () => {
      const wrapper = mount(SearchModal, {
        props: {
          isOpen: true,
          projectId: 1
        },
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      await wrapper.find('[data-testid="search-backdrop"]').trigger('click')
      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('should emit select when clicking result', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockTasks
        })
      })

      const wrapper = mount(SearchModal, {
        props: {
          isOpen: true,
          projectId: 1
        },
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      const input = wrapper.find('[data-testid="search-input"]')
      await input.setValue('測試')

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 350))
      await flushPromises()

      await wrapper.findAll('[data-testid="search-result-item"]')[0].trigger('click')
      expect(wrapper.emitted('select')).toBeTruthy()
      expect(wrapper.emitted('select')![0]).toEqual([mockTasks[0]])
    })
  })

  describe('keyboard navigation', () => {
    it('should close on escape key', async () => {
      const wrapper = mount(SearchModal, {
        props: {
          isOpen: true,
          projectId: 1
        },
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      await wrapper.find('[data-testid="search-input"]').trigger('keyup.escape')
      expect(wrapper.emitted('close')).toBeTruthy()
    })
  })
})
