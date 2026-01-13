import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface Breakpoints {
  sm: number
  md: number
  lg: number
  xl: number
}

export type BreakpointName = 'mobile' | 'tablet' | 'desktop'

const defaultBreakpoints: Breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280
}

export function useResponsive(customBreakpoints?: Partial<Breakpoints>) {
  const breakpoints: Breakpoints = {
    ...defaultBreakpoints,
    ...customBreakpoints
  }

  const screenWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)
  const screenHeight = ref(typeof window !== 'undefined' ? window.innerHeight : 768)

  const isMobile = computed(() => screenWidth.value < breakpoints.md)
  const isTablet = computed(() => screenWidth.value >= breakpoints.md && screenWidth.value < breakpoints.lg)
  const isDesktop = computed(() => screenWidth.value >= breakpoints.lg)

  const currentBreakpoint = computed<BreakpointName>(() => {
    if (isMobile.value) return 'mobile'
    if (isTablet.value) return 'tablet'
    return 'desktop'
  })

  function updateDimensions() {
    screenWidth.value = window.innerWidth
    screenHeight.value = window.innerHeight
  }

  let resizeHandler: (() => void) | null = null

  function init(): () => void {
    resizeHandler = updateDimensions
    window.addEventListener('resize', resizeHandler)
    updateDimensions()

    return () => {
      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler)
      }
    }
  }

  // Auto-initialize if in browser context
  if (typeof window !== 'undefined') {
    onMounted(() => {
      const cleanup = init()
      onUnmounted(cleanup)
    })
  }

  return {
    screenWidth,
    screenHeight,
    isMobile,
    isTablet,
    isDesktop,
    currentBreakpoint,
    breakpoints,
    init
  }
}
