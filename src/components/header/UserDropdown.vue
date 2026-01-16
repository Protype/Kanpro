<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTheme, type ThemeName, THEMES } from '@/composables/useTheme'

const router = useRouter()
const authStore = useAuthStore()
const { currentTheme, setTheme } = useTheme()

const isOpen = ref(false)
const showThemeMenu = ref(false)

const displayName = computed(() => authStore.user?.name || authStore.user?.username || '')
const avatarInitial = computed(() => displayName.value.charAt(0).toUpperCase())

// Kanboard avatar URLs
// apiUrl 可能包含 /jsonrpc.php，需要移除
const baseUrl = computed(() => {
  if (!authStore.apiUrl) return null
  return authStore.apiUrl.replace(/\/?jsonrpc\.php$/, '')
})

const avatarUrl = computed(() => {
  if (!authStore.user?.id || !baseUrl.value) return null
  return `${baseUrl.value}/?controller=AvatarFileController&action=image&user_id=${authStore.user.id}&size=32`
})

const avatarUrlLarge = computed(() => {
  if (!authStore.user?.id || !baseUrl.value) return null
  return `${baseUrl.value}/?controller=AvatarFileController&action=image&user_id=${authStore.user.id}&size=48`
})

// Track avatar load errors
const avatarError = ref(false)
const avatarLargeError = ref(false)

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
  if (!isOpen.value) {
    showThemeMenu.value = false
  }
}

const closeDropdown = () => {
  isOpen.value = false
  showThemeMenu.value = false
}

const handleLogout = async () => {
  closeDropdown()
  await authStore.logout()
  router.push('/login')
}

const goToSettings = () => {
  closeDropdown()
  router.push('/settings')
}

const toggleThemeMenu = () => {
  showThemeMenu.value = !showThemeMenu.value
}

const selectTheme = (themeId: ThemeName) => {
  setTheme(themeId)
  showThemeMenu.value = false
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('[data-user-dropdown]')) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="relative" data-user-dropdown>
    <!-- Trigger Button -->
    <button
      @click.stop="toggleDropdown"
      class="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-hover transition-colors"
    >
      <!-- Avatar -->
      <img
        v-if="avatarUrl && !avatarError"
        :src="avatarUrl"
        :alt="displayName"
        class="w-8 h-8 rounded-full object-cover"
        @error="avatarError = true"
      />
      <div
        v-else
        class="w-8 h-8 rounded-full bg-accent text-content-inverse flex items-center justify-center text-sm font-medium"
      >
        {{ avatarInitial }}
      </div>
      <!-- Name (hidden on mobile) -->
      <span class="hidden sm:inline text-sm text-content">{{ displayName }}</span>
      <!-- Chevron -->
      <svg
        class="w-4 h-4 text-content-tertiary transition-transform"
        :class="{ 'rotate-180': isOpen }"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Dropdown Menu -->
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-56 bg-surface rounded-lg shadow-lg ring-1 ring-edge overflow-hidden z-50"
      >
        <!-- User Info Header -->
        <div class="px-4 py-3 border-b border-edge bg-surface-secondary">
          <div class="flex items-center gap-3">
            <img
              v-if="avatarUrlLarge && !avatarLargeError"
              :src="avatarUrlLarge"
              :alt="displayName"
              class="w-10 h-10 rounded-full object-cover"
              @error="avatarLargeError = true"
            />
            <div
              v-else
              class="w-10 h-10 rounded-full bg-accent text-content-inverse flex items-center justify-center text-base font-medium"
            >
              {{ avatarInitial }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-content truncate">{{ displayName }}</p>
              <p class="text-xs text-content-tertiary truncate">{{ authStore.user?.email || authStore.user?.username }}</p>
            </div>
          </div>
        </div>

        <!-- Menu Items -->
        <div class="py-1">
          <!-- Profile Settings -->
          <button
            @click="goToSettings"
            class="w-full px-4 py-2 text-left text-sm text-content hover:bg-surface-hover transition-colors flex items-center gap-3"
          >
            <svg class="w-4 h-4 text-content-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            個人設定
          </button>

          <!-- Theme Selector -->
          <div class="relative">
            <button
              @click.stop="toggleThemeMenu"
              class="w-full px-4 py-2 text-left text-sm text-content hover:bg-surface-hover transition-colors flex items-center gap-3"
            >
              <svg class="w-4 h-4 text-content-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              <span class="flex-1">樣板風格</span>
              <svg
                class="w-4 h-4 text-content-tertiary transition-transform"
                :class="{ 'rotate-90': showThemeMenu }"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <!-- Theme Submenu -->
            <Transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="opacity-0"
              enter-to-class="opacity-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0"
            >
              <div
                v-if="showThemeMenu"
                class="bg-surface-secondary border-t border-edge"
              >
                <button
                  v-for="theme in THEMES"
                  :key="theme.id"
                  @click="selectTheme(theme.id)"
                  class="w-full px-4 py-2 pl-11 text-left text-sm hover:bg-surface-hover transition-colors flex items-center gap-2"
                  :class="currentTheme === theme.id ? 'text-accent' : 'text-content'"
                >
                  <!-- Theme icon -->
                  <svg
                    v-if="!theme.isDark"
                    class="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <svg
                    v-else
                    class="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span class="flex-1">{{ theme.name }}</span>
                  <svg
                    v-if="currentTheme === theme.id"
                    class="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
            </Transition>
          </div>
        </div>

        <!-- Logout -->
        <div class="border-t border-edge py-1">
          <button
            @click="handleLogout"
            class="w-full px-4 py-2 text-left text-sm text-error hover:bg-surface-hover transition-colors flex items-center gap-3"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            登出
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
