<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { useUsersStore } from '@/stores/users'
import { useProjectDraftStore } from '@/stores/projectDraft'
import { useColumnsStore } from '@/stores/columns'
import { useCategoriesStore } from '@/stores/categories'
import { useSwimlanesStore } from '@/stores/swimlanes'
import { useMembersStore } from '@/stores/members'
import { useToast } from '@/stores/toast'
import UserAvatar from '@/components/UserAvatar.vue'
import type { User } from '@/types'

const router = useRouter()
const projectsStore = useProjectsStore()
const usersStore = useUsersStore()
const draftStore = useProjectDraftStore()
const columnsStore = useColumnsStore()
const categoriesStore = useCategoriesStore()
const swimlanesStore = useSwimlanesStore()
const membersStore = useMembersStore()
const toast = useToast()

// === 基本資訊欄位 (綁定到 draft store) ===
const projectName = computed({
  get: () => draftStore.draft.name,
  set: (val) => draftStore.updateDraft({ name: val })
})
const projectDescription = computed({
  get: () => draftStore.draft.description,
  set: (val) => draftStore.updateDraft({ description: val })
})
const projectIdentifier = computed({
  get: () => draftStore.draft.identifier,
  set: (val) => draftStore.updateDraft({ identifier: val })
})
const ownerId = computed({
  get: () => draftStore.draft.ownerId,
  set: (val) => draftStore.updateDraft({ ownerId: val })
})
const startDate = computed({
  get: () => draftStore.draft.startDate,
  set: (val) => draftStore.updateDraft({ startDate: val })
})
const endDate = computed({
  get: () => draftStore.draft.endDate,
  set: (val) => draftStore.updateDraft({ endDate: val })
})
const priorityDefault = computed({
  get: () => draftStore.draft.priorityDefault,
  set: (val) => draftStore.updateDraft({ priorityDefault: val })
})
const priorityStart = computed({
  get: () => draftStore.draft.priorityStart,
  set: (val) => draftStore.updateDraft({ priorityStart: val })
})
const priorityEnd = computed({
  get: () => draftStore.draft.priorityEnd,
  set: (val) => draftStore.updateDraft({ priorityEnd: val })
})
const projectEmail = computed({
  get: () => draftStore.draft.email,
  set: (val) => draftStore.updateDraft({ email: val })
})
const disablePublicAccess = computed({
  get: () => draftStore.draft.disablePublicAccess,
  set: (val) => draftStore.updateDraft({ disablePublicAccess: val })
})

// === UI 狀態 ===
const isCreating = ref(false)
const error = ref<string | null>(null)
const ownerSearchQuery = ref('')
const showOwnerDropdown = ref(false)

// === 管理區塊輸入狀態 ===
const newMemberUserId = ref<number | null>(null)
const newMemberRole = ref<'project-manager' | 'project-member' | 'project-viewer'>('project-member')
const showMemberDropdown = ref(false)
const memberSearchQuery = ref('')

const newCategoryName = ref('')
const newCategoryColor = ref('')

const newColumnTitle = ref('')
const newColumnLimit = ref(0)

const newSwimlaneName = ref('')
const newSwimlaneDescription = ref('')

// === Computed ===
const isValid = computed(() => projectName.value.trim().length > 0)

const filteredUsers = computed(() => {
  const query = ownerSearchQuery.value.toLowerCase()
  if (!query) return usersStore.activeUsers
  return usersStore.activeUsers.filter(u =>
    u.username.toLowerCase().includes(query) ||
    (u.name?.toLowerCase().includes(query) ?? false)
  )
})

const selectedOwner = computed(() => {
  if (!ownerId.value) return null
  return usersStore.users.find(u => u.id === ownerId.value) || null
})

const filteredMemberUsers = computed(() => {
  const query = memberSearchQuery.value.toLowerCase()
  const existingIds = draftStore.cachedMembers.map(m => m.userId)
  let users = usersStore.activeUsers.filter(u => !existingIds.includes(u.id))
  if (query) {
    users = users.filter(u =>
      u.username.toLowerCase().includes(query) ||
      (u.name?.toLowerCase().includes(query) ?? false)
    )
  }
  return users
})

// === Functions ===
function selectOwner(user: User) {
  ownerId.value = user.id
  ownerSearchQuery.value = ''
  showOwnerDropdown.value = false
}

