<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useProjectsStore, type CreateProjectOptions } from '@/stores/projects'
import { useUsersStore } from '@/stores/users'
import { useAuthStore } from '@/stores/auth'
import { useProjectDraftStore } from '@/stores/projectDraft'
import UserAvatar from '@/components/UserAvatar.vue'
import type { User } from '@/types'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  created: [projectId: number]
}>()

const router = useRouter()
const { t } = useI18n()
const projectsStore = useProjectsStore()
const usersStore = useUsersStore()
const authStore = useAuthStore()
const projectDraftStore = useProjectDraftStore()

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
const enablePublicAccess = ref(false)

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
  enablePublicAccess.value = false
  errorMessage.value = ''
  showAdvanced.value = false
  ownerSearchQuery.value = ''
  showOwnerDropdown.value = false
}

function toggleAdvanced() {
  showAdvanced.value = !showAdvanced.value
}

function handleExpand() {
  // 儲存目前填寫的資料到 draft store
  projectDraftStore.updateDraft({
    name: name.value,
    description: description.value,
    identifier: identifier.value,
    ownerId: ownerId.value,
    startDate: startDate.value,
    endDate: endDate.value,
    priorityDefault: priorityDefault.value,
    priorityStart: priorityStart.value,
    priorityEnd: priorityEnd.value,
    email: projectEmail.value,
    enablePublicAccess: enablePublicAccess.value
  })

  // 關閉燈箱並導向專案建立頁
  emit('close')
  router.push('/projects/new')
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
    enablePublicAccess: enablePublicAccess.value
  }

  try {
    const result = await projectsStore.createProject(options)

    if (result !== false) {
      emit('created', result)
      emit('close')
    } else {
      errorMessage.value = projectsStore.error || t('project.createFailed')
    }
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : t('project.createFailed')
  } finally {
    isSubmitting.value = false
  }
}

function handleClose() {
  if (!isSubmitting.value) {
    emit('close')
  }
}

