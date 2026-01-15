import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAttachmentsStore } from '@/stores/attachments'
import { useAuthStore } from '@/stores/auth'
import type { TaskFile } from '@/types'

const mockFetch = vi.fn()

const mockAttachments: TaskFile[] = [
  {
    id: 1,
    name: 'screenshot.png',
    path: 'files/123/screenshot.png',
    is_image: true,
    task_id: 1,
    user_id: 1,
    date: 1704067200,
    size: 102400
  },
  {
    id: 2,
    name: 'document.pdf',
    path: 'files/123/document.pdf',
    is_image: false,
    task_id: 1,
    user_id: 1,
    date: 1704153600,
    size: 512000
  },
  {
    id: 3,
    name: 'data.xlsx',
    path: 'files/123/data.xlsx',
    is_image: false,
    task_id: 1,
    user_id: 2,
    date: 1704240000,
    size: 256000
  }
]

describe('Attachments Store', () => {
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

  describe('initial state', () => {
    it('should have empty attachments', () => {
      const store = useAttachmentsStore()

      expect(store.attachments).toEqual([])
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('fetchAttachments', () => {
    it('should fetch and store attachments', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockAttachments
        })
      })

      const store = useAttachmentsStore()
      await store.fetchAttachments(1)

      expect(store.attachments).toEqual(mockAttachments)
      expect(store.isLoading).toBe(false)
    })

    it('should handle fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const store = useAttachmentsStore()
      await store.fetchAttachments(1)

      expect(store.attachments).toEqual([])
      expect(store.error).toBe('Network error')
    })

    it('should call API with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockAttachments
        })
      })

      const store = useAttachmentsStore()
      await store.fetchAttachments(5)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('getAllTaskFiles')
      expect(callBody.params).toEqual({ task_id: 5 })
    })
  })

  describe('uploadAttachment', () => {
    it('should upload attachment and return id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: 10
        })
      })

      const store = useAttachmentsStore()
      // Base64 encoded content
      const result = await store.uploadAttachment(1, 1, 'test.txt', 'VGVzdCBjb250ZW50')

      expect(result).toBe(10)
    })

    it('should call API with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: 5
        })
      })

      const store = useAttachmentsStore()
      await store.uploadAttachment(10, 1, 'file.pdf', 'base64data')

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('createTaskFile')
      expect(callBody.params).toEqual({
        project_id: 1,
        task_id: 10,
        filename: 'file.pdf',
        blob: 'base64data'
      })
    })

    it('should throw on upload error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Upload failed'))

      const store = useAttachmentsStore()

      await expect(
        store.uploadAttachment(1, 1, 'test.txt', 'data')
      ).rejects.toThrow('Upload failed')
    })
  })

  describe('removeAttachment', () => {
    it('should remove attachment', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const store = useAttachmentsStore()
      const result = await store.removeAttachment(1)

      expect(result).toBe(true)
    })

    it('should call API with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const store = useAttachmentsStore()
      await store.removeAttachment(5)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('removeTaskFile')
      expect(callBody.params).toEqual({ file_id: 5 })
    })
  })

  describe('computed properties', () => {
    it('should return attachments count', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockAttachments
        })
      })

      const store = useAttachmentsStore()
      await store.fetchAttachments(1)

      expect(store.attachmentsCount).toBe(3)
    })

    it('should return 0 count when no attachments', () => {
      const store = useAttachmentsStore()
      expect(store.attachmentsCount).toBe(0)
    })

    it('should return image attachments', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockAttachments
        })
      })

      const store = useAttachmentsStore()
      await store.fetchAttachments(1)

      expect(store.imageAttachments).toHaveLength(1)
      expect(store.imageAttachments[0].name).toBe('screenshot.png')
    })
  })

  describe('clearAttachments', () => {
    it('should clear all attachments', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          jsonrpc: '2.0',
          id: 1,
          result: mockAttachments
        })
      })

      const store = useAttachmentsStore()
      await store.fetchAttachments(1)
      expect(store.attachments.length).toBe(3)

      store.clearAttachments()

      expect(store.attachments).toEqual([])
      expect(store.error).toBeNull()
    })
  })
})