function clearOwner() {
  ownerId.value = null
  showOwnerDropdown.value = false
}

function getUserById(userId: number): User | undefined {
  return usersStore.users.find(u => u.id === userId)
}

// === 成員管理 ===
function addMember() {
  if (!newMemberUserId.value) return
  draftStore.addCachedMember({
    userId: newMemberUserId.value,
    role: newMemberRole.value
  })
  newMemberUserId.value = null
  newMemberRole.value = 'project-member'
  showMemberDropdown.value = false
  memberSearchQuery.value = ''
}

function selectMemberUser(user: User) {
  newMemberUserId.value = user.id
  memberSearchQuery.value = ''
  showMemberDropdown.value = false
}

function removeMember(userId: number) {
  draftStore.removeCachedMember(userId)
}

// === 類別管理 ===
function addCategory() {
  if (!newCategoryName.value.trim()) return
  draftStore.addCachedCategory({
    name: newCategoryName.value.trim(),
    color: newCategoryColor.value || undefined
  })
  newCategoryName.value = ''
  newCategoryColor.value = ''
}

function removeCategory(index: number) {
  draftStore.removeCachedCategory(index)
}

// === 欄位管理 ===
function addColumn() {
  if (!newColumnTitle.value.trim()) return
  draftStore.addCachedColumn({
    title: newColumnTitle.value.trim(),
    taskLimit: newColumnLimit.value || 0
  })
  newColumnTitle.value = ''
  newColumnLimit.value = 0
}

function removeColumn(index: number) {
  draftStore.removeCachedColumn(index)
}

// === 泳道管理 ===
function addSwimlane() {
  if (!newSwimlaneName.value.trim()) return
  draftStore.addCachedSwimlane({
    name: newSwimlaneName.value.trim(),
    description: newSwimlaneDescription.value
  })
  newSwimlaneName.value = ''
  newSwimlaneDescription.value = ''
}

function removeSwimlane(index: number) {
  draftStore.removeCachedSwimlane(index)
}

// === 建立專案 ===
async function handleCreate() {
  if (!isValid.value || isCreating.value) return

  isCreating.value = true
  error.value = null

  try {
    // Step 1: 建立專案
    const projectId = await projectsStore.createProject({
      name: projectName.value.trim(),
      description: projectDescription.value.trim() || undefined,
      identifier: projectIdentifier.value.trim() || undefined,
      owner_id: ownerId.value || undefined,
      start_date: startDate.value || undefined,
      end_date: endDate.value || undefined,
      priority_default: priorityDefault.value,
      priority_start: priorityStart.value,
      priority_end: priorityEnd.value,
      email: projectEmail.value.trim() || undefined,
      disablePublicAccess: disablePublicAccess.value
    })

    if (projectId === false) {
      throw new Error(projectsStore.error || '建立專案失敗')
    }

    // Step 2: 建立緩存的成員
    for (const member of draftStore.cachedMembers) {
      try {
        await membersStore.addProjectUser(projectId, member.userId, member.role)
      } catch (err) {
        console.error('Failed to add member:', err)
      }
    }

    // Step 3: 建立緩存的類別
    for (const category of draftStore.cachedCategories) {
      try {
        await categoriesStore.addCategory(projectId, category.name)
      } catch (err) {
        console.error('Failed to create category:', err)
      }
    }

    // Step 4: 建立緩存的欄位
    for (const column of draftStore.cachedColumns) {
      try {
        await columnsStore.addColumn(projectId, column.title, column.taskLimit)
      } catch (err) {
        console.error('Failed to add column:', err)
      }
    }

    // Step 5: 建立緩存的泳道
    for (const swimlane of draftStore.cachedSwimlanes) {
      try {
        await swimlanesStore.addSwimlane(projectId, swimlane.name, swimlane.description)
      } catch (err) {
        console.error('Failed to add swimlane:', err)
      }
    }

    // 清除草稿資料
    draftStore.resetDraft()

    toast.success('建立成功', '專案已建立')
    router.push(`/projects/${projectId}/board`)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '建立專案失敗'
    toast.error('建立失敗', error.value)
  } finally {
    isCreating.value = false
  }
}

function handleCancel() {
  draftStore.resetDraft()
  router.back()
}

