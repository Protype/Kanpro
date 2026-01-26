<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useProjectsStore } from '@/stores/projects'
import { useUsersStore } from '@/stores/users'
import { useProjectDraftStore } from '@/stores/projectDraft'
import { useToast } from '@/stores/toast'
import UserAvatar from '@/components/UserAvatar.vue'
import type { User } from '@/types'

const router = useRouter()
const { t } = useI18n()
const projectsStore = useProjectsStore()
const usersStore = useUsersStore()
const draftStore = useProjectDraftStore()
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
const enablePublicAccess = computed({
  get: () => draftStore.draft.enablePublicAccess,
  set: (val) => draftStore.updateDraft({ enablePublicAccess: val })
})

// === UI 狀態 ===
const isCreating = ref(false)
const error = ref<string | null>(null)
const ownerSearchQuery = ref('')
const showOwnerDropdown = ref(false)

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
      enablePublicAccess: enablePublicAccess.value
    })

    if (projectId === false) {
      throw new Error(projectsStore.error || t('project.createFailed'))
    }

    // 清除草稿資料
    draftStore.resetDraft()

    toast.success(t('message.createSuccess'), t('project.projectCreated'))
    router.push(`/projects/${projectId}/board`)
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('project.createFailed')
    toast.error(t('message.createFailed'), error.value)
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
                {{ t('project.projectName') }} <span class="text-red-500">*</span>
              </label>
              <input
                id="projectName"
                v-model="projectName"
                type="text"
                class="input"
                :placeholder="t('project.enterProjectName')"
                :disabled="isCreating"
              />
            </div>

            <!-- 專案描述 -->
            <div>
              <label for="projectDescription" class="block text-sm font-medium text-content-secondary mb-1.5">
                {{ t('common.description') }}
              </label>
              <textarea
                id="projectDescription"
                v-model="projectDescription"
                rows="4"
                class="input resize-none"
                :placeholder="t('project.enterDescription')"
                :disabled="isCreating"
              ></textarea>
            </div>

            <!-- 專案識別碼 -->
            <div>
              <label for="projectIdentifier" class="block text-sm font-medium text-content-secondary mb-1.5">
                {{ t('project.identifier') }}
              </label>
              <input
                id="projectIdentifier"
                v-model="projectIdentifier"
                type="text"
                class="input"
                :placeholder="t('project.identifierPlaceholder')"
                :disabled="isCreating"
              />
              <p class="mt-1.5 text-xs text-content-tertiary">
                {{ t('project.identifierHint') }}
              </p>
            </div>
          </div>

          <!-- 右欄 - 進階欄位（2/5 寬度） -->
          <div class="w-2/5 border-l border-edge bg-surface-secondary/30 p-6 space-y-5">
            <!-- 擁有者 -->
            <div class="owner-dropdown-container">
              <label class="block text-sm font-medium text-content-secondary mb-1.5">
                {{ t('project.owner') }}
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
                    <span class="flex-1 text-sm text-content-tertiary">{{ t('project.selectOwnerOptional') }}</span>
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
                        :placeholder="t('user.searchUsers')"
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
                        {{ t('user.noUsers') }}
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
                  {{ t('project.startDate') }}
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
                  {{ t('project.endDate') }}
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
                  {{ t('project.defaultPriority') }}
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
                  {{ t('project.priorityRange') }}
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
                {{ t('project.projectEmail') }}
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
                id="enablePublicAccess"
                v-model="enablePublicAccess"
                type="checkbox"
                :disabled="isCreating"
                class="mt-0.5 w-4 h-4 rounded border-edge text-accent focus:ring-accent focus:ring-offset-0"
              />
              <div>
                <label for="enablePublicAccess" class="text-sm text-content font-medium cursor-pointer">
                  {{ t('project.enablePublicAccess') }}
                </label>
                <p class="text-xs text-content-tertiary mt-0.5">
                  {{ t('project.enablePublicAccessDescription') }}
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
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            @click="handleCreate"
            :disabled="!isValid || isCreating"
            class="btn-primary"
          >
            <ph-icon v-if="isCreating" icon="spinner" class="animate-spin -ml-1 mr-2 h-4 w-4" />
            {{ isCreating ? t('project.creating') : t('project.createProject') }}
          </button>
        </div>
      </div>

      <!-- 管理區塊 - 與專案設定頁一致的 3x2 佈局，但加上遮罩 -->
      <div class="relative">
        <!-- 遮罩層 - 專案建立前禁用 -->
        <div class="absolute inset-0 z-10 bg-surface-secondary/80 backdrop-blur-[1px] rounded-xl flex items-center justify-center">
          <div class="text-center px-6 py-8">
            <ph-icon icon="lock" class="w-12 h-12 mx-auto mb-3 text-content-tertiary" />
            <p class="text-content-secondary font-medium">{{ t('project.createProjectFirst') }}</p>
            <p class="text-sm text-content-tertiary mt-1">{{ t('project.managementAvailableAfterCreate') }}</p>
          </div>
        </div>

        <!-- 管理區塊組 1: 權限管理 | 專案角色 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <!-- 權限管理 -->
          <div class="settings-card settings-card-disabled">
            <div class="px-4 py-3 border-b border-edge">
              <h3 class="text-base font-semibold text-content">{{ t('member.members') }}</h3>
            </div>
            <div class="p-4">
              <div class="text-sm text-content-tertiary text-center py-8">
                {{ t('member.noMembers') }}
              </div>
            </div>
          </div>

          <!-- 專案角色 -->
          <div class="settings-card settings-card-disabled">
            <div class="px-4 py-3 border-b border-edge">
              <h3 class="text-base font-semibold text-content">{{ t('role.roles') }}</h3>
            </div>
            <div class="p-4">
              <div class="text-sm text-content-tertiary text-center py-8">
                {{ t('role.advancedRoles') }}
              </div>
            </div>
          </div>
        </div>

        <!-- 管理區塊組 2: 類別管理 | 標籤管理 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <!-- 類別管理 -->
          <div class="settings-card settings-card-disabled">
            <div class="px-4 py-3 border-b border-edge">
              <h3 class="text-base font-semibold text-content">{{ t('category.categories') }}</h3>
            </div>
            <div class="p-4">
              <div class="text-sm text-content-tertiary text-center py-8">
                {{ t('category.noCategories') }}
              </div>
            </div>
          </div>

          <!-- 標籤管理 -->
          <div class="settings-card settings-card-disabled">
            <div class="px-4 py-3 border-b border-edge">
              <h3 class="text-base font-semibold text-content">{{ t('tag.tags') }}</h3>
            </div>
            <div class="p-4">
              <div class="text-sm text-content-tertiary text-center py-8">
                {{ t('tag.noTags') }}
              </div>
            </div>
          </div>
        </div>

        <!-- 管理區塊組 3: 清單管理 | 分組管理 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <!-- 清單管理 -->
          <div class="settings-card settings-card-disabled">
            <div class="px-4 py-3 border-b border-edge">
              <h3 class="text-base font-semibold text-content">{{ t('column.columns') }}</h3>
            </div>
            <div class="p-4">
              <div class="text-sm text-content-tertiary text-center py-8">
                {{ t('column.noColumns') }}
              </div>
            </div>
          </div>

          <!-- 分組管理 -->
          <div class="settings-card settings-card-disabled">
            <div class="px-4 py-3 border-b border-edge">
              <h3 class="text-base font-semibold text-content">{{ t('swimlane.swimlanes') }}</h3>
            </div>
            <div class="p-4">
              <div class="text-sm text-content-tertiary text-center py-8">
                {{ t('swimlane.noSwimlanes') }}
              </div>
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

.settings-card-disabled {
  @apply opacity-60 pointer-events-none;
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
