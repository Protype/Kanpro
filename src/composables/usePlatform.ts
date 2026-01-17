import { computed } from 'vue'

/**
 * Platform detection composable
 * Detects the current platform and provides platform-specific keyboard modifier display
 */
export function usePlatform() {
  const isMac = computed(() => {
    if (typeof navigator === 'undefined') return false
    return navigator.platform.toUpperCase().includes('MAC')
  })

  const modifierKey = computed(() => isMac.value ? '⌘' : 'Ctrl')

  const modifierKeyDisplay = computed(() => isMac.value ? '⌘' : 'Ctrl')

  return {
    isMac,
    modifierKey,
    modifierKeyDisplay
  }
}
