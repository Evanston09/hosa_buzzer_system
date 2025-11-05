<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import AnswerBox from './AnswerBox.vue'
import ProfilePicture from './ProfilePicture.vue'
import { Button } from '@/components/ui/button'
import { computed, onBeforeUnmount, ref } from 'vue'
import { toast } from 'vue-sonner';
import { io } from 'socket.io-client'

type ServerGameState = {
  lobbyCode: string;
  admin: {
    name: string;
    socketId: string;
  };
  users: Array<{
    name: string;
    socketId: string;
    position?: number | null;
  }>;
}

type LobbyAck = {
  success: boolean;
  lobbyCode?: string;
  gameState?: ServerGameState;
  error?: string;
}

const route = useRoute()
const router = useRouter()

const socket = io('http://localhost:3000');

const userName = computed(() => route.query.name as string || 'Guest')
const requestedLobbyCode = computed(() => (route.query.lobby as string | undefined)?.toUpperCase() ?? null)
const isCreatingLobby = computed(() => route.query.mode === 'create')

const socketId = ref<string>('')
const gameState = ref<ServerGameState | null>(null)
const lobbyCode = ref<string | null>(requestedLobbyCode.value)

const isAdmin = computed(() => gameState.value?.admin.socketId === socketId.value)

const getUserAtPosition = (position: number) => {
  return gameState.value?.users.find(user => user.position === position)
};

const handleLobbyAck = (ack: LobbyAck) => {
  if (!ack.success) {
    toast.error("Unable to join lobby", {
      description: ack.error ?? 'Something went wrong. Please try again.'
    })
    socket.disconnect()
    router.replace('/')
    return
  }

  if (ack.lobbyCode) {
    lobbyCode.value = ack.lobbyCode
  }

  if (ack.gameState) {
    gameState.value = ack.gameState
  }

  toast.success(isCreatingLobby.value ? 'Lobby created' : 'Joined lobby', {
    description: `Lobby code: ${ack.lobbyCode ?? lobbyCode.value}`
  })
}

const handleConnect = () => {
  socketId.value = socket.id ?? ''

  if (isCreatingLobby.value) {
    socket.emit('create_lobby', { name: userName.value }, handleLobbyAck)
  } else if (requestedLobbyCode.value) {
    socket.emit('join_lobby', { name: userName.value, lobbyCode: requestedLobbyCode.value }, handleLobbyAck)
  } else {
    toast.error('Lobby information missing', {
      description: 'Please create or join a lobby from the home page.'
    })
    socket.disconnect()
    router.replace('/')
  }

  toast.success('Connected to Server', {
    description: 'You are now connected to the HOSA Bowl System'
  })
};

const handleNewUser = (payload: { name: string; lobbyCode: string }) => {
  toast.info('New User', {
    description: `${payload.name} joined lobby ${payload.lobbyCode}`
  })
};

const handleGameStateUpdate = (state: ServerGameState) => {
  gameState.value = state
  lobbyCode.value = state.lobbyCode
};

const handleStartGame = () => {
  socket.emit('start_game');
};

const handleConnectError = () => {
  toast.error('Connection Failed', {
    description: 'Unable to reach the HOSA Bowl server. Please try again.'
  });
}

const handleActionDenied = (message: string) => {
  toast.error('Action not allowed', {
    description: message
  })
}

const handleGameStarted = () => {
  toast.success('Game Started', {
    description: 'The lobby admin has started the game.'
  })
}

const handleAdminChanged = (payload: { name: string }) => {
  toast.info('Admin updated', {
    description: `${payload.name} is now the lobby admin.`
  })
}

const lobbyDisplayCode = computed(() => lobbyCode.value ?? '-----')

const handleBoxSelection = (boxNumber: number) => {
  socket.emit("position_selected", boxNumber);
}

socket.on('connect', handleConnect);
socket.on('user_connected', handleNewUser);
socket.on('updateGameState', handleGameStateUpdate);
socket.on('connect_error', handleConnectError);
socket.on('action_denied', handleActionDenied);
socket.on('game_started', handleGameStarted);
socket.on('admin_changed', handleAdminChanged);

onBeforeUnmount(() => {
  socket.off('connect', handleConnect)
  socket.off('user_connected', handleNewUser)
  socket.off('updateGameState', handleGameStateUpdate)
  socket.off('connect_error', handleConnectError)
  socket.off('action_denied', handleActionDenied)
  socket.off('game_started', handleGameStarted)
  socket.off('admin_changed', handleAdminChanged)
  socket.disconnect()
})
</script>

