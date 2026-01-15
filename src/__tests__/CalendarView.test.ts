import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import CalendarView from '@/views/CalendarView.vue'
import { useAuthStore } from '@/stores/auth'
import type { Task } from '@/types'

const mockFetch = vi.fn()

const mockProject = {
  id: 1,
  name: '測試專案',
  description: '測試專案描述',
  is_active: true,
  owner_id: 1,
  is_public: false,
  is_private: false
}

const mockTasks: Task[] = [
  {
    id: 1,
    title: '今日到期任務',
    description: '',
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
    date_modification: 1704067200,
    date_due: Math.floor(Date.now() / 1000) // 今天
  },
  {
    id: 2,
    title: '明日到期任務',
    description: '',
    project_id: 1,
    column_id: 1,
    swimlane_id: 1,
    position: 2,
    is_active: true,
    color_id: 'red',
    priority: 1,
    owner_id: 1,
    creator_id: 1,
    date_creation: 1704067200,
    date_modification: 1704067200,
    date_due: Math.floor(Date.now() / 1000) + 86400 // 明天
  },
  {
    id: 3,
    title: '無到期日任務',
    description: '',
    project_id: 1,
    column_id: 1,
    swimlane_id: 1,
    position: 3,
    is_active: true,
    color_id: 'green',
    priority: 0,
    owner_id: 1,
    creator_id: 1,
    date_creation: 1704067200,
    date_modification: 1704067200,
    date_due: 0
  }
]

const createJsonRpcResponse = (result: unknown) => ({
  ok: true,
  json: () => Promise.resolve({
    jsonrpc: '2.0',
    id: 1,
    result
  })
})

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/projects/:id/calendar', name: 'project-calendar', component: CalendarView }
  ]
})

describe('CalendarView', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockReset()

    // Setup auth store
    const authStore = useAuthStore()
    authStore._setTestCredentials({ apiUrl: 'http://localhost/jsonrpc.php',
    username: 'admin',
    password: 'admin' })

    // Setup router
    router.push('/projects/1/calendar')
    await router.isReady()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('rendering', () => {
    it('should render calendar header', async () => {
      mockFetch.mockResolvedValue(createJsonRpcResponse(mockProject))
      mockFetch.mockResolvedValue(createJsonRpcResponse(mockTasks))

      const wrapper = mount(CalendarView, {
        global: {
          plugins: [router]
        }
      })
      await flushPromises()

      expect(wrapper.find('[data-testid="calendar-header"]').exists()).toBe(true)
    })

    it('should display current month and year', async () => {
      mockFetch.mockResolvedValue(createJsonRpcResponse(mockTasks))

      const wrapper = mount(CalendarView, {
        global: {
          plugins: [router]
        }
      })
      await flushPromises()

      const now = new Date()
      const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月',
                         '七月', '八月', '九月', '十月', '十一月', '十二月']
      expect(wrapper.text()).toContain(monthNames[now.getMonth()])
      expect(wrapper.text()).toContain(now.getFullYear().toString())
    })

    it('should display weekday headers', async () => {
      mockFetch.mockResolvedValue(createJsonRpcResponse(mockTasks))

      const wrapper = mount(CalendarView, {
        global: {
          plugins: [router]
        }
      })
      await flushPromises()

      expect(wrapper.text()).toContain('日')
      expect(wrapper.text()).toContain('一')
      expect(wrapper.text()).toContain('二')
      expect(wrapper.text()).toContain('三')
      expect(wrapper.text()).toContain('四')
      expect(wrapper.text()).toContain('五')
      expect(wrapper.text()).toContain('六')
    })

    it('should mark today', async () => {
      mockFetch.mockResolvedValue(createJsonRpcResponse(mockTasks))

      const wrapper = mount(CalendarView, {
        global: {
          plugins: [router]
        }
      })
      await flushPromises()

      expect(wrapper.find('[data-testid="today"]').exists()).toBe(true)
    })
  })

  describe('navigation', () => {
    it('should navigate to previous month', async () => {
      mockFetch.mockResolvedValue(createJsonRpcResponse(mockTasks))

      const wrapper = mount(CalendarView, {
        global: {
          plugins: [router]
        }
      })
      await flushPromises()

      const prevButton = wrapper.find('[data-testid="prev-month"]')
      await prevButton.trigger('click')
      await flushPromises()

      const now = new Date()
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月',
                         '七月', '八月', '九月', '十月', '十一月', '十二月']
      expect(wrapper.text()).toContain(monthNames[prevMonth.getMonth()])
    })

    it('should navigate to next month', async () => {
      mockFetch.mockResolvedValue(createJsonRpcResponse(mockTasks))

      const wrapper = mount(CalendarView, {
        global: {
          plugins: [router]
        }
      })
      await flushPromises()

      const nextButton = wrapper.find('[data-testid="next-month"]')
      await nextButton.trigger('click')
      await flushPromises()

      const now = new Date()
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月',
                         '七月', '八月', '九月', '十月', '十一月', '十二月']
      expect(wrapper.text()).toContain(monthNames[nextMonth.getMonth()])
    })

    it('should navigate to today', async () => {
      mockFetch.mockResolvedValue(createJsonRpcResponse(mockTasks))

      const wrapper = mount(CalendarView, {
        global: {
          plugins: [router]
        }
      })
      await flushPromises()

      // Navigate away first
      await wrapper.find('[data-testid="prev-month"]').trigger('click')
      await wrapper.find('[data-testid="prev-month"]').trigger('click')
      await flushPromises()

      // Then click today
      await wrapper.find('[data-testid="today-btn"]').trigger('click')
      await flushPromises()

      const now = new Date()
      const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月',
                         '七月', '八月', '九月', '十月', '十一月', '十二月']
      expect(wrapper.text()).toContain(monthNames[now.getMonth()])
      expect(wrapper.text()).toContain(now.getFullYear().toString())
    })
  })

  describe('tasks display', () => {
    it('should display tasks with due dates', async () => {
      mockFetch.mockResolvedValue(createJsonRpcResponse(mockTasks))

      const wrapper = mount(CalendarView, {
        global: {
          plugins: [router]
        }
      })
      await flushPromises()

      // Tasks with due dates should be visible
      expect(wrapper.text()).toContain('今日到期任務')
    })

    it('should show task count per day', async () => {
      mockFetch.mockResolvedValue(createJsonRpcResponse(mockTasks))

      const wrapper = mount(CalendarView, {
        global: {
          plugins: [router]
        }
      })
      await flushPromises()

      // Day cells should show task indicators
      expect(wrapper.find('.calendar-task').exists()).toBe(true)
    })
  })
})
