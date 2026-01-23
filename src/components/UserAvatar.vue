<script setup lang="ts">
import { computed } from 'vue'
import { getAvatarColor, getAvatarInitial, getUserDisplayName } from '@/utils/avatar'

interface User {
  name?: string | null
  username?: string
}

const props = withDefaults(defineProps<{
  /** 使用者物件，需有 name 或 username */
  user?: User | null
  /** 直接傳入名稱（優先於 user） */
  name?: string | null
  /** 頭像圖片 URL 或 Base64 資料 */
  imageUrl?: string | null
  /** 頭像大小：'xs' | 'sm' | 'md' | 'lg' | 'xl' */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}>(), {
  size: 'md'
})

const displayName = computed(() => {
  if (props.name) return props.name
  return getUserDisplayName(props.user)
})

const initial = computed(() => getAvatarInitial(displayName.value))
const bgColor = computed(() => getAvatarColor(displayName.value))

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'xs': return 'w-5 h-5 text-[10px]'
    case 'sm': return 'w-6 h-6 text-xs'
    case 'md': return 'w-8 h-8 text-sm'
    case 'lg': return 'w-10 h-10 text-base'
    case 'xl': return 'w-12 h-12 text-lg'
    default: return 'w-8 h-8 text-sm'
  }
})
</script>

<template>
  <img
    v-if="imageUrl"
    :src="imageUrl.startsWith('data:') ? imageUrl : `data:image/png;base64,${imageUrl}`"
    :alt="displayName"
    class="rounded-full object-cover"
    :class="sizeClasses"
  />
  <div
    v-else
    class="rounded-full text-white flex items-center justify-center font-medium"
    :class="sizeClasses"
    :style="{ backgroundColor: bgColor }"
  >
    {{ initial }}
  </div>
</template>
