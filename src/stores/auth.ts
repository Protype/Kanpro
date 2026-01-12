import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<{ username: string; token: string } | null>(null)

  const isAuthenticated = computed(() => !!user.value)

  function login(username: string, token: string) {
    user.value = { username, token }
  }

  function logout() {
    user.value = null
  }

  return {
    user,
    isAuthenticated,
    login,
    logout
  }
})
