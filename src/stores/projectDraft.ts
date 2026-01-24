import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 專案草稿的基本資訊
 */
export interface ProjectDraftInfo {
  name: string
  description: string
  identifier: string
  ownerId: number | null
  startDate: string
  endDate: string
  priorityDefault: number | undefined
  priorityStart: number | undefined
  priorityEnd: number | undefined
  email: string
  disablePublicAccess: boolean
}

/**
 * 緩存的成員資料
 */
export interface CachedMember {
  userId: number
  role: 'project-manager' | 'project-member' | 'project-viewer'
}

/**
 * 緩存的類別資料
 */
export interface CachedCategory {
  name: string
  color?: string
}

/**
 * 緩存的欄位資料
 */
export interface CachedColumn {
  title: string
  taskLimit: number
  description?: string
}

/**
 * 緩存的泳道資料
 */
export interface CachedSwimlane {
  name: string
  description: string
}

function getDefaultDraft(): ProjectDraftInfo {
  return {
    name: '',
    description: '',
    identifier: '',
    ownerId: null,
    startDate: '',
    endDate: '',
    priorityDefault: undefined,
    priorityStart: undefined,
    priorityEnd: undefined,
    email: '',
    disablePublicAccess: false
  }
}

/**
 * 專案草稿 Store
 * 用於緩存建立專案頁面的資料，以及從燈箱展開時帶入的資料
 */
export const useProjectDraftStore = defineStore('projectDraft', () => {
  // === 基本資訊 ===
  const draft = ref<ProjectDraftInfo>(getDefaultDraft())

  // === 緩存的管理資料 ===
  const cachedMembers = ref<CachedMember[]>([])
  const cachedCategories = ref<CachedCategory[]>([])
  const cachedColumns = ref<CachedColumn[]>([])
  const cachedSwimlanes = ref<CachedSwimlane[]>([])

  // === Computed ===
  const hasDraftData = computed(() => {
    return draft.value.name.trim().length > 0
  })

  const hasCachedData = computed(() => {
    return (
      cachedMembers.value.length > 0 ||
      cachedCategories.value.length > 0 ||
      cachedColumns.value.length > 0 ||
      cachedSwimlanes.value.length > 0
    )
  })

  // === Draft Actions ===
  function updateDraft(data: Partial<ProjectDraftInfo>) {
    draft.value = { ...draft.value, ...data }
  }

  function resetDraft() {
    draft.value = getDefaultDraft()
    cachedMembers.value = []
    cachedCategories.value = []
    cachedColumns.value = []
    cachedSwimlanes.value = []
  }

  // === Member Actions ===
  function addCachedMember(member: CachedMember) {
    const existingIndex = cachedMembers.value.findIndex(m => m.userId === member.userId)
    if (existingIndex >= 0) {
      cachedMembers.value[existingIndex] = member
    } else {
      cachedMembers.value.push(member)
    }
  }

  function removeCachedMember(userId: number) {
    cachedMembers.value = cachedMembers.value.filter(m => m.userId !== userId)
  }

  // === Category Actions ===
  function addCachedCategory(category: CachedCategory) {
    cachedCategories.value.push(category)
  }

  function removeCachedCategory(index: number) {
    cachedCategories.value.splice(index, 1)
  }

  // === Column Actions ===
  function addCachedColumn(column: CachedColumn) {
    cachedColumns.value.push(column)
  }

  function updateCachedColumn(index: number, column: CachedColumn) {
    if (index >= 0 && index < cachedColumns.value.length) {
      cachedColumns.value[index] = column
    }
  }

  function removeCachedColumn(index: number) {
    cachedColumns.value.splice(index, 1)
  }

  // === Swimlane Actions ===
  function addCachedSwimlane(swimlane: CachedSwimlane) {
    cachedSwimlanes.value.push(swimlane)
  }

  function removeCachedSwimlane(index: number) {
    cachedSwimlanes.value.splice(index, 1)
  }

  return {
    // State
    draft,
    cachedMembers,
    cachedCategories,
    cachedColumns,
    cachedSwimlanes,

    // Computed
    hasDraftData,
    hasCachedData,

    // Actions
    updateDraft,
    resetDraft,
    addCachedMember,
    removeCachedMember,
    addCachedCategory,
    removeCachedCategory,
    addCachedColumn,
    updateCachedColumn,
    removeCachedColumn,
    addCachedSwimlane,
    removeCachedSwimlane
  }
})
