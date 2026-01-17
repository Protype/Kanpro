<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useProjectsStore, type CreateProjectOptions } from '@/stores/projects'
import { useUsersStore } from '@/stores/users'
import { useAuthStore } from '@/stores/auth'
import type { User } from '@/types'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  created: [projectId: number]
}>()

const projectsStore = useProjectsStore()
const usersStore = useUsersStore()
const authStore = useAuthStore()

// === 主區域欄位 ===
const name = ref('')
const description = ref('')
const identifier = ref('')

// === 進階設定欄位 ===
const ownerId = ref<number | null>(null)
const startDate = ref('')
const endDate = ref('')
const priorityDefault = ref<number | undefined>(undefined)
const priorityStart = ref<number | undefined>(undefined)
const priorityEnd = ref<number | undefined>(undefined)
const projectEmail = ref('')
const disablePublicAccess = ref(false)

// === UI 狀態 ===
const isSubmitting = ref(false)
const errorMessage = ref('')
const showAdvanced = ref(false)
const ownerSearchQuery = ref('')
const showOwnerDropdown = ref(false)

// === Computed ===
const isValid = computed(() => name.value.trim().length > 0)

const currentUser = computed(() => authStore.user)

const filteredUsers = computed(() => {
  const query = ownerSearchQuery.value.toLowerCase()
  if (!query) return usersStore.activeUsers
  return usersStore.activeUsers.filter(u =>
    u.username.toLowerCase().includes(query) ||
    (u.name?.toLowerCase().includes(query) ?? false)
  )
})

const selectedOwner = computed(() => {
  if (!ownerId.value) return currentUser.value
  return usersStore.users.find(u => u.id === ownerId.value) || currentUser.value
})

// === Watch ===
watch(() => props.isOpen, (open) => {
  if (open) {
    resetForm()
    // 載入使用者列表用於擁有者選擇
    if (usersStore.users.length === 0) {
      usersStore.fetchAllUsers()
    }
  }
})

// === Functions ===
function resetForm() {
  name.value = ''
  description.value = ''
  identifier.value = ''
  ownerId.value = null
  startDate.value = ''
  endDate.value = ''
  priorityDefault.value = undefined
  priorityStart.value = undefined
  priorityEnd.value = undefined
  projectEmail.value = ''
  disablePublicAccess.value = false
  errorMessage.value = ''
  showAdvanced.value = false
  ownerSearchQuery.value = ''
  showOwnerDropdown.value = false
}

function toggleAdvanced() {
  showAdvanced.value = !showAdvanced.value
}

function selectOwner(user: User) {
  ownerId.value = user.id
  ownerSearchQuery.value = ''
  showOwnerDropdown.value = false
}

async function handleSubmit() {
  if (!isValid.value || isSubmitting.value) return

  isSubmitting.value = true
  errorMessage.value = ''

  const options: CreateProjectOptions = {
    name: name.value.trim(),
    description: description.value.trim() || undefined,
    identifier: identifier.value.trim() || undefined,
    owner_id: ownerId.value || undefined,
    start_date: startDate.value || undefined,
    end_date: endDate.value || undefined,
    priority_default: priorityDefault.value,
    priority_start: priorityStart.value,
    priority_end: priorityEnd.value,
    email: projectEmail.value.trim() || undefined,
    disablePublicAccess: disablePublicAccess.value
  }

  try {
    const result = await projectsStore.createProject(options)

    if (result !== false) {
      emit('created', result)
      emit('close')
    } else {
      errorMessage.value = projectsStore.error || '建立專案失敗'
    }
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '建立專案失敗'
  } finally {
    isSubmitting.value = false
  }
}

function handleClose() {
  if (!isSubmitting.value) {
    emit('close')
  }
}

