<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useAttachmentsStore } from '@/stores/attachments'
import type { TaskFile } from '@/types'

const props = defineProps<{
  taskId: number
  projectId: number
}>()

const emit = defineEmits<{
  updated: []
}>()

const attachmentsStore = useAttachmentsStore()

const isUploading = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const previewImage = ref<TaskFile | null>(null)

const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString('zh-TW')
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const getFileIcon = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const iconMap: Record<string, string> = {
    pdf: '📄',
    doc: '📝',
    docx: '📝',
    xls: '📊',
    xlsx: '📊',
    ppt: '📊',
    pptx: '📊',
    txt: '📃',
    zip: '📦',
    rar: '📦',
    '7z': '📦',
    png: '🖼️',
    jpg: '🖼️',
    jpeg: '🖼️',
    gif: '🖼️',
    svg: '🖼️',
    mp3: '🎵',
    mp4: '🎬',
    mov: '🎬'
  }
  return iconMap[ext] || '📎'
}

onMounted(() => {
  attachmentsStore.fetchAttachments(props.taskId)
})

watch(() => props.taskId, (newId) => {
  if (newId) {
    attachmentsStore.fetchAttachments(newId)
  }
})

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  isUploading.value = true
  try {
    // Convert file to base64
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1] // Remove data:*;base64, prefix
      await attachmentsStore.uploadAttachment(props.taskId, props.projectId, file.name, base64)
      await attachmentsStore.fetchAttachments(props.taskId)
      emit('updated')
      // Reset input
      if (fileInputRef.value) {
        fileInputRef.value.value = ''
      }
    }
    reader.readAsDataURL(file)
  } catch (error) {
    console.error('Failed to upload file:', error)
    alert('上傳檔案失敗')
  } finally {
    isUploading.value = false
  }
}

const handleDownload = async (attachment: TaskFile) => {
  try {
    const base64Data = await attachmentsStore.downloadAttachment(attachment.id)
    // Create download link
    const link = document.createElement('a')
    link.href = `data:application/octet-stream;base64,${base64Data}`
    link.download = attachment.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('Failed to download file:', error)
    alert('下載檔案失敗')
  }
}

const handleRemove = async (attachmentId: number) => {
  if (!confirm('確定要刪除此附件嗎？')) return

  try {
    await attachmentsStore.removeAttachment(attachmentId)
    await attachmentsStore.fetchAttachments(props.taskId)
    emit('updated')
  } catch (error) {
    console.error('Failed to remove attachment:', error)
    alert('刪除附件失敗')
  }
}

const openPreview = (attachment: TaskFile) => {
  if (attachment.is_image) {
    previewImage.value = attachment
  }
}

const closePreview = () => {
  previewImage.value = null
}
</script>

<template>
  <div class="space-y-3">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-medium text-gray-700">
        附件
        <span v-if="attachmentsStore.attachmentsCount > 0" class="text-gray-400">
          ({{ attachmentsStore.attachmentsCount }})
        </span>
      </h3>
      <button
        @click="triggerFileInput"
        :disabled="isUploading"
        class="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
      >
        + 上傳
      </button>
      <input
        ref="fileInputRef"
        type="file"
        class="hidden"
        @change="handleFileSelect"
      />
    </div>

    <!-- Loading -->
    <div v-if="attachmentsStore.isLoading || isUploading" class="text-center py-2">
      <ph-icon icon="spinner" class="animate-spin h-5 w-5 text-blue-600 mx-auto" />
      <p v-if="isUploading" class="text-xs text-gray-500 mt-1">上傳中...</p>
    </div>

    <!-- Attachments list -->
    <div v-else class="space-y-2">
      <div
        v-for="attachment in attachmentsStore.attachments"
        :key="attachment.id"
        class="flex items-center gap-2 p-2 bg-gray-50 rounded-lg group"
      >
        <!-- File icon / thumbnail -->
        <div
          v-if="attachment.is_image"
          @click="openPreview(attachment)"
          class="w-10 h-10 bg-gray-200 rounded flex items-center justify-center cursor-pointer hover:opacity-80"
        >
          <span class="text-lg">🖼️</span>
        </div>
        <div
          v-else
          class="w-10 h-10 bg-gray-200 rounded flex items-center justify-center"
        >
          <span class="text-lg">{{ getFileIcon(attachment.name) }}</span>
        </div>

        <!-- File info -->
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-gray-900 truncate">
            {{ attachment.name }}
          </div>
          <div class="text-xs text-gray-500">
            {{ formatFileSize(attachment.size) }} • {{ formatDate(attachment.date) }}
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            @click="handleDownload(attachment)"
            class="p-1 text-gray-400 hover:text-blue-600"
            title="下載"
          >
            <ph-icon icon="download" class="w-4 h-4" />
          </button>
          <button
            @click="handleRemove(attachment.id)"
            class="p-1 text-gray-400 hover:text-red-500"
            title="刪除"
          >
            <ph-icon icon="trash" class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="attachmentsStore.attachments.length === 0"
        class="text-center py-4 text-gray-400 text-sm"
      >
        沒有附件
      </div>
    </div>

    <!-- Image Preview Modal -->
    <Teleport to="body">
      <div
        v-if="previewImage"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
        @click="closePreview"
      >
        <div class="relative max-w-4xl max-h-[90vh] p-4">
          <button
            @click="closePreview"
            class="absolute top-2 right-2 text-white hover:text-gray-300"
          >
            <ph-icon icon="xmark" class="w-8 h-8" />
          </button>
          <div class="text-center">
            <p class="text-white mb-2">{{ previewImage.name }}</p>
            <p class="text-gray-400 text-sm">
              (圖片預覽需要實際 API 支援)
            </p>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