function handleBackdropClick() {
  handleClose()
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
          <!-- Modal -->
          <form
            @submit.prevent="handleSubmit"
            class="relative bg-surface rounded-lg shadow-xl border border-edge flex flex-col modal-transition overflow-hidden"
            :style="{
              width: showAdvanced ? '720px' : '448px',
              height: showAdvanced ? '540px' : '480px',
              maxWidth: '90vw'
            }"
            @click.stop
          >
            <!-- Header -->
            <div class="flex items-center justify-between p-4 h-14 border-b border-edge">
              <div class="flex items-center gap-3">
                <h3 class="text-lg font-semibold text-content">{{ t('project.newProject') }}</h3>
                <!-- Button Group: Advanced + Expand -->
                <div class="flex items-center gap-0 rounded-md bg-surface-secondary px-1 py-0.5">
                  <!-- Advanced Settings Toggle -->
                  <button
                    type="button"
                    @click="toggleAdvanced"
                    class="flex items-center gap-1 ps-2 pe-1 py-1 text-xs font-medium leading-none rounded transition-colors"
                    :class="showAdvanced
                      ? 'bg-surface-tertiary text-content-secondary'
                      : 'text-content-tertiary hover:text-content-secondary hover:bg-surface-tertiary'"
                  >
                    <span>{{ t('project.advancedSettings') }}</span>
                    <ph-icon :icon="showAdvanced ? 'chevron-left' : 'chevron-right'" class="w-3.5 h-3.5" />
                  </button>
                  <!-- Expand to full page button -->
                  <button
                    type="button"
                    data-testid="expand-button"
                    @click="handleExpand"
                    class="flex items-center justify-center p-1 rounded transition-colors text-content-tertiary hover:text-content-secondary hover:bg-surface-tertiary"
                    :title="t('project.expandToFullPage')"
                  >
                    <ph-icon icon="arrows-out" class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <button
                type="button"
                @click="handleClose"
                class="text-content-tertiary hover:text-content-secondary transition-colors"
                :disabled="isSubmitting"
              >
                <ph-icon icon="xmark" class="w-5 h-5" />
              </button>
            </div>

              <!-- Content Area -->
              <div class="flex flex-1 min-h-0">
                <!-- Main Content -->
                <div class="flex-1 p-4 space-y-4 overflow-y-auto">
                  <!-- Error Message -->
                  <div v-if="errorMessage" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <p class="text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</p>
                  </div>

                  <!-- Name -->
                  <div>
                    <label for="project-name" class="block text-sm font-medium text-content mb-1">
                      {{ t('project.projectName') }} <span class="text-red-500">*</span>
                    </label>
                    <input
                      id="project-name"
                      v-model="name"
                      type="text"
                      required
                      :disabled="isSubmitting"
                      class="w-full px-3 py-2 bg-surface-secondary border border-edge rounded-md text-content placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-50"
                      :placeholder="t('project.enterProjectName')"
                    />
                  </div>

                  <!-- Description -->
                  <div>
                    <label for="project-description" class="block text-sm font-medium text-content mb-1">
                      {{ t('common.description') }}
                    </label>
                    <textarea
                      id="project-description"
                      v-model="description"
                      rows="3"
                      :disabled="isSubmitting"
                      class="w-full px-3 py-2 bg-surface-secondary border border-edge rounded-md text-content placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-50 resize-none"
                      :placeholder="t('project.enterDescription')"
                    ></textarea>
                  </div>

                  <!-- Identifier -->
                  <div>
                    <label for="project-identifier" class="block text-sm font-medium text-content mb-1">
                      {{ t('project.identifier') }}
                    </label>
                    <input
                      id="project-identifier"
                      v-model="identifier"
                      type="text"
                      :disabled="isSubmitting"
                      class="w-full px-3 py-2 bg-surface-secondary border border-edge rounded-md text-content placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-50"
                      :placeholder="t('project.identifierPlaceholder')"
                    />
                    <p class="mt-1 text-xs text-content-tertiary">
                      {{ t('project.identifierHint') }}
                    </p>
                  </div>
                </div>

                <!-- Advanced Settings Panel -->
                <Transition name="slide">
                  <div
                    v-if="showAdvanced"
                    class="w-80 border-l border-edge bg-surface-secondary/50 overflow-y-auto"
                  >
                    <!-- Two Column Grid for Advanced Settings -->
                    <div class="p-4 grid grid-cols-2 gap-x-3 gap-y-4">
                      <!-- Owner (full width) -->
                      <div class="col-span-2 owner-dropdown-container">
                        <label class="block text-sm font-medium text-content mb-1">
                          {{ t('project.owner') }}
                        </label>
                        <div class="relative">
                          <button
                            type="button"
                            @click="showOwnerDropdown = !showOwnerDropdown"
                            class="w-full px-3 py-2 bg-surface border border-edge rounded-md text-left flex items-center gap-2 hover:bg-surface-hover transition-colors"
                            :disabled="isSubmitting"
                          >
                            <UserAvatar :user="selectedOwner" size="sm" />
                            <span class="flex-1 truncate text-sm text-content">
                              {{ selectedOwner?.name || selectedOwner?.username || t('project.selectOwner') }}
                            </span>
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
                                  :placeholder="t('user.searchUsers')"
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
                                  {{ t('project.noUserFound') }}
                                </div>
                              </div>
                            </div>
                          </Transition>
                        </div>
                        <p class="mt-1 text-xs text-content-tertiary">
                          {{ t('project.defaultIsCurrentUser') }}
                        </p>
                      </div>

                      <!-- Start Date -->
                      <div>
                        <label for="project-start-date" class="block text-sm font-medium text-content mb-1">
                          {{ t('project.startDate') }}
                        </label>
                        <input
                          id="project-start-date"
                          v-model="startDate"
                          type="date"
                          :disabled="isSubmitting"
                          class="w-full px-2 py-1.5 text-sm bg-surface border border-edge rounded-md text-content focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-50"
                        />
                      </div>

                      <!-- End Date -->
                      <div>
                        <label for="project-end-date" class="block text-sm font-medium text-content mb-1">
                          {{ t('project.endDate') }}
                        </label>
                        <input
                          id="project-end-date"
                          v-model="endDate"
                          type="date"
                          :disabled="isSubmitting"
                          :min="startDate"
                          class="w-full px-2 py-1.5 text-sm bg-surface border border-edge rounded-md text-content focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-50"
                        />
                      </div>

                      <!-- Priority Default -->
                      <div>
                        <label class="block text-sm font-medium text-content mb-1">{{ t('project.defaultPriority') }}</label>
                        <input
                          v-model.number="priorityDefault"
                          type="number"
                          min="0"
                          :disabled="isSubmitting"
                          placeholder="0"
                          class="w-full px-2 py-1.5 text-sm bg-surface border border-edge rounded-md text-content placeholder:text-content-tertiary focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
                        />
                      </div>

                      <!-- Priority Range -->
                      <div>
                        <label class="block text-sm font-medium text-content mb-1">{{ t('project.priorityRange') }}</label>
                        <div class="flex items-center gap-1">
                          <input
                            v-model.number="priorityStart"
                            type="number"
                            min="0"
                            :disabled="isSubmitting"
                            placeholder="0"
                            class="w-full px-2 py-1.5 text-sm bg-surface border border-edge rounded-md text-content placeholder:text-content-tertiary focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
                          />
                          <span class="text-content-tertiary">~</span>
                          <input
                            v-model.number="priorityEnd"
                            type="number"
                            min="0"
                            :disabled="isSubmitting"
                            placeholder="3"
                            class="w-full px-2 py-1.5 text-sm bg-surface border border-edge rounded-md text-content placeholder:text-content-tertiary focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
                          />
                        </div>
                      </div>

                      <!-- Project Email (full width) -->
                      <div class="col-span-2">
                        <label for="project-email" class="block text-sm font-medium text-content mb-1">
                          {{ t('project.projectEmail') }}
                        </label>
                        <input
                          id="project-email"
                          v-model="projectEmail"
                          type="email"
                          :disabled="isSubmitting"
                          placeholder="project@example.com"
                          class="w-full px-2 py-1.5 text-sm bg-surface border border-edge rounded-md text-content placeholder:text-content-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:opacity-50"
                        />
                      </div>

                      <!-- Enable Public Access (full width) -->
                      <div class="col-span-2 flex items-start gap-3 pt-2 border-t border-edge">
                        <input
                          id="enable-public-access"
                          v-model="enablePublicAccess"
                          type="checkbox"
                          :disabled="isSubmitting"
                          class="mt-0.5 w-4 h-4 rounded border-edge text-accent focus:ring-accent focus:ring-offset-0"
                        />
                        <div>
                          <label for="enable-public-access" class="text-sm text-content font-medium cursor-pointer">
                            {{ t('project.enablePublicAccess') }}
                          </label>
                          <p class="text-xs text-content-tertiary mt-0.5">
                            {{ t('project.enablePublicAccessDescription') }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Transition>
              </div>

              <!-- Footer (spans full width) -->
              <div class="flex justify-end gap-3 p-4 border-t border-edge">
                <button
                  type="button"
                  @click="handleClose"
                  :disabled="isSubmitting"
                  class="px-4 py-2 text-sm font-medium text-content bg-surface-secondary hover:bg-surface-hover rounded-md transition-colors disabled:opacity-50"
                >
                  {{ t('common.cancel') }}
                </button>
                <button
                  type="submit"
                  :disabled="!isValid || isSubmitting"
                  class="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent/90 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <ph-icon v-if="isSubmitting" icon="spinner" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                  {{ isSubmitting ? t('project.creating') : t('project.createProject') }}
                </button>
              </div>
            </form>
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

/* Modal Size Transition - width and height animate simultaneously */
.modal-transition {
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
