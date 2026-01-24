<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { useBoardStore } from '@/stores/board'
import { useUsersStore } from '@/stores/users'
import { useToast } from '@/stores/toast'
import MembersList from '@/components/MembersList.vue'
import ColumnsList from '@/components/ColumnsList.vue'
import SwimlanesList from '@/components/SwimlanesList.vue'
import CategoriesList from '@/components/CategoriesList.vue'
import SearchModal from '@/components/SearchModal.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import type { Task, Project, User } from '@/types'

defineProps<{
  showSearchModal?: boolean
}>()

const emit = defineEmits<{
  'close-search-modal': []
}>()

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const boardStore = useBoardStore()
const usersStore = useUsersStore()
const toast = useToast()

const projectId = computed(() => Number(route.params.id))

// === 基本資訊欄位 (A+B) ===
const projectName = ref('')
const projectDescription = ref('')
const projectIdentifier = ref('')
const ownerId = ref<number | null>(null)
const startDate = ref('')
const endDate = ref('')
const isPublicAccessEnabled = ref(false)

// === 進階設定欄位 (C) ===
const priorityDefault = ref<number | undefined>(undefined)
const priorityStart = ref<number | undefined>(undefined)
const priorityEnd = ref<number | undefined>(undefined)
const projectEmail = ref('')

// === UI 狀態 ===
const isLoading = ref(false)
const isSaving = ref(false)
const showDeleteConfirm = ref(false)
const isDeleting = ref(false)
const error = ref<string | null>(null)
const ownerSearchQuery = ref('')
const showOwnerDropdown = ref(false)

// === Computed ===
const currentProject = computed(() => projectsStore.getProjectById(projectId.value))

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

// === Load project data ===
onMounted(async () => {
  await loadProjectData()
  // 載入使用者列表用於擁有者選擇（每次都重新載入以確保頭像等資料是最新的）
  usersStore.fetchAllUsers()
})

watch(projectId, async () => {
  await loadProjectData()
})

async function loadProjectData() {
  isLoading.value = true
  error.value = null

  try {
    // 載入看板資料以更新 header 的專案名稱
    await boardStore.fetchBoard(projectId.value, true)

    // 設定頁面需要完整欄位，永遠從 API 取得
    // getMyProjects 不包含 priority_*, email 等進階欄位
    const project = await projectsStore.fetchProjectById(projectId.value)

    if (project) {
      populateForm(project)
    } else {
      error.value = '找不到專案'
    }
  } catch (err) {
    error.value = '載入專案失敗'
  } finally {
    isLoading.value = false
  }
}

function populateForm(project: Project) {
  projectName.value = project.name || ''
  projectDescription.value = project.description || ''
  projectIdentifier.value = project.identifier || ''
  ownerId.value = project.owner_id || null
  startDate.value = project.start_date || ''
  endDate.value = project.end_date || ''
  // API 可能回傳 boolean | number | string，統一轉為 boolean
  isPublicAccessEnabled.value = project.is_public === true || project.is_public === 1 || project.is_public === '1'
  priorityDefault.value = project.priority_default
  priorityStart.value = project.priority_start
  priorityEnd.value = project.priority_end
  projectEmail.value = project.email || ''
}

// === Actions ===
function selectOwner(user: User) {
  ownerId.value = user.id
  ownerSearchQuery.value = ''
  showOwnerDropdown.value = false
}

function clearOwner() {
  ownerId.value = null
  showOwnerDropdown.value = false
}

