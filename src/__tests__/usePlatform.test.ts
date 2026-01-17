import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { usePlatform } from '@/composables/usePlatform'

describe('usePlatform', () => {
  const originalNavigator = global.navigator

  afterEach(() => {
    // Restore original navigator
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true
    })
  })

  describe('isMac', () => {
    it('should return true on macOS', () => {
      Object.defineProperty(global, 'navigator', {
        value: { platform: 'MacIntel' },
        writable: true
      })

      const { isMac } = usePlatform()
      expect(isMac.value).toBe(true)
    })

    it('should return false on Windows', () => {
      Object.defineProperty(global, 'navigator', {
        value: { platform: 'Win32' },
        writable: true
      })

      const { isMac } = usePlatform()
      expect(isMac.value).toBe(false)
    })

    it('should return false on Linux', () => {
      Object.defineProperty(global, 'navigator', {
        value: { platform: 'Linux x86_64' },
        writable: true
      })

      const { isMac } = usePlatform()
      expect(isMac.value).toBe(false)
    })
  })

  describe('modifierKey', () => {
    it('should return ⌘ on macOS', () => {
      Object.defineProperty(global, 'navigator', {
        value: { platform: 'MacIntel' },
        writable: true
      })

      const { modifierKey } = usePlatform()
      expect(modifierKey.value).toBe('⌘')
    })

    it('should return Ctrl on Windows', () => {
      Object.defineProperty(global, 'navigator', {
        value: { platform: 'Win32' },
        writable: true
      })

      const { modifierKey } = usePlatform()
      expect(modifierKey.value).toBe('Ctrl')
    })

    it('should return Ctrl on Linux', () => {
      Object.defineProperty(global, 'navigator', {
        value: { platform: 'Linux x86_64' },
        writable: true
      })

      const { modifierKey } = usePlatform()
      expect(modifierKey.value).toBe('Ctrl')
    })
  })

  describe('modifierKeyDisplay', () => {
    it('should return ⌘ on macOS for display', () => {
      Object.defineProperty(global, 'navigator', {
        value: { platform: 'MacIntel' },
        writable: true
      })

      const { modifierKeyDisplay } = usePlatform()
      expect(modifierKeyDisplay.value).toBe('⌘')
    })

    it('should return Ctrl on Windows for display', () => {
      Object.defineProperty(global, 'navigator', {
        value: { platform: 'Win32' },
        writable: true
      })

      const { modifierKeyDisplay } = usePlatform()
      expect(modifierKeyDisplay.value).toBe('Ctrl')
    })
  })
})
