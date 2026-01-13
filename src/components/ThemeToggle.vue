<template>
  <div class="relative">
    <button
      @click="showMenu = !showMenu"
      class="p-2 rounded-lg text-content-secondary hover:bg-surface-hover transition-colors"
      :title="themeInfo.name"
    >
      <!-- Sun icon (light theme) -->
      <svg
        v-if="!isDark"
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
      <!-- Moon icon (dark theme) -->
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>
    </button>

    <!-- Dropdown menu -->
    <Transition name="dropdown">
      <div
        v-if="showMenu"
        class="absolute right-0 mt-2 w-48 bg-surface rounded-lg border border-edge z-50"
        style="box-shadow: var(--shadow-lg)"
      >
        <div class="py-1">
          <button
            v-for="theme in THEMES"
            :key="theme.id"
            @click="selectTheme(theme.id)"
            class="w-full px-4 py-2 text-left text-sm flex items-center gap-3 hover:bg-surface-hover transition-colors"
            :class="currentTheme === theme.id ? 'text-accent' : 'text-content'"
          >
            <!-- Theme icon -->
            <span class="flex-shrink-0">
              <svg
                v-if="!theme.isDark"
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            </span>

            <!-- Theme info -->
            <span class="flex-1 min-w-0">
              <span class="block font-medium truncate">{{ theme.name }}</span>
              <span class="block text-xs text-content-tertiary truncate">{{ theme.description }}</span>
            </span>

            <!-- Check mark -->
            <svg
              v-if="currentTheme === theme.id"
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useTheme, type ThemeName, THEMES } from '@/composables/useTheme'

const theme = useTheme()
const { currentTheme, themeInfo, isDark, setTheme } = theme

const showMenu = ref(false)

function selectTheme(themeId: ThemeName) {
  setTheme(themeId)
  showMenu.value = false
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    showMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
