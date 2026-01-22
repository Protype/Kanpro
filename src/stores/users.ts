import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import type { User } from '@/types'

interface CreateUserParams {
  username: string
  password: string
  name?: string
  email?: string
  role?: string
}

interface UpdateUserParams {
  name?: string
  email?: string
  role?: string
}

export const useUsersStore = defineStore('users', () => {
  const users = ref<User[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const usersCount = computed(() => users.value.length)

  const activeUsers = computed(() => {
    return users.value.filter(u => u.is_active)
  })

  /**
   * 獲取所有使用者（需要 admin 權限）
   * 非 admin 用戶會靜默失敗
   */
  async function fetchAllUsers(): Promise<void> {
    const authStore = useAuthStore()

    isLoading.value = true
    error.value = null

    try {
      const client = authStore.getClient()
      const result = await client.call<User[]>('getAllUsers')
      users.value = result || []
    } catch {
      // getAllUsers 需要 admin 權限，非 admin 用戶靜默失敗
      users.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function getUser(userId: number): Promise<User | null> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<User | null>('getUser', {
      user_id: userId
    })
    return result
  }

  async function createUser(params: CreateUserParams): Promise<number> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<number>('createUser', params as unknown as Record<string, unknown>)
    return result
  }

  async function updateUser(userId: number, params: UpdateUserParams): Promise<boolean> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<boolean>('updateUser', {
      id: userId,
      ...params
    })
    return result
  }

  async function enableUser(userId: number): Promise<boolean> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<boolean>('enableUser', {
      user_id: userId
    })
    return result
  }

  async function disableUser(userId: number): Promise<boolean> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<boolean>('disableUser', {
      user_id: userId
    })
    return result
  }

  async function removeUser(userId: number): Promise<boolean> {
    const authStore = useAuthStore()
    const client = authStore.getClient()

    const result = await client.call<boolean>('removeUser', {
      user_id: userId
    })
    return result
  }

  function clearUsers(): void {
    users.value = []
    error.value = null
  }

  return {
    users,
    isLoading,
    error,
    usersCount,
    activeUsers,
    fetchAllUsers,
    getUser,
    createUser,
    updateUser,
    enableUser,
    disableUser,
    removeUser,
    clearUsers
  }
})
