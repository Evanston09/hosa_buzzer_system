<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const userName = ref('')

const handleSubmit = () => {
  if (userName.value.trim()) {
    // Navigate to quiz page with user name
    router.push({
      path: '/quiz',
      query: { name: userName.value.trim() }
    })
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#242424] flex flex-col items-center justify-center p-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Title -->
      <div class="text-center">
        <h1 class="text-4xl font-bold text-white mb-2">
          HOSA Buzzer System
        </h1>
        <p class="text-lg text-white/70">
          Welcome! Please enter your name to begin
        </p>
      </div>

      <!-- Name Input Form -->
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div>
          <label for="name" class="block text-sm font-medium text-white/90 mb-2">
            Your Name
          </label>
          <input
            id="name"
            v-model="userName"
            type="text"
            required
            placeholder="Enter your name"
            class="w-full px-4 py-3 bg-[#2a2a2a] border border-blue-600/50 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
          />
        </div>

        <button
          type="submit"
          :disabled="!userName.trim()"
          class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/40 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          Continue
        </button>
      </form>
    </div>
  </div>
</template>