async function handleSave() {
  if (!projectName.value.trim()) {
    error.value = '專案名稱不能為空'
    return
  }

  isSaving.value = true
  error.value = null

  try {
    await projectsStore.updateProject(projectId.value, {
      name: projectName.value.trim(),
      description: projectDescription.value.trim() || undefined,
      identifier: projectIdentifier.value.trim() || undefined,
      owner_id: ownerId.value || undefined,
      start_date: startDate.value || undefined,
      end_date: endDate.value || undefined,
      priority_default: priorityDefault.value,
      priority_start: priorityStart.value,
      priority_end: priorityEnd.value,
      email: projectEmail.value.trim() || undefined
    })

    // 處理公開存取設定
    const currentProject = projectsStore.getProjectById(projectId.value)
    if (currentProject) {
      if (isPublicAccessEnabled.value && !currentProject.is_public) {
        await projectsStore.enableProjectPublicAccess(projectId.value)
      } else if (!isPublicAccessEnabled.value && currentProject.is_public) {
        await projectsStore.disableProjectPublicAccess(projectId.value)
      }
    }

    toast.success('儲存成功', '專案設定已更新')
    await projectsStore.fetchProjects()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '儲存失敗'
    toast.error('儲存失敗', error.value)
  } finally {
    isSaving.value = false
  }
}

async function handleDelete() {
  isDeleting.value = true
  error.value = null

  try {
    await projectsStore.removeProject(projectId.value)
    toast.success('刪除成功', '專案已刪除')
    router.push('/')
  } catch (err) {
    error.value = err instanceof Error ? err.message : '刪除失敗'
    toast.error('刪除失敗', error.value)
    showDeleteConfirm.value = false
  } finally {
    isDeleting.value = false
  }
}

function handleSearchSelect(task: Task) {
  router.push(`/projects/${task.project_id}?task=${task.id}`)
  emit('close-search-modal')
}

