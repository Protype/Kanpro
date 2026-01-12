import { ref } from 'vue'

export interface ShortcutOptions {
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  alt?: boolean
  description?: string
}

export interface RegisteredShortcut {
  key: string
  handler: () => void
  options: ShortcutOptions
  description?: string
}

function getShortcutKey(key: string, options: ShortcutOptions = {}): string {
  const parts: string[] = []
  if (options.ctrl) parts.push('ctrl')
  if (options.meta) parts.push('meta')
  if (options.shift) parts.push('shift')
  if (options.alt) parts.push('alt')
  parts.push(key.toLowerCase())
  return parts.join('+')
}

export function useKeyboardShortcuts() {
  const shortcuts = ref<Map<string, RegisteredShortcut>>(new Map())
  const enabled = ref(true)

  function isInputFocused(): boolean {
    const activeElement = document.activeElement
    if (!activeElement) return false

    const tagName = activeElement.tagName.toLowerCase()
    if (tagName === 'input' || tagName === 'textarea') {
      return true
    }

    if (activeElement.getAttribute('contenteditable') === 'true') {
      return true
    }

    return false
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (!enabled.value) return
    if (isInputFocused()) return

    const shortcutKey = getShortcutKey(event.key, {
      ctrl: event.ctrlKey,
      meta: event.metaKey,
      shift: event.shiftKey,
      alt: event.altKey
    })

    const shortcut = shortcuts.value.get(shortcutKey)
    if (shortcut) {
      event.preventDefault()
      shortcut.handler()
    }
  }

  function init(): () => void {
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      shortcuts.value.clear()
    }
  }

  function register(
    key: string,
    handler: () => void,
    options: ShortcutOptions = {}
  ): () => void {
    const shortcutKey = getShortcutKey(key, options)

    shortcuts.value.set(shortcutKey, {
      key,
      handler,
      options,
      description: options.description
    })

    return () => unregister(key, options)
  }

  function unregister(key: string, options: ShortcutOptions = {}): void {
    const shortcutKey = getShortcutKey(key, options)
    shortcuts.value.delete(shortcutKey)
  }

  function getShortcuts(): RegisteredShortcut[] {
    return Array.from(shortcuts.value.values())
  }

  function setEnabled(value: boolean): void {
    enabled.value = value
  }

  return {
    init,
    register,
    unregister,
    getShortcuts,
    setEnabled,
    enabled
  }
}
