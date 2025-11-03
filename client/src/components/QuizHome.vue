<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AnswerBox from './AnswerBox.vue'
import ProfilePicture from './ProfilePicture.vue'

const route = useRoute()
const userName = computed(() => route.query.name as string || 'Guest')

const handleBoxSelection = (boxNumber: number) => {
  console.log(`Box ${boxNumber} selected`)
}
</script>

<template>
  <div class="min-h-screen bg-[#242424] flex flex-col items-center justify-center p-8 relative">
    <!-- Profile Picture in Top Right -->
    <div class="absolute top-4 right-4 flex items-center gap-3">
      <span class="text-white/90 font-medium">{{ userName }}</span>
      <ProfilePicture :name="userName" size="md" />
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
