<script setup lang="ts">
import { ref } from 'vue';
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'vue-router'

const userName = ref('')
const lobbyCode = ref('')
const showJoinLobby = ref(false)
const router = useRouter()

const handleCreateLobby = () => {
  if (userName.value.trim()) {
    router.push({
      path: '/quiz',
      query: {
        name: userName.value.trim(),
        action: 'create'
      }
    })
  }
}

const handleJoinLobby = () => {
  if (userName.value.trim() && lobbyCode.value.trim()) {
    router.push({
      path: '/quiz',
      query: {
        name: userName.value.trim(),
        action: 'join',
        lobbyCode: lobbyCode.value.trim().toUpperCase()
      }
    })
  }
}

</script>

<template>
        <h1 class="text-6xl font-bold mb-2">Mock HOSA Bowl System</h1>
        <div class="space-y-6 w-full max-w-md">
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

            <div v-if="!showJoinLobby" class="space-y-3">
                <Button
                    @click="handleCreateLobby"
                    class="w-full"
                    :disabled="!userName.trim()"
                >
                    Create New Lobby
                </Button>

                <Button
                    @click="showJoinLobby = true"
                    variant="outline"
                    class="w-full"
                    :disabled="!userName.trim()"
                >
                    Join Existing Lobby
                </Button>
            </div>

            <div v-else class="space-y-3">
                <div class="space-y-2">
                    <label for="lobbyCode" class="block text-sm font-medium text-white/90">
                        Lobby Code
                    </label>
                    <Input
                        id="lobbyCode"
                        v-model="lobbyCode"
                        type="text"
                        required
                        placeholder="Enter 6-character code"
                        maxlength="6"
                        class="uppercase"
                    />
                </div>

                <Button
                    @click="handleJoinLobby"
                    class="w-full"
                    :disabled="!userName.trim() || !lobbyCode.trim()"
                >
                    Join Lobby
                </Button>

                <Button
                    @click="showJoinLobby = false"
                    variant="ghost"
                    class="w-full"
                >
                    Back
                </Button>
            </div>
        </div>
</template>
