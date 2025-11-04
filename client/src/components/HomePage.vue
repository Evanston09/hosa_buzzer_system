<script setup lang="ts">
import { ref } from 'vue';
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'vue-router'

const userName = ref('')
const router = useRouter()

const handleSubmit = () => {
  if (userName.value.trim()) {
    router.push({
      path: '/quiz',
      query: { name: userName.value.trim() }
    })
  }
}

</script>

<template>
        <h1 class="text-6xl font-bold mb-2">Mock HOSA Bowl System</h1>
        <form @submit.prevent="handleSubmit" class="space-y-6 w-full max-w-md">
            <div class="space-y-2">
                <label for="name" class="block text-sm font-medium text-white/90">
                    Your Name
                </label>
                <Input
                    id="name"
                    v-model="userName"
                    type="text"
                    required
                    placeholder="Enter your name"
                />
            </div>

            <Button
                type="submit"
                class="w-full"
            >
                Continue
            </Button>
        </form>
</template>
