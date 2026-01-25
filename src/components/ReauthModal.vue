<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const authStore = useAuthStore()

const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const isDisabled = computed(() => {
  return !password.value.trim() || isLoading.value
})

const handleReauth = async () => {
  if (isDisabled.value) return

  errorMessage.value = ''
  isLoading.value = true

  try {
    await authStore.reauthenticate(password.value)
    password.value = ''
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('auth.authFailed')
  } finally {
    isLoading.value = false
  }
}

const handleLogout = () => {
  authStore.abandonReauth()
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="authStore.isSessionLocked"
      data-testid="reauth-modal"
      class="fixed inset-0 z-[60] overflow-y-auto"
    >
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black/60"></div>

      <!-- Modal -->
      <div class="flex min-h-full items-center justify-center p-4">
        <div
          class="relative bg-surface rounded-lg w-full max-w-sm transform transition-all"
          style="box-shadow: var(--shadow-lg)"
          @click.stop
        >
          <!-- Header -->
          <div class="p-6 pb-4 text-center">
            <div class="mx-auto w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mb-4">
              <ph-icon icon="lock" class="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
            </div>
            <h2 class="text-lg font-semibold text-content">{{ t('auth.sessionExpiredTitle') }}</h2>
            <p class="mt-2 text-sm text-content-secondary">
              {{ t('auth.sessionExpiredDescription') }}
            </p>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleReauth" class="px-6 pb-6">
            <!-- Username display -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-content-secondary mb-1">
                {{ t('auth.account') }}
              </label>
              <div class="px-3 py-2 bg-surface-secondary rounded-md text-content">
                {{ authStore.username }}
              </div>
            </div>

            <!-- Password input -->
            <div class="mb-4">
              <label for="reauth-password" class="block text-sm font-medium text-content-secondary mb-1">
                {{ t('auth.password') }}
              </label>
              <input
                id="reauth-password"
                v-model="password"
                type="password"
                data-testid="password-input"
                :disabled="isLoading"
                class="w-full px-3 py-2 border border-edge rounded-md shadow-sm bg-surface text-content focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                :placeholder="t('auth.enterPassword')"
                autofocus
              />
            </div>

            <!-- Error message -->
            <div
              v-if="errorMessage"
              data-testid="error-message"
              class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md"
            >
              <p class="text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</p>
            </div>

            <!-- Actions -->
            <div class="space-y-3">
              <button
                type="submit"
                data-testid="reauth-btn"
                :disabled="isDisabled"
                class="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <ph-icon
                  v-if="isLoading"
                  icon="spinner"
                  class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                />
                {{ isLoading ? t('auth.verifying') : t('auth.reauth') }}
              </button>

              <button
                type="button"
                data-testid="logout-btn"
                :disabled="isLoading"
                @click="handleLogout"
                class="w-full px-4 py-2 text-sm font-medium text-content-secondary hover:text-content bg-surface-secondary hover:bg-surface-tertiary rounded-md disabled:opacity-50"
              >
                {{ t('auth.backToLogin') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>
