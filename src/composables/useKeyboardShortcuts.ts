import { ref } from 'vue'

export interface ShortcutOptions {
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  alt?: boolean
  description?: string
}

export interface ContextShortcutOptions extends ShortcutOptions {
  context: string
}

export interface RegisteredShortcut {
  key: string
  handler: () => void
  options: ShortcutOptions
  description?: string
  context?: string
}

export interface SequenceShortcut {
  keys: string[]
  handler: () => void
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
  const sequences = ref<Map<string, SequenceShortcut>>(new Map())
  const enabled = ref(true)
  const currentContext = ref<string>('global')

  // Sequence tracking
  let sequenceBuffer: string[] = []
  let sequenceTimeout: ReturnType<typeof setTimeout> | null = null
  const SEQUENCE_TIMEOUT = 500

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

  function resetSequence(): void {
    sequenceBuffer = []
    if (sequenceTimeout) {
      clearTimeout(sequenceTimeout)
      sequenceTimeout = null
    }
  }

  function checkSequence(key: string): boolean {
    sequenceBuffer.push(key.toLowerCase())

    // Check if current buffer matches any registered sequence
    for (const [, seq] of sequences.value.entries()) {
      const bufferStr = sequenceBuffer.join('+')
      const seqStr = seq.keys.join('+').toLowerCase()

      if (bufferStr === seqStr) {
        resetSequence()
        seq.handler()
        return true
      }

      // Check if current buffer is a prefix of any sequence
      if (seqStr.startsWith(bufferStr)) {
        // Set timeout to reset sequence
        if (sequenceTimeout) {
          clearTimeout(sequenceTimeout)
        }
        sequenceTimeout = setTimeout(resetSequence, SEQUENCE_TIMEOUT)
        return true
      }
    }

    // No match and not a prefix, reset
    resetSequence()
    return false
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (!enabled.value) return
    if (isInputFocused()) return

    // Check for sequence shortcuts first (only for simple keys without modifiers)
    if (!event.ctrlKey && !event.metaKey && !event.altKey && sequences.value.size > 0) {
      if (checkSequence(event.key)) {
        event.preventDefault()
        return
      }
    }

    const shortcutKey = getShortcutKey(event.key, {
      ctrl: event.ctrlKey,
      meta: event.metaKey,
      shift: event.shiftKey,
      alt: event.altKey
    })

    // First try context-specific shortcut
    const contextShortcut = shortcuts.value.get(shortcutKey + ':' + currentContext.value)
    if (contextShortcut) {
      event.preventDefault()
      contextShortcut.handler()
      return
    }

    // Then try global shortcut
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
      sequences.value.clear()
      resetSequence()
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

  function registerSequence(
    keys: string[],
    handler: () => void,
    options: { description?: string } = {}
  ): () => void {
    const seqKey = keys.join('+').toLowerCase()

    sequences.value.set(seqKey, {
      keys,
      handler,
      description: options.description
    })

    return () => {
      sequences.value.delete(seqKey)
    }
  }

  function registerWithContext(
    key: string,
    handler: () => void,
    options: ContextShortcutOptions
  ): () => void {
    const shortcutKey = getShortcutKey(key, options)

    shortcuts.value.set(shortcutKey + ':' + options.context, {
      key,
      handler,
      options,
      description: options.description,
      context: options.context
    })

    return () => {
      shortcuts.value.delete(shortcutKey + ':' + options.context)
    }
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

  function setContext(context: string): void {
    currentContext.value = context
  }

  function getContext(): string {
    return currentContext.value
  }

  return {
    init,
    register,
    registerSequence,
    registerWithContext,
    unregister,
    getShortcuts,
    setEnabled,
    setContext,
    getContext,
    enabled
  }
}
