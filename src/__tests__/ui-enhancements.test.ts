import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useResponsive } from '@/composables/useResponsive'
import { usePolling } from '@/composables/usePolling'

describe('useResponsive', () => {
  let responsive: ReturnType<typeof useResponsive>
  let matchMediaMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    matchMediaMock = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
    vi.stubGlobal('matchMedia', matchMediaMock)
    responsive = useResponsive()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('breakpoints', () => {
    it('should have isMobile computed property', () => {
      expect(responsive.isMobile).toBeDefined()
      expect(typeof responsive.isMobile.value).toBe('boolean')
    })

    it('should have isTablet computed property', () => {
      expect(responsive.isTablet).toBeDefined()
      expect(typeof responsive.isTablet.value).toBe('boolean')
    })

    it('should have isDesktop computed property', () => {
      expect(responsive.isDesktop).toBeDefined()
      expect(typeof responsive.isDesktop.value).toBe('boolean')
    })

    it('should have currentBreakpoint computed property', () => {
      expect(responsive.currentBreakpoint).toBeDefined()
      expect(['mobile', 'tablet', 'desktop']).toContain(responsive.currentBreakpoint.value)
    })
  })

  describe('screen dimensions', () => {
    it('should have screenWidth reactive property', () => {
      expect(responsive.screenWidth).toBeDefined()
      expect(typeof responsive.screenWidth.value).toBe('number')
    })

    it('should have screenHeight reactive property', () => {
      expect(responsive.screenHeight).toBeDefined()
      expect(typeof responsive.screenHeight.value).toBe('number')
    })
  })

  describe('breakpoint values', () => {
    it('should return breakpoint config', () => {
      const breakpoints = responsive.breakpoints
      expect(breakpoints).toHaveProperty('sm')
      expect(breakpoints).toHaveProperty('md')
      expect(breakpoints).toHaveProperty('lg')
      expect(breakpoints).toHaveProperty('xl')
    })
  })
})

describe('usePolling', () => {
  let polling: ReturnType<typeof usePolling>

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('start and stop', () => {
    it('should start polling with callback', async () => {
      const callback = vi.fn().mockResolvedValue(undefined)
      polling = usePolling(callback, { interval: 1000 })

      polling.start()
      expect(polling.isPolling.value).toBe(true)

      await vi.advanceTimersByTimeAsync(1000)
      expect(callback).toHaveBeenCalledTimes(1)

      polling.stop()
    })

    it('should stop polling', async () => {
      const callback = vi.fn().mockResolvedValue(undefined)
      polling = usePolling(callback, { interval: 1000 })

      polling.start()
      polling.stop()
      expect(polling.isPolling.value).toBe(false)

      await vi.advanceTimersByTimeAsync(2000)
      expect(callback).not.toHaveBeenCalled()
    })

    it('should call callback multiple times at interval', async () => {
      const callback = vi.fn().mockResolvedValue(undefined)
      polling = usePolling(callback, { interval: 1000 })

      polling.start()
      await vi.advanceTimersByTimeAsync(3000)

      expect(callback).toHaveBeenCalledTimes(3)
      polling.stop()
    })
  })

  describe('immediate option', () => {
    it('should call callback immediately when immediate is true', async () => {
      const callback = vi.fn().mockResolvedValue(undefined)
      polling = usePolling(callback, { interval: 1000, immediate: true })

      polling.start()
      await vi.advanceTimersByTimeAsync(0)

      expect(callback).toHaveBeenCalledTimes(1)
      polling.stop()
    })
  })

  describe('error handling', () => {
    it('should continue polling even if callback throws', async () => {
      const callback = vi.fn()
        .mockRejectedValueOnce(new Error('Test error'))
        .mockResolvedValue(undefined)

      polling = usePolling(callback, { interval: 1000 })

      polling.start()
      await vi.advanceTimersByTimeAsync(2000)

      expect(callback).toHaveBeenCalledTimes(2)
      polling.stop()
    })

    it('should expose error state', async () => {
      const error = new Error('Test error')
      const callback = vi.fn().mockRejectedValue(error)

      polling = usePolling(callback, { interval: 1000 })

      polling.start()
      await vi.advanceTimersByTimeAsync(1000)

      expect(polling.error.value).toBe(error)
      polling.stop()
    })
  })

  describe('pause and resume', () => {
    it('should pause polling', async () => {
      const callback = vi.fn().mockResolvedValue(undefined)
      polling = usePolling(callback, { interval: 1000 })

      polling.start()
      await vi.advanceTimersByTimeAsync(1000)
      expect(callback).toHaveBeenCalledTimes(1)

      polling.pause()
      await vi.advanceTimersByTimeAsync(2000)
      expect(callback).toHaveBeenCalledTimes(1)

      polling.stop()
    })

    it('should resume polling', async () => {
      const callback = vi.fn().mockResolvedValue(undefined)
      polling = usePolling(callback, { interval: 1000 })

      polling.start()
      polling.pause()
      await vi.advanceTimersByTimeAsync(1000)
      expect(callback).toHaveBeenCalledTimes(0)

      polling.resume()
      await vi.advanceTimersByTimeAsync(1000)
      expect(callback).toHaveBeenCalledTimes(1)

      polling.stop()
    })
  })

  describe('setInterval', () => {
    it('should change polling interval', async () => {
      const callback = vi.fn().mockResolvedValue(undefined)
      polling = usePolling(callback, { interval: 1000 })

      polling.start()
      await vi.advanceTimersByTimeAsync(1000)
      expect(callback).toHaveBeenCalledTimes(1)

      polling.setInterval(500)
      await vi.advanceTimersByTimeAsync(1000)
      expect(callback).toHaveBeenCalledTimes(3) // 2 more calls at 500ms interval

      polling.stop()
    })
  })
})
