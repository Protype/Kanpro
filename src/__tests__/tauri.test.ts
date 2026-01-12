import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useTauri } from '@/composables/useTauri'

describe('useTauri', () => {
  let tauri: ReturnType<typeof useTauri>

  beforeEach(() => {
    // Clear any window.__TAURI__ mock
    delete (window as unknown as Record<string, unknown>).__TAURI__
    tauri = useTauri()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('isTauri', () => {
    it('should return false in browser environment', () => {
      expect(tauri.isTauri.value).toBe(false)
    })

    it('should return true when __TAURI__ exists', () => {
      ;(window as unknown as Record<string, unknown>).__TAURI__ = {}
      const newTauri = useTauri()
      expect(newTauri.isTauri.value).toBe(true)
    })
  })

  describe('storage', () => {
    it('should use localStorage when not in Tauri', async () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('test-value')

      await tauri.storage.set('key', 'value')
      expect(setItemSpy).toHaveBeenCalledWith('key', 'value')

      const result = await tauri.storage.get('key')
      expect(getItemSpy).toHaveBeenCalledWith('key')
      expect(result).toBe('test-value')
    })

    it('should remove item from localStorage', async () => {
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem')

      await tauri.storage.remove('key')
      expect(removeItemSpy).toHaveBeenCalledWith('key')
    })
  })

  describe('notifications', () => {
    it('should check notification permission', async () => {
      expect(typeof tauri.notifications.isPermissionGranted).toBe('function')
    })

    it('should request notification permission', async () => {
      expect(typeof tauri.notifications.requestPermission).toBe('function')
    })

    it('should send notification', async () => {
      expect(typeof tauri.notifications.sendNotification).toBe('function')
    })
  })

  describe('window', () => {
    it('should have minimize function', () => {
      expect(typeof tauri.window.minimize).toBe('function')
    })

    it('should have close function', () => {
      expect(typeof tauri.window.close).toBe('function')
    })

    it('should have hide function', () => {
      expect(typeof tauri.window.hide).toBe('function')
    })

    it('should have show function', () => {
      expect(typeof tauri.window.show).toBe('function')
    })
  })
})
