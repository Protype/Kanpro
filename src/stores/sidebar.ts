import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export type SidebarMode = 'global' | 'project'

export const useSidebarStore = defineStore('sidebar', () => {
  // State
  const isExpanded = ref(true)
  const isMobileOpen = ref(false)
  const mode = ref<SidebarMode>('global')
  const currentProjectId = ref<number | null>(null)
  const expandedProjects = ref<Set<number>>(new Set())

  // Getters
  const isCollapsed = computed(() => !isExpanded.value)

  // Actions
  const toggleExpanded = () => {
    isExpanded.value = !isExpanded.value
    persistState()
  }

  const setExpanded = (value: boolean) => {
    isExpanded.value = value
    persistState()
  }

  const toggleMobileOpen = () => {
    isMobileOpen.value = !isMobileOpen.value
  }

  const openMobile = () => {
    isMobileOpen.value = true
  }

  const closeMobile = () => {
    isMobileOpen.value = false
  }

  const setMode = (newMode: SidebarMode) => {
    mode.value = newMode
  }

  const setCurrentProject = (projectId: number | null) => {
    currentProjectId.value = projectId
    if (projectId) {
      mode.value = 'project'
    } else {
      mode.value = 'global'
    }
  }

  const toggleProjectExpanded = (projectId: number) => {
    if (expandedProjects.value.has(projectId)) {
      expandedProjects.value.delete(projectId)
    } else {
      expandedProjects.value.add(projectId)
    }
    persistState()
  }

  const isProjectExpanded = (projectId: number) => {
    return expandedProjects.value.has(projectId)
  }

  const expandProject = (projectId: number) => {
    expandedProjects.value.add(projectId)
    persistState()
  }

  const collapseProject = (projectId: number) => {
    expandedProjects.value.delete(projectId)
    persistState()
  }

  // Persistence
  const STORAGE_KEY = 'kanpro-sidebar-state'

  const persistState = () => {
    try {
      const state = {
        isExpanded: isExpanded.value,
        expandedProjects: Array.from(expandedProjects.value)
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Ignore storage errors
    }
  }

  const loadState = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const state = JSON.parse(saved)
        if (typeof state.isExpanded === 'boolean') {
          isExpanded.value = state.isExpanded
        }
        if (Array.isArray(state.expandedProjects)) {
          expandedProjects.value = new Set(state.expandedProjects)
        }
      }
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * 重置 store 狀態（登出時呼叫）
   * 保留 isExpanded 設定，但清除與專案相關的狀態
   */
  const $reset = () => {
    isMobileOpen.value = false
    mode.value = 'global'
    currentProjectId.value = null
    expandedProjects.value = new Set()
    // 更新 localStorage
    persistState()
  }

  // Initialize state from localStorage
  loadState()

  return {
    // State
    isExpanded,
    isMobileOpen,
    mode,
    currentProjectId,
    expandedProjects,

    // Getters
    isCollapsed,

    // Actions
    toggleExpanded,
    setExpanded,
    toggleMobileOpen,
    openMobile,
    closeMobile,
    setMode,
    setCurrentProject,
    toggleProjectExpanded,
    isProjectExpanded,
    expandProject,
    collapseProject,
    loadState,
    $reset
  }
})
