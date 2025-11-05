<script setup lang="ts">
import { computed, ref } from 'vue';
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

const userName = ref('')
const lobbyCode = ref('')
const isCreatingLobby = ref(true)
const router = useRouter()

const submitLabel = computed(() => (isCreatingLobby.value ? 'Create Lobby' : 'Join Lobby'))

const toggleMode = (creating: boolean) => {
  isCreatingLobby.value = creating
  if (creating) {
    lobbyCode.value = ''
  }
}

const handleSubmit = () => {
  const trimmedName = userName.value.trim()

  if (!trimmedName) {
    toast.error('A display name is required')
    return
  }

  if (isCreatingLobby.value) {
    router.push({
      path: '/quiz',
      query: { name: trimmedName, mode: 'create' }
    })
    return
  }

  const trimmedCode = lobbyCode.value.trim().toUpperCase()

  if (!trimmedCode) {
    toast.error('Enter a lobby code to join an existing lobby')
    return
  }

  router.push({
    path: '/quiz',
    query: { name: trimmedName, lobby: trimmedCode }
  })
}

</script>

<template>
  <div class="w-full max-w-xl space-y-10">
    <h1 class="text-6xl font-bold">Mock HOSA Bowl System</h1>
    <p class="text-white/70 text-lg">
      Create a new lobby to become the game admin or join an existing lobby with its shareable code.
    </p>

    <div class="flex flex-wrap gap-3">
      <Button
        type="button"
        :variant="isCreatingLobby ? 'default' : 'outline'"
        class="px-6"
        @click="toggleMode(true)"
      >
        Create Lobby
      </Button>
      <Button
        type="button"
        :variant="!isCreatingLobby ? 'default' : 'outline'"
        class="px-6"
        @click="toggleMode(false)"
      >
        Join Lobby
      </Button>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
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

      <div v-if="!isCreatingLobby" class="space-y-2">
        <label for="lobby-code" class="block text-sm font-medium text-white/90">
          Lobby Code
        </label>
        <Input
          id="lobby-code"
          v-model="lobbyCode"
          type="text"
          required
          placeholder="ABCDE"
          class="uppercase tracking-[0.35em] text-center"
          maxlength="5"
        />
      </div>

      <Button type="submit" class="w-full">
        {{ submitLabel }}
      </Button>
    </form>
  </div>
</template>
