<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useTheme, type ThemeName, THEMES } from '@/composables/useTheme'
import { getUserDisplayName } from '@/utils/avatar'
import UserAvatar from '@/components/UserAvatar.vue'

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()
const { currentTheme, setTheme } = useTheme()

const isOpen = ref(false)
const showThemeMenu = ref(false)

const displayName = computed(() => getUserDisplayName(authStore.user))

// 頭像圖片 URL（用於 UserAvatar）
const avatarImageUrl = computed(() => {
  const data = authStore.avatarData
  return data ? `data:image/png;base64,${data}` : null
})

// 使用者物件（用於 UserAvatar）
const userForAvatar = computed(() => authStore.user)

// 檢查是否為管理員
const isAdmin = computed(() => authStore.user?.role === 'app-admin')

// 當使用者變更時載入頭像
watch(() => authStore.user?.id, (newId) => {
  if (newId && !authStore.avatarData && !authStore.avatarLoading) {
    authStore.loadAvatar()
  }
}, { immediate: true })

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

const goToAdmin = () => {
  closeDropdown()
  router.push('/admin')
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
      <UserAvatar :user="userForAvatar" :image-url="avatarImageUrl" size="sm" />
      <!-- Name (hidden on mobile) -->
      <span class="hidden sm:inline text-sm text-content">{{ displayName }}</span>
      <!-- Chevron -->
      <ph-icon
        icon="chevron-down"
        class="w-4 h-4 text-content-tertiary transition-transform"
        :class="{ 'rotate-180': isOpen }"
      />
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
            <UserAvatar :user="userForAvatar" :image-url="avatarImageUrl" size="md" />
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
            <ph-icon icon="user" class="w-4 h-4 text-content-secondary" />
            {{ t('settings.profile') }}
          </button>

          <!-- System Management (Admin Only) -->
          <button
            v-if="isAdmin"
            @click="goToAdmin"
            class="w-full px-4 py-2 text-left text-sm text-content hover:bg-surface-hover transition-colors flex items-center gap-3"
          >
            <ph-icon icon="gear-six" class="w-4 h-4 text-content-secondary" />
            {{ t('admin.administration') }}
          </button>

          <!-- Theme Selector -->
          <div class="relative">
            <button
              @click.stop="toggleThemeMenu"
              class="w-full px-4 py-2 text-left text-sm text-content hover:bg-surface-hover transition-colors flex items-center gap-3"
            >
              <ph-icon icon="palette" class="w-4 h-4 text-content-secondary" />
              <span class="flex-1">{{ t('settings.theme') }}</span>
              <ph-icon
                icon="chevron-right"
                class="w-4 h-4 text-content-tertiary transition-transform"
                :class="{ 'rotate-90': showThemeMenu }"
              />
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
                  <ph-icon
                    v-if="!theme.isDark"
                    icon="sun"
                    class="w-4 h-4"
                  />
                  <ph-icon
                    v-else
                    icon="moon"
                    class="w-4 h-4"
                  />
                  <span class="flex-1">{{ theme.name }}</span>
                  <ph-icon
                    v-if="currentTheme === theme.id"
                    icon="check"
                    class="w-4 h-4"
                  />
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
            <ph-icon icon="right-from-bracket" class="w-4 h-4" />
            {{ t('auth.logout') }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
