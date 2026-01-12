import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import type { Column } from '@/types'

export const useColumnsStore = defineStore('columns', () => {
  const columns = ref<Column[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const columnsCount = computed(() => columns.value.length)

  const sortedColumns = computed(() => {
    return [...columns.value].sort((a, b) => a.position - b.position)
  })

  async function fetchColumns(projectId: number): Promise<void> {
    const authStore = useAuthStore()

    isLoading.value = true
    error.value = null

    try {
      const client = authStore.getClient()
      const result = await client.call<Column[]>('getColumns', {
        project_id: projectId
      })
      columns.value = result || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : '載入欄位失敗'
      columns.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function addColumn(
    projectId: number,
    title: string,
    taskLimit: number = 0,
    description: string = ''
  ): Promise<number> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<number>('addColumn', {
      project_id: projectId,
      title: title,
      task_limit: taskLimit,
      description: description
    })
    return result
  }

  async function updateColumn(
    columnId: number,
    title: string,
    taskLimit: number = 0,
    description: string = ''
  ): Promise<boolean> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<boolean>('updateColumn', {
      column_id: columnId,
      title: title,
      task_limit: taskLimit,
      description: description
    })
    return result
  }

  async function changeColumnPosition(
    projectId: number,
    columnId: number,
    position: number
  ): Promise<boolean> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<boolean>('changeColumnPosition', {
      project_id: projectId,
      column_id: columnId,
      position: position
    })
    return result
  }

  async function removeColumn(columnId: number): Promise<boolean> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<boolean>('removeColumn', {
      column_id: columnId
    })
    return result
  }

  function clearColumns(): void {
    columns.value = []
    error.value = null
  }

  return {
    columns,
    isLoading,
    error,
    columnsCount,
    sortedColumns,
    fetchColumns,
    addColumn,
    updateColumn,
    changeColumnPosition,
    removeColumn,
    clearColumns
  }
})
