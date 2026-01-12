import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useTheme, type ThemeMode } from '@/composables/useTheme'

describe('useTheme', () => {
  let theme: ReturnType<typeof useTheme>

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear()

    // Reset document class
    document.documentElement.classList.remove('dark', 'light')

    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      }))
    })

    theme = useTheme()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial state', () => {
    it('should default to system mode', () => {
      expect(theme.mode.value).toBe('system')
    })

    it('should apply dark class when system prefers dark', () => {
      theme.init()
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })

  describe('setMode', () => {
    it('should set light mode', () => {
      theme.setMode('light')

      expect(theme.mode.value).toBe('light')
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('should set dark mode', () => {
      theme.setMode('dark')

      expect(theme.mode.value).toBe('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('should set system mode', () => {
      theme.setMode('system')

      expect(theme.mode.value).toBe('system')
    })

    it('should persist preference to localStorage', () => {
      theme.setMode('dark')

      expect(localStorage.getItem('theme-mode')).toBe('dark')
    })
  })

  describe('toggle', () => {
    it('should toggle from light to dark', () => {
      theme.setMode('light')
      theme.toggle()

      expect(theme.mode.value).toBe('dark')
    })

    it('should toggle from dark to light', () => {
      theme.setMode('dark')
      theme.toggle()

      expect(theme.mode.value).toBe('light')
    })

    it('should toggle from system to dark when system prefers light', () => {
      // Mock system prefers light
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn()
        }))
      })

      const newTheme = useTheme()
      newTheme.setMode('system')
      newTheme.toggle()

      expect(newTheme.mode.value).toBe('dark')
    })
  })

  describe('isDark', () => {
    it('should return true when dark mode is set', () => {
      theme.setMode('dark')

      expect(theme.isDark.value).toBe(true)
    })

    it('should return false when light mode is set', () => {
      theme.setMode('light')

      expect(theme.isDark.value).toBe(false)
    })

    it('should return true when system mode and system prefers dark', () => {
      theme.init()
      theme.setMode('system')

      expect(theme.isDark.value).toBe(true)
    })
  })

  describe('restore from localStorage', () => {
    it('should restore saved preference', () => {
      localStorage.setItem('theme-mode', 'dark')

      const newTheme = useTheme()
      newTheme.init()

      expect(newTheme.mode.value).toBe('dark')
    })

    it('should use system mode if no saved preference', () => {
      const newTheme = useTheme()
      newTheme.init()

      expect(newTheme.mode.value).toBe('system')
    })
  })
})
