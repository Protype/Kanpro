import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} }
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock navigator.language
const originalNavigator = window.navigator

describe('i18n', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.resetModules()
  })

  afterEach(() => {
    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      writable: true
    })
  })

  describe('detectLocale', () => {
    it('should return localStorage value when kanpro-locale is set', async () => {
      localStorageMock.setItem('kanpro-locale', 'zh_TW')

      const { detectLocale } = await import('@/i18n')
      const result = detectLocale()

      expect(result).toBe('zh_TW')
    })

    it('should return user.language when localStorage is not set', async () => {
      const { detectLocale } = await import('@/i18n')
      const result = detectLocale('zh_TW')

      expect(result).toBe('zh_TW')
    })

    it('should prioritize localStorage over user.language', async () => {
      localStorageMock.setItem('kanpro-locale', 'en_US')

      const { detectLocale } = await import('@/i18n')
      const result = detectLocale('zh_TW')

      expect(result).toBe('en_US')
    })

    it('should return browser language when no localStorage or user.language', async () => {
      Object.defineProperty(window, 'navigator', {
        value: { language: 'zh-TW' },
        writable: true
      })

      const { detectLocale } = await import('@/i18n')
      const result = detectLocale(null)

      expect(result).toBe('zh_TW')
    })

    it('should return default en_US when no supported locale found', async () => {
      Object.defineProperty(window, 'navigator', {
        value: { language: 'fr-FR' },
        writable: true
      })

      const { detectLocale } = await import('@/i18n')
      const result = detectLocale(null)

      expect(result).toBe('en_US')
    })

    it('should ignore unsupported localStorage value', async () => {
      localStorageMock.setItem('kanpro-locale', 'ja_JP')

      const { detectLocale } = await import('@/i18n')
      const result = detectLocale('zh_TW')

      expect(result).toBe('zh_TW')
    })

    it('should ignore unsupported user.language value', async () => {
      Object.defineProperty(window, 'navigator', {
        value: { language: 'en-US' },
        writable: true
      })

      const { detectLocale } = await import('@/i18n')
      const result = detectLocale('ja_JP')

      expect(result).toBe('en_US')
    })
  })

  describe('setLocale', () => {
    it('should set locale to i18n and localStorage', async () => {
      const { setLocale, i18n } = await import('@/i18n')

      setLocale('zh_TW')

      expect(i18n.global.locale.value).toBe('zh_TW')
      expect(localStorageMock.getItem('kanpro-locale')).toBe('zh_TW')
    })

    it('should set document.documentElement.lang', async () => {
      const { setLocale } = await import('@/i18n')

      setLocale('zh_TW')

      expect(document.documentElement.lang).toBe('zh-TW')
    })
  })

  describe('clearLocaleOverride', () => {
    it('should remove kanpro-locale from localStorage', async () => {
      localStorageMock.setItem('kanpro-locale', 'zh_TW')

      const { clearLocaleOverride } = await import('@/i18n')
      clearLocaleOverride()

      expect(localStorageMock.getItem('kanpro-locale')).toBeNull()
    })
  })

  describe('SUPPORTED_LOCALES', () => {
    it('should include en_US and zh_TW', async () => {
      const { SUPPORTED_LOCALES } = await import('@/i18n')

      expect(SUPPORTED_LOCALES).toContain('en_US')
      expect(SUPPORTED_LOCALES).toContain('zh_TW')
    })
  })

  describe('i18n instance', () => {
    it('should have en_US as default locale', async () => {
      const { i18n } = await import('@/i18n')

      expect(i18n.global.locale.value).toBe('en_US')
    })

    it('should have en_US as fallback locale', async () => {
      const { i18n } = await import('@/i18n')

      expect(i18n.global.fallbackLocale.value).toBe('en_US')
    })

    it('should have messages for en_US', async () => {
      const { i18n } = await import('@/i18n')

      expect(i18n.global.messages.value.en_US).toBeDefined()
      expect(i18n.global.messages.value.en_US.common).toBeDefined()
    })

    it('should have messages for zh_TW', async () => {
      const { i18n } = await import('@/i18n')

      expect(i18n.global.messages.value.zh_TW).toBeDefined()
      expect(i18n.global.messages.value.zh_TW.common).toBeDefined()
    })

    it('should translate common.save correctly', async () => {
      const { i18n } = await import('@/i18n')

      expect(i18n.global.t('common.save')).toBe('Save')

      i18n.global.locale.value = 'zh_TW'
      expect(i18n.global.t('common.save')).toBe('儲存')
    })
  })
})