// 點擊外部關閉下拉選單
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.owner-dropdown-container')) {
    showOwnerDropdown.value = false
  }
  if (!target.closest('.member-dropdown-container')) {
    showMemberDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  // 載入使用者列表
  if (usersStore.users.length === 0) {
    usersStore.fetchAllUsers()
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="h-full overflow-auto bg-surface-secondary">
    <main class="w-full px-6 py-6">
      <!-- Error Alert -->
      <div v-if="error" class="alert-error mb-6">
        <div class="flex items-center gap-2">
          <ph-icon icon="warning" class="w-5 h-5" />
          <span>{{ error }}</span>
        </div>
      </div>

      <!-- 專案設定表單 - 雙欄佈局（寬度比 3:2） -->
      <div class="bg-surface rounded-xl border border-edge overflow-hidden mb-6">
        <div class="flex">
          <!-- 左欄 - 基礎欄位（3/5 寬度） -->
          <div class="w-3/5 p-6 space-y-5">
            <!-- 專案名稱 -->
            <div>
              <label for="projectName" class="block text-sm font-medium text-content-secondary mb-1.5">
                專案名稱 <span class="text-red-500">*</span>
              </label>
              <input
                id="projectName"
                v-model="projectName"
                type="text"
                class="input"
                placeholder="輸入專案名稱"
                :disabled="isCreating"
              />
            </div>

            <!-- 專案描述 -->
            <div>
              <label for="projectDescription" class="block text-sm font-medium text-content-secondary mb-1.5">
                描述
              </label>
              <textarea
                id="projectDescription"
                v-model="projectDescription"
                rows="4"
                class="input resize-none"
                placeholder="輸入專案描述（選填）"
                :disabled="isCreating"
              ></textarea>
            </div>

            <!-- 專案識別碼 -->
            <div>
              <label for="projectIdentifier" class="block text-sm font-medium text-content-secondary mb-1.5">
                專案識別碼
              </label>
              <input
                id="projectIdentifier"
                v-model="projectIdentifier"
                type="text"
                class="input"
                placeholder="例如：PROJ"
                :disabled="isCreating"
              />
              <p class="mt-1.5 text-xs text-content-tertiary">
                用於任務編號前綴，如：PROJ-123
              </p>
            </div>
          </div>

          <!-- 右欄 - 進階欄位（2/5 寬度） -->
          <div class="w-2/5 border-l border-edge bg-surface-secondary/30 p-6 space-y-5">
            <!-- 擁有者 -->
            <div class="owner-dropdown-container">
              <label class="block text-sm font-medium text-content-secondary mb-1.5">
                擁有者
              </label>
              <div class="relative">
                <button
                  type="button"
                  @click="showOwnerDropdown = !showOwnerDropdown"
                  class="w-full px-3 py-2 bg-surface border border-edge rounded-md text-left flex items-center gap-2 hover:bg-surface-hover transition-colors"
                  :disabled="isCreating"
                >
                  <template v-if="selectedOwner">
                    <UserAvatar :user="selectedOwner" size="sm" />
                    <span class="flex-1 truncate text-sm text-content">
                      {{ selectedOwner.name || selectedOwner.username }}
                    </span>
                    <button
                      type="button"
                      @click.stop="clearOwner"
                      class="text-content-tertiary hover:text-content-secondary"
                    >
                      <ph-icon icon="xmark" class="w-4 h-4" />
                    </button>
                  </template>
                  <template v-else>
                    <span class="flex-1 text-sm text-content-tertiary">選擇擁有者（選填）</span>
                  </template>
                  <ph-icon icon="chevron-down" class="w-4 h-4 text-content-tertiary" />
                </button>

                <!-- Owner Dropdown -->
                <Transition name="dropdown">
                  <div
                    v-if="showOwnerDropdown"
                    class="absolute z-10 w-full mt-1 bg-surface border border-edge rounded-md shadow-lg max-h-48 overflow-y-auto"
                  >
                    <div class="p-2 border-b border-edge">
                      <input
                        v-model="ownerSearchQuery"
                        type="text"
                        placeholder="搜尋使用者..."
                        class="w-full px-2 py-1 text-sm bg-surface-secondary border border-edge rounded text-content placeholder:text-content-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                    <div class="py-1">
                      <button
                        v-for="user in filteredUsers"
                        :key="user.id"
                        type="button"
                        @click="selectOwner(user)"
                        class="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-surface-hover transition-colors"
                        :class="{ 'bg-accent/10': ownerId === user.id }"
                      >
                        <UserAvatar :user="user" size="sm" />
                        <div class="flex-1 min-w-0">
                          <div class="text-sm text-content truncate">{{ user.name || user.username }}</div>
                          <div class="text-xs text-content-tertiary truncate">@{{ user.username }}</div>
                        </div>
                      </button>
                      <div v-if="filteredUsers.length === 0" class="px-3 py-2 text-sm text-content-tertiary">
                        找不到使用者
                      </div>
                    </div>
                  </div>
                </Transition>
              </div>
            </div>

            <!-- 日期範圍 -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="startDate" class="block text-sm font-medium text-content-secondary mb-1.5">
                  開始日期
                </label>
                <input
                  id="startDate"
                  v-model="startDate"
                  type="date"
                  class="input text-sm"
                  :disabled="isCreating"
                />
              </div>
              <div>
                <label for="endDate" class="block text-sm font-medium text-content-secondary mb-1.5">
                  結束日期
                </label>
                <input
                  id="endDate"
                  v-model="endDate"
                  type="date"
                  class="input text-sm"
                  :min="startDate"
                  :disabled="isCreating"
                />
              </div>
            </div>

            <!-- 優先級設定 -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="priorityDefault" class="block text-sm font-medium text-content-secondary mb-1.5">
                  預設優先級
                </label>
                <input
                  id="priorityDefault"
                  v-model.number="priorityDefault"
                  type="number"
                  min="0"
                  class="input text-sm"
                  placeholder="0"
                  :disabled="isCreating"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-content-secondary mb-1.5">
                  優先級範圍
                </label>
                <div class="flex items-center gap-1">
                  <input
                    v-model.number="priorityStart"
                    type="number"
                    min="0"
                    class="input text-sm flex-1"
                    placeholder="0"
                    :disabled="isCreating"
                  />
                  <span class="text-content-tertiary text-xs">~</span>
                  <input
                    v-model.number="priorityEnd"
                    type="number"
                    min="0"
                    class="input text-sm flex-1"
                    placeholder="3"
                    :disabled="isCreating"
                  />
                </div>
              </div>
            </div>

            <!-- 專案 Email -->
            <div>
              <label for="projectEmail" class="block text-sm font-medium text-content-secondary mb-1.5">
                專案通知 Email
              </label>
              <input
                id="projectEmail"
                v-model="projectEmail"
                type="email"
                class="input text-sm"
                placeholder="project@example.com"
                :disabled="isCreating"
              />
            </div>

            <!-- 公開存取 -->
            <div class="flex items-start gap-3 pt-3 border-t border-edge">
              <input
                id="disablePublicAccess"
                v-model="disablePublicAccess"
                type="checkbox"
                :disabled="isCreating"
                class="mt-0.5 w-4 h-4 rounded border-edge text-accent focus:ring-accent focus:ring-offset-0"
              />
              <div>
                <label for="disablePublicAccess" class="text-sm text-content font-medium cursor-pointer">
                  限制公開存取
                </label>
                <p class="text-xs text-content-tertiary mt-0.5">
                  建立後將自動關閉公開存取功能
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Form Footer with Action Buttons -->
        <div class="flex justify-end gap-3 px-6 py-4 border-t border-edge bg-surface-secondary/30">
          <button
            type="button"
            @click="handleCancel"
            :disabled="isCreating"
            class="btn-secondary"
          >
            取消
          </button>
          <button
            type="button"
            @click="handleCreate"
            :disabled="!isValid || isCreating"
            class="btn-primary"
          >
            <ph-icon v-if="isCreating" icon="spinner" class="animate-spin -ml-1 mr-2 h-4 w-4" />
            {{ isCreating ? '建立中...' : '建立專案' }}
          </button>
        </div>
      </div>

      <!-- 管理區塊 - 2x2 Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <!-- 成員管理 -->
        <div class="settings-card">
          <div class="px-4 py-3 border-b border-edge">
            <h3 class="text-base font-semibold text-content">成員</h3>
            <p class="text-xs text-content-tertiary mt-0.5">專案建立後將自動加入這些成員</p>
          </div>
          <div class="p-4 space-y-3">
            <!-- 新增成員表單 -->
            <div class="flex gap-2 member-dropdown-container">
              <div class="relative flex-1">
                <button
                  type="button"
                  @click="showMemberDropdown = !showMemberDropdown"
                  class="w-full px-3 py-2 bg-surface-secondary border border-edge rounded-md text-left text-sm text-content-tertiary hover:bg-surface-hover transition-colors"
                >
                  {{ newMemberUserId ? getUserById(newMemberUserId)?.name || getUserById(newMemberUserId)?.username : '選擇使用者' }}
                </button>
                <Transition name="dropdown">
                  <div
                    v-if="showMemberDropdown"
                    class="absolute z-10 w-full mt-1 bg-surface border border-edge rounded-md shadow-lg max-h-48 overflow-y-auto"
                  >
                    <div class="p-2 border-b border-edge">
                      <input
                        v-model="memberSearchQuery"
                        type="text"
                        placeholder="搜尋使用者..."
                        class="w-full px-2 py-1 text-sm bg-surface-secondary border border-edge rounded text-content placeholder:text-content-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                    <div class="py-1">
                      <button
                        v-for="user in filteredMemberUsers"
                        :key="user.id"
                        type="button"
                        @click="selectMemberUser(user)"
                        class="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-surface-hover transition-colors"
                      >
                        <UserAvatar :user="user" size="sm" />
                        <div class="flex-1 min-w-0">
                          <div class="text-sm text-content truncate">{{ user.name || user.username }}</div>
                        </div>
                      </button>
                      <div v-if="filteredMemberUsers.length === 0" class="px-3 py-2 text-sm text-content-tertiary">
                        沒有可新增的使用者
                      </div>
                    </div>
                  </div>
                </Transition>
              </div>
              <select
                v-model="newMemberRole"
                class="input text-sm w-32"
              >
                <option value="project-manager">管理員</option>
                <option value="project-member">成員</option>
                <option value="project-viewer">檢視者</option>
              </select>
              <button
                type="button"
                @click="addMember"
                :disabled="!newMemberUserId"
                class="btn-secondary px-3"
              >
                <ph-icon icon="plus" class="w-4 h-4" />
              </button>
            </div>
            <!-- 成員列表 -->
            <div v-if="draftStore.cachedMembers.length > 0" class="space-y-2">
              <div
                v-for="member in draftStore.cachedMembers"
                :key="member.userId"
                class="flex items-center justify-between p-2 bg-surface-secondary rounded-md"
              >
                <div class="flex items-center gap-2">
                  <UserAvatar :user="getUserById(member.userId)" size="sm" />
                  <span class="text-sm text-content">{{ getUserById(member.userId)?.name || getUserById(member.userId)?.username }}</span>
                  <span class="text-xs text-content-tertiary px-1.5 py-0.5 bg-surface rounded">
                    {{ member.role === 'project-manager' ? '管理員' : member.role === 'project-member' ? '成員' : '檢視者' }}
                  </span>
                </div>
                <button
                  type="button"
                  @click="removeMember(member.userId)"
                  class="text-content-tertiary hover:text-red-500 transition-colors"
                >
                  <ph-icon icon="xmark" class="w-4 h-4" />
                </button>
              </div>
            </div>
            <div v-else class="text-sm text-content-tertiary text-center py-4">
              尚未新增成員
            </div>
          </div>
        </div>

        <!-- 類別管理 -->
        <div class="settings-card">
          <div class="px-4 py-3 border-b border-edge">
            <h3 class="text-base font-semibold text-content">類別</h3>
            <p class="text-xs text-content-tertiary mt-0.5">專案建立後將自動建立這些類別</p>
          </div>
          <div class="p-4 space-y-3">
            <!-- 新增類別表單 -->
            <div class="flex gap-2">
              <input
                v-model="newCategoryName"
                type="text"
                placeholder="類別名稱"
                class="input text-sm flex-1"
              />
              <input
                v-model="newCategoryColor"
                type="text"
                placeholder="顏色（選填）"
                class="input text-sm w-24"
              />
              <button
                type="button"
                @click="addCategory"
                :disabled="!newCategoryName.trim()"
                class="btn-secondary px-3"
              >
                <ph-icon icon="plus" class="w-4 h-4" />
              </button>
            </div>
            <!-- 類別列表 -->
            <div v-if="draftStore.cachedCategories.length > 0" class="space-y-2">
              <div
                v-for="(category, index) in draftStore.cachedCategories"
                :key="index"
                class="flex items-center justify-between p-2 bg-surface-secondary rounded-md"
              >
                <span class="text-sm text-content">{{ category.name }}</span>
                <button
                  type="button"
                  @click="removeCategory(index)"
                  class="text-content-tertiary hover:text-red-500 transition-colors"
                >
                  <ph-icon icon="xmark" class="w-4 h-4" />
                </button>
              </div>
            </div>
            <div v-else class="text-sm text-content-tertiary text-center py-4">
              尚未新增類別
            </div>
          </div>
        </div>

        <!-- 欄位管理 -->
        <div class="settings-card">
          <div class="px-4 py-3 border-b border-edge">
            <h3 class="text-base font-semibold text-content">欄位</h3>
            <p class="text-xs text-content-tertiary mt-0.5">專案建立後將自動建立這些欄位</p>
          </div>
          <div class="p-4 space-y-3">
            <!-- 新增欄位表單 -->
            <div class="flex gap-2">
              <input
                v-model="newColumnTitle"
                type="text"
                placeholder="欄位名稱"
                class="input text-sm flex-1"
              />
              <input
                v-model.number="newColumnLimit"
                type="number"
                min="0"
                placeholder="WIP 限制"
                class="input text-sm w-24"
              />
              <button
                type="button"
                @click="addColumn"
                :disabled="!newColumnTitle.trim()"
                class="btn-secondary px-3"
              >
                <ph-icon icon="plus" class="w-4 h-4" />
              </button>
            </div>
            <!-- 欄位列表 -->
            <div v-if="draftStore.cachedColumns.length > 0" class="space-y-2">
              <div
                v-for="(column, index) in draftStore.cachedColumns"
                :key="index"
                class="flex items-center justify-between p-2 bg-surface-secondary rounded-md"
              >
                <div class="flex items-center gap-2">
                  <span class="text-sm text-content">{{ column.title }}</span>
                  <span v-if="column.taskLimit > 0" class="text-xs text-content-tertiary px-1.5 py-0.5 bg-surface rounded">
                    WIP: {{ column.taskLimit }}
                  </span>
                </div>
                <button
                  type="button"
                  @click="removeColumn(index)"
                  class="text-content-tertiary hover:text-red-500 transition-colors"
                >
                  <ph-icon icon="xmark" class="w-4 h-4" />
                </button>
              </div>
            </div>
            <div v-else class="text-sm text-content-tertiary text-center py-4">
              尚未新增欄位（將使用預設欄位）
            </div>
          </div>
        </div>

        <!-- 泳道管理 -->
        <div class="settings-card">
          <div class="px-4 py-3 border-b border-edge">
            <h3 class="text-base font-semibold text-content">泳道</h3>
            <p class="text-xs text-content-tertiary mt-0.5">專案建立後將自動建立這些泳道</p>
          </div>
          <div class="p-4 space-y-3">
            <!-- 新增泳道表單 -->
            <div class="flex gap-2">
              <input
                v-model="newSwimlaneName"
                type="text"
                placeholder="泳道名稱"
                class="input text-sm flex-1"
              />
              <button
                type="button"
                @click="addSwimlane"
                :disabled="!newSwimlaneName.trim()"
                class="btn-secondary px-3"
              >
                <ph-icon icon="plus" class="w-4 h-4" />
              </button>
            </div>
            <!-- 泳道列表 -->
            <div v-if="draftStore.cachedSwimlanes.length > 0" class="space-y-2">
              <div
                v-for="(swimlane, index) in draftStore.cachedSwimlanes"
                :key="index"
                class="flex items-center justify-between p-2 bg-surface-secondary rounded-md"
              >
                <span class="text-sm text-content">{{ swimlane.name }}</span>
                <button
                  type="button"
                  @click="removeSwimlane(index)"
                  class="text-content-tertiary hover:text-red-500 transition-colors"
                >
                  <ph-icon icon="xmark" class="w-4 h-4" />
                </button>
              </div>
            </div>
            <div v-else class="text-sm text-content-tertiary text-center py-4">
              尚未新增泳道（將使用預設泳道）
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
@reference "@/styles/main.css";

.settings-card {
  @apply bg-surface rounded-xl border border-edge overflow-hidden;
}

/* Dropdown Transition */
.dropdown-enter-active {
  transition: all 0.15s ease-out;
}

.dropdown-leave-active {
  transition: all 0.1s ease-in;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-0.25rem);
}
</style>
