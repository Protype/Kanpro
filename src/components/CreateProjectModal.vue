<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useProjectsStore } from '@/stores/projects'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  created: [projectId: number]
}>()

const projectsStore = useProjectsStore()

const name = ref('')
const description = ref('')
const identifier = ref('')
const isPrivate = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')

const isValid = computed(() => name.value.trim().length > 0)

watch(() => props.isOpen, (open) => {
  if (open) {
    name.value = ''
    description.value = ''
    identifier.value = ''
    isPrivate.value = false
    errorMessage.value = ''
  }
})

const handleSubmit = async () => {
  if (!isValid.value || isSubmitting.value) return

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const result = await projectsStore.createProject({
      name: name.value.trim(),
      description: description.value.trim() || undefined,
      identifier: identifier.value.trim() || undefined,
      is_private: isPrivate.value
    })

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

const handleClose = () => {
  if (!isSubmitting.value) {
    emit('close')
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 overflow-y-auto"
    >
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black/50 transition-opacity"
        @click="handleClose"
      ></div>

      <!-- Modal -->
      <div class="flex min-h-full items-center justify-center p-4">
        <div
          class="relative bg-surface rounded-lg shadow-xl w-full max-w-md border border-edge"
          @click.stop
        >
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
            <div v-if="errorMessage" class="p-3 bg-red-50 border border-red-200 rounded-md">
              <p class="text-sm text-red-600">{{ errorMessage }}</p>
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
                placeholder="例如：PROJ-001（選填）"
              />
              <p class="mt-1 text-xs text-content-tertiary">
                用於任務編號前綴，如：PROJ-123
              </p>
            </div>

            <!-- Private -->
            <div class="flex items-center gap-3">
              <input
                id="project-private"
                v-model="isPrivate"
                type="checkbox"
                :disabled="isSubmitting"
                class="w-4 h-4 rounded border-edge text-accent focus:ring-accent focus:ring-offset-0"
              />
              <label for="project-private" class="text-sm text-content">
                設為私人專案
              </label>
            </div>

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
      </div>
    </div>
  </Teleport>
</template>
