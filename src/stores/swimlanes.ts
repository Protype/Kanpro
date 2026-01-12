import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import type { Swimlane } from '@/types'

export const useSwimlanesStore = defineStore('swimlanes', () => {
  const swimlanes = ref<Swimlane[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const swimlanesCount = computed(() => swimlanes.value.length)

  const activeSwimlanes = computed(() => {
    return swimlanes.value.filter(s => s.is_active)
  })

  async function fetchSwimlanes(projectId: number): Promise<void> {
    const authStore = useAuthStore()

    isLoading.value = true
    error.value = null

    try {
      const client = authStore.getClient()
      const result = await client.call<Swimlane[]>('getAllSwimlanes', {
        project_id: projectId
      })
      swimlanes.value = result || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : '載入泳道失敗'
      swimlanes.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function addSwimlane(
    projectId: number,
    name: string,
    description: string = ''
  ): Promise<number> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<number>('addSwimlane', {
      project_id: projectId,
      name: name,
      description: description
    })
    return result
  }

  async function updateSwimlane(
    swimlaneId: number,
    name: string,
    description: string = ''
  ): Promise<boolean> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<boolean>('updateSwimlane', {
      swimlane_id: swimlaneId,
      name: name,
      description: description
    })
    return result
  }

  async function changeSwimlanePosition(
    projectId: number,
    swimlaneId: number,
    position: number
  ): Promise<boolean> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<boolean>('changeSwimlanePosition', {
      project_id: projectId,
      swimlane_id: swimlaneId,
      position: position
    })
    return result
  }

  async function enableSwimlane(
    projectId: number,
    swimlaneId: number
  ): Promise<boolean> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<boolean>('enableSwimlane', {
      project_id: projectId,
      swimlane_id: swimlaneId
    })
    return result
  }

  async function disableSwimlane(
    projectId: number,
    swimlaneId: number
  ): Promise<boolean> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<boolean>('disableSwimlane', {
      project_id: projectId,
      swimlane_id: swimlaneId
    })
    return result
  }

  async function removeSwimlane(
    projectId: number,
    swimlaneId: number
  ): Promise<boolean> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<boolean>('removeSwimlane', {
      project_id: projectId,
      swimlane_id: swimlaneId
    })
    return result
  }

  function clearSwimlanes(): void {
    swimlanes.value = []
    error.value = null
  }

  return {
    swimlanes,
    isLoading,
    error,
    swimlanesCount,
    activeSwimlanes,
    fetchSwimlanes,
    addSwimlane,
    updateSwimlane,
    changeSwimlanePosition,
    enableSwimlane,
    disableSwimlane,
    removeSwimlane,
    clearSwimlanes
  }
})