function handleBackdropClick(event: MouseEvent) {
  // 點擊背景時，如果進階面板開啟則只關閉進階面板
  if (showAdvanced.value) {
    showAdvanced.value = false
    event.stopPropagation()
  } else {
    handleClose()
  }
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
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 overflow-y-auto"
      >
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-black/50 transition-opacity"
          @click="handleBackdropClick"
        ></div>

        <!-- Modal Container -->
        <div class="flex min-h-full items-center justify-center p-4">
          <div
            class="relative bg-surface rounded-lg shadow-xl border border-edge transition-all duration-300 ease-out flex"
            :class="showAdvanced ? 'w-full max-w-3xl' : 'w-full max-w-md'"
            @click.stop
          >
            <!-- Main Content Area -->
            <div class="flex-1 min-w-0">
              <!-- Header -->
              <div class="flex items-center justify-between p-4 border-b border-edge">
                <h3 class="text-lg font-semibold text-content">新增專案</h3>
                <button
                  @click="handleClose"
                  class="text-content-tertiary hover:text-content-secondary transition-colors"
                  :disabled="isSubmitting"
                >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <!-- Form -->
              <form @submit.prevent="handleSubmit" class="p-4 space-y-4">
                <!-- Error Message -->
                <div v-if="errorMessage" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p class="text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</p>
                </div>

                <!-- Name -->
                <div>
                  <label for="project-name" class="block text-sm font-medium text-content mb-1">
                    專案名稱 <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="project-name"
                    v-model="name"
                    type="text"
                    required
                    :disabled="isSubmitting"
                    class="w-full px-3 py-2 bg-surface-secondary border border-edge rounded-md text-content placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-50"
                    placeholder="輸入專案名稱"
                  />
                </div>

                <!-- Description -->
                <div>
                  <label for="project-description" class="block text-sm font-medium text-content mb-1">
                    描述
                  </label>
                  <textarea
                    id="project-description"
                    v-model="description"
                    rows="3"
                    :disabled="isSubmitting"
                    class="w-full px-3 py-2 bg-surface-secondary border border-edge rounded-md text-content placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-50 resize-none"
                    placeholder="輸入專案描述（選填）"
                  ></textarea>
                </div>

                <!-- Identifier -->
                <div>
                  <label for="project-identifier" class="block text-sm font-medium text-content mb-1">
                    專案識別碼
                  </label>
                  <input
                    id="project-identifier"
                    v-model="identifier"
                    type="text"
                    :disabled="isSubmitting"
                    class="w-full px-3 py-2 bg-surface-secondary border border-edge rounded-md text-content placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-50"
                    placeholder="例如：PROJ（選填）"
                  />
                  <p class="mt-1 text-xs text-content-tertiary">
                    用於任務編號前綴，如：PROJ-123
                  </p>
                </div>

                <!-- Advanced Settings Toggle -->
                <button
                  type="button"
                  @click="toggleAdvanced"
                  class="flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors"
                >
                  <svg
                    class="w-4 h-4 transition-transform duration-200"
                    :class="showAdvanced ? 'rotate-90' : ''"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                  進階設定
                </button>

                <!-- Actions -->
                <div class="flex justify-end gap-3 pt-4 border-t border-edge">
                  <button
                    type="button"
                    @click="handleClose"
                    :disabled="isSubmitting"
                    class="px-4 py-2 text-sm font-medium text-content bg-surface-secondary hover:bg-surface-hover rounded-md transition-colors disabled:opacity-50"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    :disabled="!isValid || isSubmitting"
                    class="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent/90 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <svg v-if="isSubmitting" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {{ isSubmitting ? '建立中...' : '建立專案' }}
                  </button>
                </div>
              </form>
            </div>

            <!-- Advanced Settings Panel -->
            <Transition name="slide">
              <div
                v-if="showAdvanced"
                class="w-72 border-l border-edge bg-surface-secondary/50 flex flex-col"
              >
                <!-- Panel Header -->
                <div class="flex items-center justify-between p-4 border-b border-edge">
                  <h4 class="text-sm font-semibold text-content">進階設定</h4>
                  <button
                    @click="showAdvanced = false"
                    class="text-content-tertiary hover:text-content-secondary transition-colors"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </div>

                <!-- Panel Content -->
                <div class="flex-1 overflow-y-auto p-4 space-y-4">
                  <!-- Owner -->
                  <div class="owner-dropdown-container">
                    <label class="block text-sm font-medium text-content mb-1">
                      擁有者
                    </label>
                    <div class="relative">
                      <button
                        type="button"
                        @click="showOwnerDropdown = !showOwnerDropdown"
                        class="w-full px-3 py-2 bg-surface border border-edge rounded-md text-left flex items-center gap-2 hover:bg-surface-hover transition-colors"
                        :disabled="isSubmitting"
                      >
                        <div class="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs text-accent font-medium">
                          {{ selectedOwner?.name?.[0] || selectedOwner?.username?.[0] || '?' }}
                        </div>
                        <span class="flex-1 truncate text-sm text-content">
                          {{ selectedOwner?.name || selectedOwner?.username || '選擇擁有者' }}
                        </span>
                        <svg class="w-4 h-4 text-content-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
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
                              <div class="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs text-accent font-medium">
                                {{ user.name?.[0] || user.username[0] }}
                              </div>
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
                    <p class="mt-1 text-xs text-content-tertiary">
                      預設為當前使用者
                    </p>
                  </div>

                  <!-- Start Date -->
                  <div>
                    <label for="project-start-date" class="block text-sm font-medium text-content mb-1">
                      開始日期
                    </label>
                    <input
                      id="project-start-date"
                      v-model="startDate"
                      type="date"
                      :disabled="isSubmitting"
                      class="w-full px-3 py-2 bg-surface border border-edge rounded-md text-content focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-50"
                    />
                  </div>

                  <!-- End Date -->
                  <div>
                    <label for="project-end-date" class="block text-sm font-medium text-content mb-1">
                      結束日期
                    </label>
                    <input
                      id="project-end-date"
                      v-model="endDate"
                      type="date"
                      :disabled="isSubmitting"
                      :min="startDate"
                      class="w-full px-3 py-2 bg-surface border border-edge rounded-md text-content focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-50"
                    />
                  </div>

                  <!-- Priority Settings -->
                  <div>
                    <label class="block text-sm font-medium text-content mb-2">
                      優先級設定
                    </label>
                    <div class="space-y-2">
                      <div>
                        <label class="block text-xs text-content-secondary mb-1">預設優先級</label>
                        <input
                          v-model.number="priorityDefault"
                          type="number"
                          min="0"
                          :disabled="isSubmitting"
                          placeholder="0"
                          class="w-full px-3 py-1.5 text-sm bg-surface border border-edge rounded-md text-content placeholder:text-content-tertiary focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
                        />
                      </div>
                      <div class="grid grid-cols-2 gap-2">
                        <div>
                          <label class="block text-xs text-content-secondary mb-1">最小值</label>
                          <input
                            v-model.number="priorityStart"
                            type="number"
                            min="0"
                            :disabled="isSubmitting"
                            placeholder="0"
                            class="w-full px-3 py-1.5 text-sm bg-surface border border-edge rounded-md text-content placeholder:text-content-tertiary focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label class="block text-xs text-content-secondary mb-1">最大值</label>
                          <input
                            v-model.number="priorityEnd"
                            type="number"
                            min="0"
                            :disabled="isSubmitting"
                            placeholder="3"
                            class="w-full px-3 py-1.5 text-sm bg-surface border border-edge rounded-md text-content placeholder:text-content-tertiary focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Project Email -->
                  <div>
                    <label for="project-email" class="block text-sm font-medium text-content mb-1">
                      專案通知 Email
                    </label>
                    <input
                      id="project-email"
                      v-model="projectEmail"
                      type="email"
                      :disabled="isSubmitting"
                      placeholder="project@example.com"
                      class="w-full px-3 py-2 bg-surface border border-edge rounded-md text-content placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-50"
                    />
                  </div>

                  <!-- Disable Public Access -->
                  <div class="flex items-start gap-3 pt-2 border-t border-edge">
                    <input
                      id="disable-public-access"
                      v-model="disablePublicAccess"
                      type="checkbox"
                      :disabled="isSubmitting"
                      class="mt-0.5 w-4 h-4 rounded border-edge text-accent focus:ring-accent focus:ring-offset-0"
                    />
                    <div>
                      <label for="disable-public-access" class="text-sm text-content font-medium cursor-pointer">
                        限制公開存取
                      </label>
                      <p class="text-xs text-content-tertiary mt-0.5">
                        建立後將自動關閉公開存取功能
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Modal Transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* Slide Transition for Advanced Panel */
.slide-enter-active {
  transition: all 0.3s ease-out;
}

.slide-leave-active {
  transition: all 0.2s ease-in;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(1rem);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(1rem);
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
