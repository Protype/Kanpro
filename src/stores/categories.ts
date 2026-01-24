import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import type { Category } from '@/types'

export const useCategoriesStore = defineStore('categories', () => {
  const categories = ref<Category[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const categoriesCount = computed(() => categories.value.length)

  async function fetchCategories(projectId: number): Promise<void> {
    const authStore = useAuthStore()

    isLoading.value = true
    error.value = null

    try {
      const client = authStore.getClient()
      const result = await client.call<Category[]>('getAllCategories', {
        project_id: projectId
      })
      categories.value = result || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : '載入類別失敗'
      categories.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function addCategory(
    projectId: number,
    name: string,
    colorId?: string
  ): Promise<number> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const params: { project_id: number; name: string; color_id?: string } = {
      project_id: projectId,
      name: name
    }
    if (colorId) {
      params.color_id = colorId
    }

    const result = await client.call<number>('createCategory', params)
    return result
  }

  async function updateCategory(
    categoryId: number,
    name: string,
    colorId?: string
  ): Promise<boolean> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const params: { category_id: number; name: string; color_id?: string } = {
      category_id: categoryId,
      name: name
    }
    if (colorId !== undefined) {
      params.color_id = colorId
    }

    const result = await client.call<boolean>('updateCategory', params)
    return result
  }

  async function removeCategory(categoryId: number): Promise<boolean> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<boolean>('removeCategory', {
      category_id: categoryId
    })
    return result
  }

  function clearCategories(): void {
    categories.value = []
    error.value = null
  }

  return {
    categories,
    isLoading,
    error,
    categoriesCount,
    fetchCategories,
    addCategory,
    updateCategory,
    removeCategory,
    clearCategories
  }
})
