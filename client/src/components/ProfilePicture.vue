<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  name: string
  size?: 'sm' | 'md' | 'lg'
}>()

// Extract initials from name (up to 2 characters)
const initials = computed(() => {
  const nameParts = props.name.trim().split(' ').filter(part => part.length > 0)
  if (nameParts.length === 0) return '?'
  if (nameParts.length === 1) {
    const firstPart = nameParts[0]
    return firstPart ? firstPart.substring(0, 2).toUpperCase() : '?'
  }
  const firstPart = nameParts[0]
  const lastPart = nameParts[nameParts.length - 1]
  if (!firstPart || !lastPart || !firstPart[0] || !lastPart[0]) return '?'
  return (firstPart[0] + lastPart[0]).toUpperCase()
})

// Generate a consistent color based on the name
const backgroundColor = computed(() => {
  const colors = [
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#f97316', // orange
    '#10b981', // green
    '#06b6d4', // cyan
    '#6366f1', // indigo
    '#f59e0b', // amber
    '#14b8a6', // teal
    '#a855f7', // purple
  ]

  // Use name to generate a consistent index
  let hash = 0
  for (let i = 0; i < props.name.length; i++) {
    hash = props.name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % colors.length
  return colors[index]
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'w-8 h-8 text-sm'
    case 'lg':
      return 'w-16 h-16 text-2xl'
    case 'md':
    default:
      return 'w-12 h-12 text-lg'
  }
})
</script>

<template>
  <div
    :class="sizeClasses"
    :style="{ backgroundColor }"
    class="rounded-full flex items-center justify-center font-bold text-white shadow-lg ring-2 ring-white/20"
  >
    {{ initials }}
  </div>
</template>
