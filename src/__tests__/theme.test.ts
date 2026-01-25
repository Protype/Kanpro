import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useTheme, THEMES, type ThemeName } from '@/composables/useTheme'

describe('useTheme', () => {
  let theme: ReturnType<typeof useTheme>

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear()

    // Reset document class
    document.documentElement.classList.remove('dark', 'light')
    THEMES.forEach(t => {
      document.documentElement.classList.remove(`theme-${t.id}`)
    })

    theme = useTheme()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial state', () => {
    it('should default to twenty-crm theme', () => {
      expect(theme.currentTheme.value).toBe('twenty-crm')
    })

    it('should have correct theme info', () => {
      expect(theme.themeInfo.value.nameKey).toBe('theme.twentyCrm')
      expect(theme.themeInfo.value.isDark).toBe(false)
    })
  })

  describe('setTheme', () => {
    it('should set twenty-crm theme', () => {
      theme.setTheme('twenty-crm')

      expect(theme.currentTheme.value).toBe('twenty-crm')
      expect(document.documentElement.classList.contains('theme-twenty-crm')).toBe(true)
    })

    it('should set github-dark theme', () => {
      theme.setTheme('github-dark')

      expect(theme.currentTheme.value).toBe('github-dark')
      expect(document.documentElement.classList.contains('theme-github-dark')).toBe(true)
    })

    it('should set dracula theme', () => {
      theme.setTheme('dracula')

      expect(theme.currentTheme.value).toBe('dracula')
      expect(document.documentElement.classList.contains('theme-dracula')).toBe(true)
    })

    it('should remove old theme class when switching', () => {
      theme.setTheme('twenty-crm')
      theme.setTheme('github-dark')

      expect(document.documentElement.classList.contains('theme-twenty-crm')).toBe(false)
      expect(document.documentElement.classList.contains('theme-github-dark')).toBe(true)
    })

    it('should persist preference to localStorage', () => {
      theme.setTheme('dracula')

      expect(localStorage.getItem('kanpro-theme')).toBe('dracula')
    })

    it('should fallback to default theme for unknown theme', () => {
      theme.setTheme('unknown-theme' as ThemeName)

      expect(theme.currentTheme.value).toBe('twenty-crm')
    })
  })

  describe('isDark', () => {
    it('should return false for twenty-crm theme', () => {
      theme.setTheme('twenty-crm')

      expect(theme.isDark.value).toBe(false)
    })

    it('should return true for github-dark theme', () => {
      theme.setTheme('github-dark')

      expect(theme.isDark.value).toBe(true)
    })

    it('should return true for dracula theme', () => {
      theme.setTheme('dracula')

      expect(theme.isDark.value).toBe(true)
    })
  })

  describe('themeInfo', () => {
    it('should return correct info for twenty-crm', () => {
      theme.setTheme('twenty-crm')

      expect(theme.themeInfo.value.id).toBe('twenty-crm')
      expect(theme.themeInfo.value.nameKey).toBe('theme.twentyCrm')
      expect(theme.themeInfo.value.descriptionKey).toBe('theme.twentyCrmDesc')
      expect(theme.themeInfo.value.isDark).toBe(false)
    })

    it('should return correct info for github-dark', () => {
      theme.setTheme('github-dark')

      expect(theme.themeInfo.value.id).toBe('github-dark')
      expect(theme.themeInfo.value.nameKey).toBe('theme.githubDark')
      expect(theme.themeInfo.value.descriptionKey).toBe('theme.githubDarkDesc')
      expect(theme.themeInfo.value.isDark).toBe(true)
    })

    it('should return correct info for dracula', () => {
      theme.setTheme('dracula')

      expect(theme.themeInfo.value.id).toBe('dracula')
      expect(theme.themeInfo.value.nameKey).toBe('theme.dracula')
      expect(theme.themeInfo.value.descriptionKey).toBe('theme.draculaDesc')
      expect(theme.themeInfo.value.isDark).toBe(true)
    })
  })

  describe('init', () => {
    it('should restore saved preference', () => {
      localStorage.setItem('kanpro-theme', 'dracula')

      const newTheme = useTheme()
      newTheme.init()

      expect(newTheme.currentTheme.value).toBe('dracula')
    })

    it('should use default theme if no saved preference', () => {
      const newTheme = useTheme()
      newTheme.init()

      expect(newTheme.currentTheme.value).toBe('twenty-crm')
    })

    it('should migrate old light mode to twenty-crm', () => {
      localStorage.setItem('kanpro-theme', 'light')

      const newTheme = useTheme()
      newTheme.init()

      expect(newTheme.currentTheme.value).toBe('twenty-crm')
    })

    it('should migrate old dark mode to github-dark', () => {
      localStorage.setItem('kanpro-theme', 'dark')

      const newTheme = useTheme()
      newTheme.init()

      expect(newTheme.currentTheme.value).toBe('github-dark')
    })

    it('should migrate old system mode to twenty-crm', () => {
      localStorage.setItem('kanpro-theme', 'system')

      const newTheme = useTheme()
      newTheme.init()

      expect(newTheme.currentTheme.value).toBe('twenty-crm')
    })

    it('should migrate from old theme-mode storage key', () => {
      localStorage.setItem('theme-mode', 'dark')

      const newTheme = useTheme()
      newTheme.init()

      expect(newTheme.currentTheme.value).toBe('github-dark')
      expect(localStorage.getItem('theme-mode')).toBeNull()
      expect(localStorage.getItem('kanpro-theme')).toBe('github-dark')
    })

    it('should apply theme class on init', () => {
      localStorage.setItem('kanpro-theme', 'github-dark')

      const newTheme = useTheme()
      newTheme.init()

      expect(document.documentElement.classList.contains('theme-github-dark')).toBe(true)
    })
  })

  describe('THEMES constant', () => {
    it('should have three themes', () => {
      expect(THEMES.length).toBe(3)
    })

    it('should have twenty-crm as first theme', () => {
      expect(THEMES[0].id).toBe('twenty-crm')
    })

    it('should have all required fields', () => {
      THEMES.forEach(theme => {
        expect(theme.id).toBeDefined()
        expect(theme.nameKey).toBeDefined()
        expect(theme.descriptionKey).toBeDefined()
        expect(typeof theme.isDark).toBe('boolean')
      })
    })
  })
})
