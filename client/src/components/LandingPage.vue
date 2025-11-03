<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

type AvatarStyle = {
  color: string
  shape: string
}

const name = ref('')
const router = useRouter()

const isNameValid = computed(() => name.value.trim().length > 0)

const DEFAULT_AVATAR: AvatarStyle = { color: '#4f46e5', shape: 'circle' }

const avatarStyles: AvatarStyle[] = [
  DEFAULT_AVATAR,
  { color: '#0ea5e9', shape: 'square' },
  { color: '#f97316', shape: 'rounded' },
  { color: '#22c55e', shape: 'triangle' },
  { color: '#9333ea', shape: 'hexagon' },
]

const deriveInitials = (input: string) => {
  const words = input
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (words.length === 0) {
    return ''
  }

  const initials = words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('')

  if (initials) {
    return initials
  }

  const [firstWord = ''] = words
  return firstWord.charAt(0).toUpperCase()
}

const getRandomAvatar = (): AvatarStyle => {
  if (avatarStyles.length === 0) {
    return DEFAULT_AVATAR
  }

  const index = Math.floor(Math.random() * avatarStyles.length)
  const style = avatarStyles[index]

  if (!style) {
    return DEFAULT_AVATAR
  }

  return style
}

const handleSubmit = () => {
  if (!isNameValid.value) {
    return
  }

  const trimmedName = name.value.trim()
  const initials = deriveInitials(trimmedName)
  const randomAvatar = getRandomAvatar()

  router.push({
    name: 'answer-selection',
    state: {
      name: trimmedName,
      initials,
      avatarColor: randomAvatar.color,
      avatarShape: randomAvatar.shape,
    },
  })
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-[#111827] text-white px-4">
    <div class="max-w-md w-full bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-lg">
      <h1 class="text-3xl font-bold text-center mb-6">Welcome to the HOSA Buzzer System</h1>
      <p class="text-center text-white/80 mb-8">
        Enter your name to get started. We'll generate a custom avatar for you.
      </p>
      <form @submit.prevent="handleSubmit" class="flex flex-col gap-4">
        <label class="flex flex-col gap-2">
          <span class="text-sm font-medium text-white/80">Your Name</span>
          <input
            v-model="name"
            type="text"
            placeholder="e.g. Taylor Swift"
            class="w-full px-4 py-3 rounded-lg bg-white/90 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>
        <button
          type="submit"
          :disabled="!isNameValid"
          class="py-3 rounded-lg font-semibold transition-colors"
          :class="[
            isNameValid
              ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
              : 'bg-white/20 text-white/60 cursor-not-allowed',
          ]"
        >
          Continue
        </button>
      </form>
    </div>
  </div>
</template>
