<template>
  <div class="relative">
    <button
      @click="showMenu = !showMenu"
      class="p-2 rounded-lg text-content-secondary hover:bg-surface-hover transition-colors"
      :title="themeInfo.name"
    >
      <!-- Sun icon (light theme) -->
      <ph-icon
        v-if="!isDark"
        icon="sun"
        class="h-5 w-5"
      />
      <!-- Moon icon (dark theme) -->
      <ph-icon
        v-else
        icon="moon"
        class="h-5 w-5"
      />
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
              <ph-icon
                v-if="!theme.isDark"
                icon="sun"
                class="h-4 w-4"
              />
              <ph-icon
                v-else
                icon="moon"
                class="h-4 w-4"
              />
            </span>

            <!-- Theme info -->
            <span class="flex-1 min-w-0">
              <span class="block font-medium truncate">{{ theme.name }}</span>
              <span class="block text-xs text-content-tertiary truncate">{{ theme.description }}</span>
            </span>

            <!-- Check mark -->
            <ph-icon
              v-if="currentTheme === theme.id"
              icon="check"
              class="h-4 w-4 flex-shrink-0"
            />
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
