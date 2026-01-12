import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import type { Activity } from '@/types'

const STORAGE_KEY = 'kanpro_read_notifications'

export const useNotificationsStore = defineStore('notifications', () => {
  const activities = ref<Activity[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const readIds = ref<Set<number>>(new Set())

  // Computed properties
  const unreadCount = computed(() => {
    return activities.value.filter(a => !readIds.value.has(a.id)).length
  })

  const unreadActivities = computed(() => {
    return activities.value.filter(a => !readIds.value.has(a.id))
  })

  function isRead(activityId: number): boolean {
    return readIds.value.has(activityId)
  }

  function loadReadIds(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const ids = JSON.parse(stored) as number[]
        readIds.value = new Set(ids)
      }
    } catch {
      readIds.value = new Set()
    }
  }

  function saveReadIds(): void {
    const ids = Array.from(readIds.value)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  }

  async function fetchActivities(): Promise<void> {
    const authStore = useAuthStore()

    isLoading.value = true
    error.value = null

    try {
      const client = authStore.getClient()
      const result = await client.call<Activity[]>('getMyActivityStream')
      activities.value = result || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : '載入活動流失敗'
      activities.value = []
    } finally {
      isLoading.value = false
    }
  }

  function markAsRead(activityId: number): void {
    readIds.value.add(activityId)
    // Trigger reactivity
    readIds.value = new Set(readIds.value)
    saveReadIds()
  }

  function markAllAsRead(): void {
    activities.value.forEach(a => {
      readIds.value.add(a.id)
    })
    // Trigger reactivity
    readIds.value = new Set(readIds.value)
    saveReadIds()
  }

  function clearActivities(): void {
    activities.value = []
    error.value = null
  }

  return {
    activities,
    isLoading,
    error,
    readIds,
    unreadCount,
    unreadActivities,
    isRead,
    loadReadIds,
    fetchActivities,
    markAsRead,
    markAllAsRead,
    clearActivities
  }
})
