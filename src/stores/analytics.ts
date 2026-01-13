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

export interface CumulativeFlowData {
  date: string
  columns: Record<string, number>
}

export interface BurndownData {
  date: string
  remaining: number
  ideal: number
}

export interface ColumnTimeData {
  column: string
  avgDays: number
}

export interface TaskLeadCycleData {
  taskId: number
  title: string
  leadTime: number
  cycleTime: number
}

export interface LeadCycleTimeData {
  avgLeadTime: number
  avgCycleTime: number
  tasks: TaskLeadCycleData[]
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

  function calculateCumulativeFlow(
    tasks: Task[],
    columns: Column[],
    startDate: string,
    endDate: string
  ): CumulativeFlowData[] {
    if (tasks.length === 0) return []

    const result: CumulativeFlowData[] = []
    const start = new Date(startDate)
    const end = new Date(endDate)

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const dateTimestamp = d.getTime() / 1000

      const columnCounts: Record<string, number> = {}
      columns.forEach(col => {
        columnCounts[col.title] = 0
      })

      tasks.forEach(task => {
        // Count tasks that existed on this date
        if (task.date_creation <= dateTimestamp) {
          const column = columns.find(c => c.id === task.column_id)
          if (column) {
            columnCounts[column.title]++
          }
        }
      })

      result.push({
        date: dateStr,
        columns: columnCounts
      })
    }

    return result
  }

  function calculateBurndown(
    tasks: Task[],
    startDate: string,
    endDate: string
  ): BurndownData[] {
    if (tasks.length === 0) return []

    const result: BurndownData[] = []
    const start = new Date(startDate)
    const end = new Date(endDate)
    const totalTasks = tasks.length
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const idealDecrement = totalTasks / (totalDays - 1)

    let dayIndex = 0
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const dateTimestamp = d.getTime() / 1000

      // Count remaining (active) tasks
      const completedByDate = tasks.filter(task => {
        const dateCompleted = (task as Task & { date_completed?: number }).date_completed
        return !task.is_active && dateCompleted && dateCompleted <= dateTimestamp
      }).length

      const remaining = totalTasks - completedByDate
      const ideal = Math.max(0, totalTasks - (idealDecrement * dayIndex))

      result.push({
        date: dateStr,
        remaining,
        ideal: Math.round(ideal * 100) / 100
      })

      dayIndex++
    }

    return result
  }

  function calculateColumnTime(columns: Column[]): ColumnTimeData[] {
    const columnTimes: Record<number, number[]> = {}
    columns.forEach(col => {
      columnTimes[col.id] = []
    })

    // Group activities by task
    const taskMoves: Record<number, { columnId: number; timestamp: number }[]> = {}

    activities.value
      .filter(a => a.event_name === 'task.move.column')
      .forEach(activity => {
        const taskId = activity.task_id
        if (!taskMoves[taskId]) {
          taskMoves[taskId] = []
        }

        const data = activity.data as { src_column_id?: number; dst_column_id?: number } | undefined
        if (data?.src_column_id) {
          taskMoves[taskId].push({
            columnId: data.src_column_id,
            timestamp: activity.date_creation
          })
        }
      })

    // Calculate time spent in each column
    Object.values(taskMoves).forEach(moves => {
      moves.sort((a, b) => a.timestamp - b.timestamp)

      for (let i = 1; i < moves.length; i++) {
        const prev = moves[i - 1]
        const curr = moves[i]
        const daysInColumn = (curr.timestamp - prev.timestamp) / (60 * 60 * 24)

        if (columnTimes[prev.columnId]) {
          columnTimes[prev.columnId].push(daysInColumn)
        }
      }
    })

    return columns.map(col => ({
      column: col.title,
      avgDays: columnTimes[col.id].length > 0
        ? Math.round((columnTimes[col.id].reduce((a, b) => a + b, 0) / columnTimes[col.id].length) * 100) / 100
        : 0
    }))
  }

  function calculateLeadCycleTime(tasks: Task[]): LeadCycleTimeData {
    if (tasks.length === 0) {
      return { avgLeadTime: 0, avgCycleTime: 0, tasks: [] }
    }

    const taskData: TaskLeadCycleData[] = []

    tasks.forEach(task => {
      const extTask = task as Task & { date_started?: number; date_completed?: number }
      if (!extTask.date_completed) return

      const leadTime = Math.round((extTask.date_completed - task.date_creation) / (60 * 60 * 24))
      const cycleTime = extTask.date_started
        ? Math.round((extTask.date_completed - extTask.date_started) / (60 * 60 * 24))
        : leadTime

      taskData.push({
        taskId: task.id,
        title: task.title,
        leadTime,
        cycleTime
      })
    })

    if (taskData.length === 0) {
      return { avgLeadTime: 0, avgCycleTime: 0, tasks: [] }
    }

    const avgLeadTime = Math.round(taskData.reduce((sum, t) => sum + t.leadTime, 0) / taskData.length)
    const avgCycleTime = Math.round(taskData.reduce((sum, t) => sum + t.cycleTime, 0) / taskData.length)

    return { avgLeadTime, avgCycleTime, tasks: taskData }
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
    clearAnalytics,
    calculateCumulativeFlow,
    calculateBurndown,
    calculateColumnTime,
    calculateLeadCycleTime
  }
})
