<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AnswerBox from './AnswerBox.vue'

const route = useRoute()

const getRouteValue = (key: string) => {
  const possibleState = (route as unknown as { state?: Record<string, unknown> }).state
  const stateValue = possibleState?.[key]

  if (typeof stateValue === 'string' && stateValue.trim()) {
    return stateValue
  }

  const query = route.query as Record<string, unknown>
  const queryValue = query?.[key]
  if (typeof queryValue === 'string' && queryValue.trim()) {
    return queryValue
  }

  if (Array.isArray(queryValue)) {
    const first = queryValue.find((value): value is string => typeof value === 'string' && value.trim().length > 0)
    if (first) {
      return first
    }
  }

  return undefined
}

const displayName = computed(() => getRouteValue('name')?.trim() || 'Guest')

const initialsText = computed(() => {
  const fromState = getRouteValue('initials')?.trim()
  if (fromState) {
    return fromState.toUpperCase()
  }

  const parts = displayName.value.split(' ').filter(Boolean)
  if (!parts.length) {
    return 'G'
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
})

const avatarBackgroundClass = computed(() => getRouteValue('avatarClass') || 'bg-blue-600')

const avatarInlineStyle = computed(() => {
  const explicitStyle = getRouteValue('avatarStyle')
  if (explicitStyle) {
    return explicitStyle
  }

  const avatarColor = getRouteValue('avatarColor')
  if (avatarColor) {
    return { backgroundColor: avatarColor }
  }

  return {}
})

const handleBoxSelection = (boxNumber: number) => {
  console.log(`Box ${boxNumber} selected`)
}
</script>

<template>
  <div class="min-h-screen bg-[#242424] flex flex-col items-center justify-center p-8 relative">
    <div class="absolute top-4 right-4 flex items-center gap-3 text-white/90">
      <div
        class="w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold text-white shadow-lg"
        :class="avatarBackgroundClass"
        :style="avatarInlineStyle"
      >
        {{ initialsText }}
      </div>
      <span class="text-lg font-medium">{{ displayName }}</span>
    </div>

    <div class="grid grid-cols-4 gap-x-16 gap-y-8 max-w-4xl">
      <!-- Row 1 -->
      <div class="flex flex-col items-center gap-4">
        <button @click="handleBoxSelection(1)"
          class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          Click to pick this spot
        </button>
        <AnswerBox :onPress="() => { }" :rotate=180 />
      </div>

      <!-- Row 2 -->
      <div class="flex flex-col items-center gap-4">
        <button @click="handleBoxSelection(1)"
          class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          Click to pick this spot
        </button>
        <AnswerBox :onPress="() => { }" :rotate=180 />
      </div>


      <div class="flex flex-col items-center gap-4">
        <button @click="handleBoxSelection(1)"
          class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          Click to pick this spot
        </button>
        <AnswerBox :onPress="() => { }" :rotate=180 />
      </div>

      <div class="flex flex-col items-center gap-4">
        <button @click="handleBoxSelection(1)"
          class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          Click to pick this spot
        </button>
        <AnswerBox :onPress="() => { }" :rotate=180 />
      </div>

    </div>
    <!-- Center Text -->
    <div class="col-span-2 flex items-center justify-center py-8">
      <p class="text-xl text-white/90 text-center">
        Click a button to select your answer box position
      </p>
    </div>

    <div class="grid grid-cols-4 gap-x-16 gap-y-8 max-w-4xl">
      <!-- Row 3 -->
      <div class="flex flex-col items-center gap-4">
        <AnswerBox :onPress="() => { }" />
        <button @click="handleBoxSelection(5)"
          class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          Click to pick this spot
        </button>
      </div>

      <div class="flex flex-col items-center gap-4">
        <AnswerBox :onPress="() => { }" />
        <button @click="handleBoxSelection(6)"
          class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          Click to pick this spot
        </button>
      </div>

      <!-- Row 4 -->
      <div class="flex flex-col items-center gap-4">
        <AnswerBox :onPress="() => { }" />
        <button @click="handleBoxSelection(7)"
          class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          Click to pick this spot
        </button>
      </div>

      <div class="flex flex-col items-center gap-4">
        <AnswerBox :onPress="() => { }" />
        <button @click="handleBoxSelection(8)"
          class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          Click to pick this spot
        </button>
      </div>
    </div>
  </div>
</template>
