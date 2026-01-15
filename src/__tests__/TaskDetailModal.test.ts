import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import TaskDetailModal from '@/components/TaskDetailModal.vue'
import { useAuthStore } from '@/stores/auth'
import type { Task } from '@/types'

const mockFetch = vi.fn()

const mockTask: Task = {
  id: 1,
  title: '測試任務',
  description: '任務描述內容',
  project_id: 1,
  column_id: 1,
  swimlane_id: 1,
  position: 1,
  is_active: true,
  color_id: 'blue',
  priority: 2,
  owner_id: 1,
  creator_id: 1,
  date_creation: 1704067200,
  date_modification: 1704153600,
  date_due: 1704240000
}

const mockColumns = [
  { id: 1, title: '待辦', position: 1, project_id: 1, task_limit: 0, nb_tasks: 2, tasks: [] },
  { id: 2, title: '進行中', position: 2, project_id: 1, task_limit: 5, nb_tasks: 1, tasks: [] },
  { id: 3, title: '完成', position: 3, project_id: 1, task_limit: 0, nb_tasks: 0, tasks: [] }
]

// Helper to create default JSON-RPC response
const createJsonRpcResponse = (result: unknown) => ({
  ok: true,
  json: () => Promise.resolve({
    jsonrpc: '2.0',
    id: 1,
    result
  })
})

