import { ref, onUnmounted } from 'vue'

export interface PollingOptions {
  interval: number
  immediate?: boolean
}

export function usePolling(
  callback: () => Promise<void>,
  options: PollingOptions
) {
  const isPolling = ref(false)
  const isPaused = ref(false)
  const error = ref<Error | null>(null)

  let intervalId: ReturnType<typeof globalThis.setInterval> | null = null
  let currentInterval = options.interval

  async function executeCallback() {
    if (isPaused.value) return

    try {
      await callback()
      error.value = null
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
    }
  }

  function start() {
    if (isPolling.value) return

    isPolling.value = true
    isPaused.value = false

    if (options.immediate) {
      executeCallback()
    }

    intervalId = globalThis.setInterval(executeCallback, currentInterval)
  }

  function stop() {
    if (intervalId) {
      globalThis.clearInterval(intervalId)
      intervalId = null
    }
    isPolling.value = false
    isPaused.value = false
  }

  function pause() {
    isPaused.value = true
  }

  function resume() {
    isPaused.value = false
  }

  function updateInterval(newInterval: number) {
    currentInterval = newInterval

    if (isPolling.value && intervalId) {
      globalThis.clearInterval(intervalId)
      intervalId = globalThis.setInterval(executeCallback, currentInterval)
    }
  }

  // Auto-cleanup on unmount
  if (typeof window !== 'undefined') {
    onUnmounted(() => {
      stop()
    })
  }

  return {
    isPolling,
    isPaused,
    error,
    start,
    stop,
    pause,
    resume,
    setInterval: updateInterval
  }
}
