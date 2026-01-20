<script setup lang="ts">
import { computed } from 'vue'
import { iconComponents, type IconName } from '@/plugins/phosphor'

const props = withDefaults(defineProps<{
  icon: IconName | string
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone'
  size?: number | string
}>(), {
  weight: 'regular'
})

const iconComponent = computed(() => {
  const name = props.icon as IconName
  return iconComponents[name] || null
})

const computedSize = computed(() => {
  if (props.size) {
    return typeof props.size === 'number' ? props.size : parseInt(props.size)
  }
  return 20 // 預設尺寸
})
</script>

<template>
  <component
    v-if="iconComponent"
    :is="iconComponent"
    :size="computedSize"
    :weight="weight"
  />
</template>
