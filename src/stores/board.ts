import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import type { Project, Task } from '@/types'

export interface BoardColumn {
  id: number
  title: string
  position: number
  task_limit: number
  project_id: number
  description?: string
  nb_tasks: number
  tasks: Task[]
}

export interface BoardSwimlane {
  id: number
  name: string
  position: number
  is_active: number
  project_id: number
  description?: string
  columns: BoardColumn[]
}

export const useBoardStore = defineStore('board', () => {
  const project = ref<Project | null>(null)
  const swimlanes = ref<BoardSwimlane[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const columns = computed(() => {
    if (swimlanes.value.length === 0) {
      return []
    }
    return swimlanes.value[0].columns
  })

  async function fetchBoard(projectId: number, silent = false): Promise<void> {
    const authStore = useAuthStore()

    if (!silent) {
      isLoading.value = true
    }
    error.value = null

    try {
      const client = authStore.getClient()

      // Fetch project info
      const projectData = await client.call<Project>('getProjectById', {
        project_id: projectId
      })
      project.value = projectData

      // Fetch board data
      const boardData = await client.call<BoardSwimlane[]>('getBoard', {
        project_id: projectId
      })
      swimlanes.value = boardData
    } catch (err) {
      error.value = err instanceof Error ? err.message : '載入看板失敗'
      project.value = null
      swimlanes.value = []
    } finally {
      if (!silent) {
        isLoading.value = false
      }
    }
  }

  function getTaskById(taskId: number): Task | undefined {
    for (const swimlane of swimlanes.value) {
      for (const column of swimlane.columns) {
        const task = column.tasks.find(t => t.id === taskId)
        if (task) {
          return task
        }
      }
    }
    return undefined
  }

  function clearBoard(): void {
    project.value = null
    swimlanes.value = []
    error.value = null
  }

  /**
   * 重置 store 狀態（登出時呼叫）
   */
  function $reset(): void {
    clearBoard()
    isLoading.value = false
  }

  return {
    project,
    swimlanes,
    isLoading,
    error,
    columns,
    fetchBoard,
    getTaskById,
    clearBoard,
    $reset
  }
})