// 點擊外部關閉擁有者下拉選單
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.owner-dropdown-container')) {
    showOwnerDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="h-full overflow-auto bg-surface-secondary">
    <main class="w-full px-6 py-6">
      <!-- Loading -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <ph-icon icon="spinner" class="animate-spin h-8 w-8 text-accent" />
      </div>

      <template v-else>
        <!-- Error Alert -->
        <div v-if="error" class="alert-error mb-6">
          <div class="flex items-center gap-2">
            <ph-icon icon="warning" class="w-5 h-5" />
            <span>{{ error }}</span>
          </div>
        </div>

        <!-- 專案設定表單 - 雙欄佈局（寬度比 3:2） -->
        <div class="bg-surface rounded-xl border border-edge overflow-hidden mb-6">
          <!-- Form Content -->
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
                  :disabled="isSaving"
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
                  :disabled="isSaving"
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
                  :disabled="isSaving"
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
                    :disabled="isSaving"
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
                      <span class="flex-1 text-sm text-content-tertiary">選擇擁有者</span>
                    </template>
                    <ph-icon icon="chevron-down" class="w-4 h-4 text-content-tertiary" />
                  </button>

                  <!-- Owner Dropdown -->
                  <Transition name="dropdown">
                    <div
                      v-if="showOwnerDropdown"
                      class="absolute z-10 w-full mt-1 bg-surface border border-edge rounded-md shadow-lg max-h-48 overflow-y-auto"
                    >
                      <!-- Search -->
                      <div class="p-2 border-b border-edge">
                        <input
                          v-model="ownerSearchQuery"
                          type="text"
                          placeholder="搜尋使用者..."
                          class="w-full px-2 py-1 text-sm bg-surface-secondary border border-edge rounded text-content placeholder:text-content-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                      </div>
                      <!-- User List -->
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
                    :disabled="isSaving"
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
                    :disabled="isSaving"
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
                    :disabled="isSaving"
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
                      :disabled="isSaving"
                    />
                    <span class="text-content-tertiary text-xs">~</span>
                    <input
                      v-model.number="priorityEnd"
                      type="number"
                      min="0"
                      class="input text-sm flex-1"
                      placeholder="3"
                      :disabled="isSaving"
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
                  :disabled="isSaving"
                />
              </div>

              <!-- 公開存取 -->
              <div class="flex items-start gap-3 pt-3 border-t border-edge">
                <input
                  id="publicAccess"
                  v-model="isPublicAccessEnabled"
                  type="checkbox"
                  :disabled="isSaving"
                  class="mt-0.5 w-4 h-4 rounded border-edge text-accent focus:ring-accent focus:ring-offset-0"
                />
                <div>
                  <label for="publicAccess" class="text-sm text-content font-medium cursor-pointer">
                    啟用公開存取
                  </label>
                  <p class="text-xs text-content-tertiary mt-0.5">
                    允許未登入的使用者檢視此專案
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Form Footer with Save Button -->
          <div class="flex justify-end px-6 py-4 border-t border-edge bg-surface-secondary/30">
            <button
              @click="handleSave"
              :disabled="isSaving"
              class="btn-primary"
            >
              <ph-icon v-if="isSaving" icon="spinner" class="animate-spin -ml-1 mr-2 h-4 w-4" />
              {{ isSaving ? '儲存中...' : '儲存變更' }}
            </button>
          </div>
        </div>

        <!-- 管理區塊 - 2x2 Grid（無外層包裝） -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <!-- 成員管理 -->
          <div class="settings-card">
            <MembersList :project-id="projectId" />
          </div>

          <!-- 類別管理 -->
          <div class="settings-card">
            <CategoriesList :project-id="projectId" />
          </div>

          <!-- 欄位管理 -->
          <div class="settings-card">
            <ColumnsList :project-id="projectId" />
          </div>

          <!-- 泳道管理 -->
          <div class="settings-card">
            <SwimlanesList :project-id="projectId" />
          </div>
        </div>

        <!-- 危險區域 -->
        <div class="bg-surface rounded-xl border border-red-200 dark:border-red-900/50 overflow-hidden">
          <div class="px-6 py-4 bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-900/50">
            <div class="flex items-center gap-2">
              <ph-icon icon="warning" class="w-5 h-5 text-red-600 dark:text-red-400" />
              <h2 class="text-base font-semibold text-red-700 dark:text-red-400">危險區域</h2>
            </div>
          </div>
          <div class="p-6">
            <div class="flex items-center justify-between gap-4">
              <div>
                <h3 class="font-medium text-content">刪除專案</h3>
                <p class="text-sm text-content-secondary mt-1">
                  刪除後無法恢復，專案中的所有任務和資料將被永久刪除。
                </p>
              </div>
              <button
                @click="showDeleteConfirm = true"
                :disabled="isDeleting"
                class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 shrink-0 transition-colors"
              >
                刪除專案
              </button>
            </div>
          </div>
        </div>
      </template>
    </main>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="showDeleteConfirm"
        class="fixed inset-0 z-50 overflow-y-auto"
      >
        <div
          class="fixed inset-0 bg-black bg-opacity-50"
          @click="showDeleteConfirm = false"
        ></div>
        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative card w-full max-w-md p-6">
            <h3 class="text-lg font-semibold text-content mb-2">確認刪除專案</h3>
            <p class="text-content-secondary mb-4">
              您確定要刪除「{{ currentProject?.name }}」嗎？此操作無法復原。
            </p>

            <div class="flex justify-end gap-3">
              <button
                @click="showDeleteConfirm = false"
                :disabled="isDeleting"
                class="btn-secondary"
              >
                取消
              </button>
              <button
                @click="handleDelete"
                :disabled="isDeleting"
                class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                <span v-if="isDeleting">刪除中...</span>
                <span v-else>確認刪除</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Search Modal -->
    <SearchModal
      v-if="showSearchModal"
      :project-id="projectId"
      @close="emit('close-search-modal')"
      @select="handleSearchSelect"
    />
  </div>
</template>

<style scoped>
@reference "@/styles/main.css";

/* Settings Card - matches BoardView column style */
.settings-card {
  @apply bg-surface rounded-xl border border-edge overflow-hidden;
}

.settings-card :deep(h3) {
  @apply text-base font-semibold text-content;
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