describe('TaskDetailModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', mockFetch)
    vi.stubGlobal('alert', vi.fn())
    mockFetch.mockReset()
    // Default mock for subtasks fetch (SubtasksList onMounted)
    mockFetch.mockResolvedValue(createJsonRpcResponse([]))

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
      const wrapper = mount(TaskDetailModal, {
        props: {
          isOpen: false,
          task: mockTask,
          columns: mockColumns,
          projectId: 1
        },
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      expect(wrapper.find('[data-testid="task-detail-modal"]').exists()).toBe(false)
    })

    it('should render when open', () => {
      const wrapper = mount(TaskDetailModal, {
        props: {
          isOpen: true,
          task: mockTask,
          columns: mockColumns,
          projectId: 1
        },
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      expect(wrapper.find('[data-testid="task-detail-modal"]').exists()).toBe(true)
    })

    it('should display task title', () => {
      const wrapper = mount(TaskDetailModal, {
        props: {
          isOpen: true,
          task: mockTask,
          columns: mockColumns,
          projectId: 1
        },
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      expect(wrapper.text()).toContain('測試任務')
    })

    it('should display task ID', () => {
      const wrapper = mount(TaskDetailModal, {
        props: {
          isOpen: true,
          task: mockTask,
          columns: mockColumns,
          projectId: 1
        },
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      expect(wrapper.text()).toContain('#1')
    })

    it('should display task description', () => {
      const wrapper = mount(TaskDetailModal, {
        props: {
          isOpen: true,
          task: mockTask,
          columns: mockColumns,
          projectId: 1
        },
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      expect(wrapper.text()).toContain('任務描述內容')
    })

    it('should display task status as active', () => {
      const wrapper = mount(TaskDetailModal, {
        props: {
          isOpen: true,
          task: mockTask,
          columns: mockColumns,
          projectId: 1
        },
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      expect(wrapper.text()).toContain('開啟')
    })

    it('should display task status as closed', () => {
      const closedTask = { ...mockTask, is_active: false }
      const wrapper = mount(TaskDetailModal, {
        props: {
          isOpen: true,
          task: closedTask,
          columns: mockColumns,
          projectId: 1
        },
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      expect(wrapper.text()).toContain('已關閉')
    })
  })

  describe('editing', () => {
    it('should enter edit mode when clicking edit button', async () => {
      const wrapper = mount(TaskDetailModal, {
        props: {
          isOpen: true,
          task: mockTask,
          columns: mockColumns,
          projectId: 1
        },
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      await wrapper.find('[data-testid="edit-title-btn"]').trigger('click')
      expect(wrapper.find('[data-testid="title-input"]').exists()).toBe(true)
    })

    it('should emit update event when saving title', async () => {
      const wrapper = mount(TaskDetailModal, {
        props: {
          isOpen: true,
          task: mockTask,
          columns: mockColumns,
          projectId: 1
        },
        global: {
          stubs: {
            teleport: true,
            SubtasksList: true,
            CommentsList: true,
            TaskTags: true,
            AttachmentsList: true,
            TaskLinksList: true
          }
        }
      })

      // Reset and set mock for updateTask
      mockFetch.mockReset()
      mockFetch.mockResolvedValueOnce(createJsonRpcResponse(true))

      await wrapper.find('[data-testid="edit-title-btn"]').trigger('click')
      const input = wrapper.find('[data-testid="title-input"]')
      await input.setValue('更新的標題')
      await wrapper.find('[data-testid="save-title-btn"]').trigger('click')
      await flushPromises()

      expect(wrapper.emitted('updated')).toBeTruthy()
    })
  })

  describe('actions', () => {
    it('should emit close event when clicking close button', async () => {
      const wrapper = mount(TaskDetailModal, {
        props: {
          isOpen: true,
          task: mockTask,
          columns: mockColumns,
          projectId: 1
        },
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      await wrapper.find('[data-testid="close-modal-btn"]').trigger('click')
      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('should close task when clicking close task button', async () => {
      const wrapper = mount(TaskDetailModal, {
        props: {
          isOpen: true,
          task: mockTask,
          columns: mockColumns,
          projectId: 1
        },
        global: {
          stubs: {
            teleport: true,
            SubtasksList: true
          }
        }
      })

      mockFetch.mockReset()
      mockFetch.mockResolvedValueOnce(createJsonRpcResponse(true))

      await wrapper.find('[data-testid="close-task-btn"]').trigger('click')
      await flushPromises()

      expect(wrapper.emitted('updated')).toBeTruthy()
    })

    it('should open task when clicking open task button', async () => {
      const closedTask = { ...mockTask, is_active: false }
      const wrapper = mount(TaskDetailModal, {
        props: {
          isOpen: true,
          task: closedTask,
          columns: mockColumns,
          projectId: 1
        },
        global: {
          stubs: {
            teleport: true,
            SubtasksList: true
          }
        }
      })

      mockFetch.mockReset()
      mockFetch.mockResolvedValueOnce(createJsonRpcResponse(true))

      await wrapper.find('[data-testid="open-task-btn"]').trigger('click')
      await flushPromises()

      expect(wrapper.emitted('updated')).toBeTruthy()
    })
  })

  describe('color selection', () => {
    it('should display color options', () => {
      const wrapper = mount(TaskDetailModal, {
        props: {
          isOpen: true,
          task: mockTask,
          columns: mockColumns,
          projectId: 1
        },
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      expect(wrapper.find('[data-testid="color-selector"]').exists()).toBe(true)
    })

    it('should update color when clicking a color', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const wrapper = mount(TaskDetailModal, {
        props: {
          isOpen: true,
          task: mockTask,
          columns: mockColumns,
          projectId: 1
        },
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      await wrapper.find('[data-testid="color-red"]').trigger('click')
      await flushPromises()

      expect(wrapper.emitted('updated')).toBeTruthy()
    })
  })

  describe('dates', () => {
    it('should display creation date', () => {
      const wrapper = mount(TaskDetailModal, {
        props: {
          isOpen: true,
          task: mockTask,
          columns: mockColumns,
          projectId: 1
        },
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      // date_creation: 1704067200 = 2024-01-01
      expect(wrapper.text()).toContain('2024')
    })

    it('should display due date if set', () => {
      const wrapper = mount(TaskDetailModal, {
        props: {
          isOpen: true,
          task: mockTask,
          columns: mockColumns,
          projectId: 1
        },
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      // Task has date_due set
      expect(wrapper.find('[data-testid="due-date"]').exists()).toBe(true)
    })
  })
})
