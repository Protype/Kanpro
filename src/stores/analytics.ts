import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'
import type { Activity, Task, Column, ProjectMember } from '@/types'

export interface TaskDistribution {
  column: string
  count: number
}

export interface UserWorkload {
  user: string
  username: string
  count: number
}

export interface ActivityByDay {
  date: string
  count: number
}

export interface ActivityStats {
  total: number
  taskCreated: number
  taskMoved: number
  taskClosed: number
}

export const useAnalyticsStore = defineStore('analytics', () => {
  const activities = ref<Activity[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchProjectActivity(projectId: number): Promise<void> {
    const authStore = useAuthStore()

    isLoading.value = true
    error.value = null

    try {
      const client = authStore.getClient()
      const result = await client.call<Activity[]>('getProjectActivity', {
        project_id: projectId
      })
      activities.value = result || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : '載入專案活動失敗'
      activities.value = []
    } finally {
      isLoading.value = false
    }
  }

  function calculateTaskDistribution(tasks: Task[], columns: Column[]): TaskDistribution[] {
    return columns.map(column => ({
      column: column.title,
      count: tasks.filter(task => task.column_id === column.id).length
    }))
  }

  function calculateUserWorkload(tasks: Task[], members: ProjectMember[]): UserWorkload[] {
    return members.map(member => ({
      user: member.name || member.username,
      username: member.username,
      count: tasks.filter(task => task.owner_id === member.id).length
    }))
  }

  function calculateActivityByDay(): ActivityByDay[] {
    if (activities.value.length === 0) {
      return []
    }

    const byDay: Record<string, number> = {}

    activities.value.forEach(activity => {
      const date = new Date(activity.date_creation * 1000).toISOString().split('T')[0]
      byDay[date] = (byDay[date] || 0) + 1
    })

    return Object.entries(byDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  function getActivityStats(): ActivityStats {
    const stats: ActivityStats = {
      total: activities.value.length,
      taskCreated: 0,
      taskMoved: 0,
      taskClosed: 0
    }

    activities.value.forEach(activity => {
      if (activity.event_name === 'task.create') {
        stats.taskCreated++
      } else if (activity.event_name === 'task.move.column') {
        stats.taskMoved++
      } else if (activity.event_name === 'task.close') {
        stats.taskClosed++
      }
    })

    return stats
  }

  function clearAnalytics(): void {
    activities.value = []
    error.value = null
  }

  return {
    activities,
    isLoading,
    error,
    fetchProjectActivity,
    calculateTaskDistribution,
    calculateUserWorkload,
    calculateActivityByDay,
    getActivityStats,
    clearAnalytics
  }
})
