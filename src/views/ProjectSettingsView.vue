<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProjectsStore } from '@/stores/projects'
import NotificationsDropdown from '@/components/NotificationsDropdown.vue'
import MembersList from '@/components/MembersList.vue'
import ColumnsList from '@/components/ColumnsList.vue'
import SwimlanesList from '@/components/SwimlanesList.vue'
import CategoriesList from '@/components/CategoriesList.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const projectsStore = useProjectsStore()

const projectId = computed(() => Number(route.params.id))

// Form state
const projectName = ref('')
const projectDescription = ref('')
const isLoading = ref(false)
const isSaving = ref(false)
const showDeleteConfirm = ref(false)
const isDeleting = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

// Load project data
onMounted(async () => {
  isLoading.value = true
  try {
    await projectsStore.fetchProjects()
    const project = projectsStore.getProjectById(projectId.value)
    if (project) {
      projectName.value = project.name
      projectDescription.value = project.description || ''
    } else {
      error.value = '找不到專案'
    }
  } catch (err) {
    error.value = '載入專案失敗'
  } finally {
    isLoading.value = false
  }
})

const currentProject = computed(() => projectsStore.getProjectById(projectId.value))

const handleSave = async () => {
  if (!projectName.value.trim()) {
    error.value = '專案名稱不能為空'
    return
  }

  isSaving.value = true
  error.value = null
  successMessage.value = null

  try {
    await projectsStore.updateProject(projectId.value, {
      name: projectName.value.trim(),
      description: projectDescription.value.trim()
    })
    successMessage.value = '專案設定已儲存'
    await projectsStore.fetchProjects()
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '儲存失敗'
  } finally {
    isSaving.value = false
  }
}

const handleDelete = async () => {
  isDeleting.value = true
  error.value = null

  try {
    await projectsStore.removeProject(projectId.value)
    router.push('/')
  } catch (err) {
    error.value = err instanceof Error ? err.message : '刪除失敗'
    showDeleteConfirm.value = false
  } finally {
    isDeleting.value = false
  }
}

const goBack = () => {
  router.push(`/projects/${projectId.value}`)
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Header -->
    <header class="bg-white shadow">
      <div class="mx-auto max-w-7xl px-4 py-4 flex justify-between items-center">
        <div class="flex items-center gap-4">
          <button
            @click="goBack"
            class="text-gray-600 hover:text-gray-900"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 class="text-xl font-bold text-gray-900">專案設定</h1>
        </div>
        <div class="flex items-center gap-4">
          <NotificationsDropdown />
          <span class="text-gray-600 text-sm">
            {{ authStore.user?.name || authStore.user?.username }}
          </span>
          <button
            @click="handleLogout"
            class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            登出
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-2xl px-4 py-6">
      <!-- Loading -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <svg class="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <template v-else>
        <!-- Error Alert -->
        <div v-if="error" class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="flex items-center gap-2 text-red-800">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{{ error }}</span>
          </div>
        </div>

        <!-- Success Alert -->
        <div v-if="successMessage" class="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div class="flex items-center gap-2 text-green-800">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{{ successMessage }}</span>
          </div>
        </div>

        <!-- Settings Form -->
        <div class="bg-white rounded-lg shadow">
          <!-- Basic Info Section -->
          <div class="p-6 border-b">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">基本資訊</h2>

            <div class="space-y-4">
              <!-- Project Name -->
              <div>
                <label for="projectName" class="block text-sm font-medium text-gray-700 mb-1">
                  專案名稱 <span class="text-red-500">*</span>
                </label>
                <input
                  id="projectName"
                  v-model="projectName"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="輸入專案名稱"
                  :disabled="isSaving"
                />
              </div>

              <!-- Project Description -->
              <div>
                <label for="projectDescription" class="block text-sm font-medium text-gray-700 mb-1">
                  專案描述
                </label>
                <textarea
                  id="projectDescription"
                  v-model="projectDescription"
                  rows="4"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="輸入專案描述（選填）"
                  :disabled="isSaving"
                ></textarea>
              </div>
            </div>

            <!-- Save Button -->
            <div class="mt-6">
              <button
                @click="handleSave"
                :disabled="isSaving"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="isSaving">儲存中...</span>
                <span v-else>儲存變更</span>
              </button>
            </div>
          </div>

          <!-- Members Section -->
          <div class="p-6 border-b">
            <MembersList :project-id="projectId" />
          </div>

          <!-- Columns Section -->
          <div class="p-6 border-b">
            <ColumnsList :project-id="projectId" />
          </div>

          <!-- Swimlanes Section -->
          <div class="p-6 border-b">
            <SwimlanesList :project-id="projectId" />
          </div>

          <!-- Categories Section -->
          <div class="p-6 border-b">
            <CategoriesList :project-id="projectId" />
          </div>

          <!-- Danger Zone -->
          <div class="p-6">
            <h2 class="text-lg font-semibold text-red-600 mb-4">危險區域</h2>

            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-medium text-red-800">刪除專案</h3>
                  <p class="text-sm text-red-600 mt-1">
                    刪除後無法恢復，專案中的所有任務和資料將被永久刪除。
                  </p>
                </div>
                <button
                  @click="showDeleteConfirm = true"
                  :disabled="isDeleting"
                  class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  刪除專案
                </button>
              </div>
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
          <div class="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">確認刪除專案</h3>
            <p class="text-gray-600 mb-4">
              您確定要刪除「{{ currentProject?.name }}」嗎？此操作無法復原。
            </p>

            <div class="flex justify-end gap-3">
              <button
                @click="showDeleteConfirm = false"
                :disabled="isDeleting"
                class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
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
  </div>
</template>