<template>
    <!-- Header with Profile Picture and lobby code -->
    <div class="flex items-center justify-between w-full max-w-4xl mb-8">
      <div>
        <p class="text-sm text-white/80">Lobby Code</p>
        <p class="text-2xl font-semibold tracking-[0.3em]">{{ lobbyDisplayCode }}</p>
      </div>
      <ProfilePicture :name="userName" />
    </div>

    <div v-if="!gameState" class="w-full max-w-4xl py-16 text-center text-white/80 text-lg">
      Waiting for lobby to load...
    </div>

    <div v-else class="w-full max-w-4xl space-y-8">
      <div class="grid grid-cols-4 gap-x-16 gap-y-8">
        <!-- Row 1 -->
        <div class="flex flex-col items-center gap-4">
          <div class="h-8">
            <ProfilePicture v-if="getUserAtPosition(1)" :name="getUserAtPosition(1)!.name" size="sm" />
          </div>
          <Button v-if="!isAdmin" @click="handleBoxSelection(1)" :disabled="!!getUserAtPosition(1)">
            Click to pick this spot
          </Button>
          <AnswerBox :onPress="() => { }" :rotate=180 />
        </div>

        <!-- Row 2 -->
        <div class="flex flex-col items-center gap-4">
          <div class="h-8">
            <ProfilePicture v-if="getUserAtPosition(2)" :name="getUserAtPosition(2)!.name" size="sm" />
          </div>
          <Button v-if="!isAdmin" @click="handleBoxSelection(2)" :disabled="!!getUserAtPosition(2)">
            Click to pick this spot
          </Button>
          <AnswerBox :onPress="() => { }" :rotate=180 />
        </div>

        <div class="flex flex-col items-center gap-4">
          <div class="h-8">
            <ProfilePicture v-if="getUserAtPosition(3)" :name="getUserAtPosition(3)!.name" size="sm" />
          </div>
          <Button v-if="!isAdmin" @click="handleBoxSelection(3)" :disabled="!!getUserAtPosition(3)">
            Click to pick this spot
          </Button>
          <AnswerBox :onPress="() => { }" :rotate=180 />
        </div>

        <div class="flex flex-col items-center gap-4">
          <div class="h-8">
            <ProfilePicture v-if="getUserAtPosition(4)" :name="getUserAtPosition(4)!.name" size="sm" />
          </div>
          <Button v-if="!isAdmin" @click="handleBoxSelection(4)" :disabled="!!getUserAtPosition(4)">
            Click to pick this spot
          </Button>
          <AnswerBox :onPress="() => { }" :rotate=180 />
        </div>
      </div>

      <!-- Center Text or Admin Button -->
      <div class="flex items-center justify-center py-8">
        <Button v-if="isAdmin" @click="handleStartGame" size="lg" class="text-xl px-8 py-6">
          Start Game
        </Button>
        <p v-else class="text-xl text-white/90 text-center">
          Click a button to select your answer box position
        </p>
      </div>

      <div class="grid grid-cols-4 gap-x-16 gap-y-8">
        <!-- Row 3 -->
        <div class="flex flex-col items-center gap-4">
          <AnswerBox :onPress="() => { }" />
          <Button v-if="!isAdmin" @click="handleBoxSelection(5)" :disabled="!!getUserAtPosition(5)">
            Click to pick this spot
          </Button>
          <div class="h-8">
            <ProfilePicture v-if="getUserAtPosition(5)" :name="getUserAtPosition(5)!.name" size="sm" />
          </div>
        </div>

        <div class="flex flex-col items-center gap-4">
          <AnswerBox :onPress="() => { }" />
          <Button v-if="!isAdmin" @click="handleBoxSelection(6)" :disabled="!!getUserAtPosition(6)">
            Click to pick this spot
          </Button>
          <div class="h-8">
            <ProfilePicture v-if="getUserAtPosition(6)" :name="getUserAtPosition(6)!.name" size="sm" />
          </div>
        </div>

        <!-- Row 4 -->
        <div class="flex flex-col items-center gap-4">
          <AnswerBox :onPress="() => { }" />
          <Button v-if="!isAdmin" @click="handleBoxSelection(7)" :disabled="!!getUserAtPosition(7)">
            Click to pick this spot
          </Button>
          <div class="h-8">
            <ProfilePicture v-if="getUserAtPosition(7)" :name="getUserAtPosition(7)!.name" size="sm" />
          </div>
        </div>

        <div class="flex flex-col items-center gap-4">
          <AnswerBox :onPress="() => { }" />
          <Button v-if="!isAdmin" @click="handleBoxSelection(8)" :disabled="!!getUserAtPosition(8)">
            Click to pick this spot
          </Button>
          <div class="h-8">
            <ProfilePicture v-if="getUserAtPosition(8)" :name="getUserAtPosition(8)!.name" size="sm" />
          </div>
        </div>
      </div>
    </div>
</template>
