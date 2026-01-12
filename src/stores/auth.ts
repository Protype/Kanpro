import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createKanboardClient } from '@/services/api'
import type { User } from '@/types'

const STORAGE_KEY = 'kanpro_auth'

interface LoginCredentials {
  apiUrl: string
  username: string
  password: string
  rememberMe?: boolean
}

interface SavedCredentials {
  apiUrl: string
  username: string
  token: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const apiUrl = ref('')
  const username = ref('')
  const token = ref('')

  const isAuthenticated = computed(() => !!user.value)

  async function login(credentials: LoginCredentials): Promise<void> {
    const client = createKanboardClient({
      apiUrl: credentials.apiUrl,
      username: credentials.username,
      token: credentials.password
    })

    const result = await client.call<User>('getMe')

    user.value = result
    apiUrl.value = credentials.apiUrl
    username.value = credentials.username
    token.value = credentials.password

    if (credentials.rememberMe) {
      const savedCredentials: SavedCredentials = {
        apiUrl: credentials.apiUrl,
        username: credentials.username,
        token: credentials.password
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedCredentials))
    }
  }

  function logout(): void {
    user.value = null
    apiUrl.value = ''
    username.value = ''
    token.value = ''
    localStorage.removeItem(STORAGE_KEY)
  }

  async function restoreSession(): Promise<boolean> {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) {
      return false
    }

    try {
      const credentials: SavedCredentials = JSON.parse(saved)
      const client = createKanboardClient({
        apiUrl: credentials.apiUrl,
        username: credentials.username,
        token: credentials.token
      })

      const result = await client.call<User>('getMe')

      user.value = result
      apiUrl.value = credentials.apiUrl
      username.value = credentials.username
      token.value = credentials.token

      return true
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      return false
    }
  }

  function getClient() {
    if (!apiUrl.value || !username.value || !token.value) {
      throw new Error('Not authenticated')
    }
    return createKanboardClient({
      apiUrl: apiUrl.value,
      username: username.value,
      token: token.value
    })
  }

  interface UpdateUserParams {
    name?: string
    email?: string
  }

  async function updateCurrentUser(params: UpdateUserParams): Promise<boolean> {
    if (!user.value) {
      throw new Error('Not authenticated')
    }

    const client = getClient()

    const result = await client.call<boolean>('updateUser', {
      id: user.value.id,
      ...params
    })

    if (result) {
      // Refresh user data
      const updatedUser = await client.call<User>('getMe')
      user.value = updatedUser
    }

    return result
  }

  return {
    user,
    apiUrl,
    username,
    token,
    isAuthenticated,
    login,
    logout,
    restoreSession,
    getClient,
    updateCurrentUser
  }
})
