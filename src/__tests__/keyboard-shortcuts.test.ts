import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'

describe('useKeyboardShortcuts', () => {
  let shortcuts: ReturnType<typeof useKeyboardShortcuts>
  let cleanup: () => void

  beforeEach(() => {
    shortcuts = useKeyboardShortcuts()
    cleanup = shortcuts.init()
  })

  afterEach(() => {
    cleanup()
  })

  function dispatchKeyEvent(key: string, options: Partial<KeyboardEventInit> = {}) {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      ...options
    })
    document.dispatchEvent(event)
    return event
  }

  describe('init', () => {
    it('should return cleanup function', () => {
      expect(typeof cleanup).toBe('function')
    })
  })

  describe('register', () => {
    it('should register a shortcut', () => {
      const handler = vi.fn()
      shortcuts.register('k', handler)

      dispatchKeyEvent('k')

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should register shortcut with ctrl modifier', () => {
      const handler = vi.fn()
      shortcuts.register('k', handler, { ctrl: true })

      dispatchKeyEvent('k', { ctrlKey: true })

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should register shortcut with meta modifier', () => {
      const handler = vi.fn()
      shortcuts.register('k', handler, { meta: true })

      dispatchKeyEvent('k', { metaKey: true })

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should register shortcut with shift modifier', () => {
      const handler = vi.fn()
      shortcuts.register('K', handler, { shift: true })

      dispatchKeyEvent('K', { shiftKey: true })

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should not trigger without required modifier', () => {
      const handler = vi.fn()
      shortcuts.register('k', handler, { ctrl: true })

      dispatchKeyEvent('k')

      expect(handler).not.toHaveBeenCalled()
    })

    it('should return unregister function', () => {
      const handler = vi.fn()
      const unregister = shortcuts.register('k', handler)

      unregister()
      dispatchKeyEvent('k')

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('unregister', () => {
    it('should unregister a shortcut', () => {
      const handler = vi.fn()
      shortcuts.register('k', handler)

      shortcuts.unregister('k')
      dispatchKeyEvent('k')

      expect(handler).not.toHaveBeenCalled()
    })

    it('should unregister shortcut with modifiers', () => {
      const handler = vi.fn()
      shortcuts.register('k', handler, { ctrl: true })

      shortcuts.unregister('k', { ctrl: true })
      dispatchKeyEvent('k', { ctrlKey: true })

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('isInputFocused', () => {
    it('should not trigger when input is focused', () => {
      const handler = vi.fn()
      shortcuts.register('k', handler)

      const input = document.createElement('input')
      document.body.appendChild(input)
      input.focus()

      dispatchKeyEvent('k')

      expect(handler).not.toHaveBeenCalled()

      document.body.removeChild(input)
    })

    it('should not trigger when textarea is focused', () => {
      const handler = vi.fn()
      shortcuts.register('k', handler)

      const textarea = document.createElement('textarea')
      document.body.appendChild(textarea)
      textarea.focus()

      dispatchKeyEvent('k')

      expect(handler).not.toHaveBeenCalled()

      document.body.removeChild(textarea)
    })

    it('should trigger when contenteditable is not focused', () => {
      const handler = vi.fn()
      shortcuts.register('k', handler)

      dispatchKeyEvent('k')

      expect(handler).toHaveBeenCalled()
    })
  })

  describe('multiple shortcuts', () => {
    it('should support multiple shortcuts', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      shortcuts.register('a', handler1)
      shortcuts.register('b', handler2)

      dispatchKeyEvent('a')
      dispatchKeyEvent('b')

      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
    })

    it('should override existing shortcut', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      shortcuts.register('k', handler1)
      shortcuts.register('k', handler2)

      dispatchKeyEvent('k')

      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).toHaveBeenCalledTimes(1)
    })
  })

  describe('getShortcuts', () => {
    it('should return registered shortcuts', () => {
      shortcuts.register('k', vi.fn(), { description: 'Open search' })
      shortcuts.register('n', vi.fn(), { description: 'New task' })

      const registered = shortcuts.getShortcuts()

      expect(registered).toHaveLength(2)
      expect(registered[0].description).toBe('Open search')
      expect(registered[1].description).toBe('New task')
    })
  })

  describe('setEnabled', () => {
    it('should disable all shortcuts', () => {
      const handler = vi.fn()
      shortcuts.register('k', handler)

      shortcuts.setEnabled(false)
      dispatchKeyEvent('k')

      expect(handler).not.toHaveBeenCalled()
    })

    it('should re-enable shortcuts', () => {
      const handler = vi.fn()
      shortcuts.register('k', handler)

      shortcuts.setEnabled(false)
      shortcuts.setEnabled(true)
      dispatchKeyEvent('k')

      expect(handler).toHaveBeenCalledTimes(1)
    })
  })

  describe('sequence shortcuts', () => {
    it('should register sequence shortcut v+b', async () => {
      const handler = vi.fn()
      shortcuts.registerSequence(['v', 'b'], handler, { description: 'Board view' })

      dispatchKeyEvent('v')
      await new Promise(resolve => setTimeout(resolve, 50))
      dispatchKeyEvent('b')

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should register sequence shortcut v+l', async () => {
      const handler = vi.fn()
      shortcuts.registerSequence(['v', 'l'], handler, { description: 'List view' })

      dispatchKeyEvent('v')
      await new Promise(resolve => setTimeout(resolve, 50))
      dispatchKeyEvent('l')

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should register sequence shortcut v+c', async () => {
      const handler = vi.fn()
      shortcuts.registerSequence(['v', 'c'], handler, { description: 'Calendar view' })

      dispatchKeyEvent('v')
      await new Promise(resolve => setTimeout(resolve, 50))
      dispatchKeyEvent('c')

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should timeout sequence after delay', async () => {
      const handler = vi.fn()
      shortcuts.registerSequence(['v', 'b'], handler)

      dispatchKeyEvent('v')
      await new Promise(resolve => setTimeout(resolve, 600))
      dispatchKeyEvent('b')

      expect(handler).not.toHaveBeenCalled()
    })

    it('should reset sequence on wrong key', async () => {
      const handler = vi.fn()
      shortcuts.registerSequence(['v', 'b'], handler)

      dispatchKeyEvent('v')
      await new Promise(resolve => setTimeout(resolve, 50))
      dispatchKeyEvent('x')
      dispatchKeyEvent('b')

      expect(handler).not.toHaveBeenCalled()
    })

    it('should unregister sequence shortcut', async () => {
      const handler = vi.fn()
      const unregister = shortcuts.registerSequence(['v', 'b'], handler)

      unregister()
      dispatchKeyEvent('v')
      await new Promise(resolve => setTimeout(resolve, 50))
      dispatchKeyEvent('b')

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('context shortcuts', () => {
    it('should register context-aware shortcut', () => {
      const handler = vi.fn()
      shortcuts.registerWithContext('n', handler, {
        context: 'board',
        description: 'New task'
      })

      shortcuts.setContext('board')
      dispatchKeyEvent('n')

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should not trigger shortcut in wrong context', () => {
      const handler = vi.fn()
      shortcuts.registerWithContext('n', handler, { context: 'board' })

      shortcuts.setContext('list')
      dispatchKeyEvent('n')

      expect(handler).not.toHaveBeenCalled()
    })

    it('should trigger global shortcuts in any context', () => {
      const handler = vi.fn()
      shortcuts.register('?', handler)

      shortcuts.setContext('board')
      dispatchKeyEvent('?')

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should get current context', () => {
      shortcuts.setContext('task-detail')
      expect(shortcuts.getContext()).toBe('task-detail')
    })
  })

  describe('ctrl/meta + Enter', () => {
    it('should register ctrl+Enter shortcut', () => {
      const handler = vi.fn()
      shortcuts.register('Enter', handler, { ctrl: true, description: 'Submit form' })

      dispatchKeyEvent('Enter', { ctrlKey: true })

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should register meta+Enter shortcut', () => {
      const handler = vi.fn()
      shortcuts.register('Enter', handler, { meta: true, description: 'Submit form' })

      dispatchKeyEvent('Enter', { metaKey: true })

      expect(handler).toHaveBeenCalledTimes(1)
    })
  })
})
