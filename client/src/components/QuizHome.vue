<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import AnswerBox from './AnswerBox.vue'
import ProfilePicture from './ProfilePicture.vue'
import { Button } from '@/components/ui/button'
import { computed, ref, onMounted } from 'vue'
import { toast } from 'vue-sonner';
import { io } from 'socket.io-client'
import { Copy, Crown, X } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const userName = computed(() => route.query.name as string || 'Guest')
const action = computed(() => route.query.action as string)
const lobbyCodeParam = computed(() => route.query.lobbyCode as string)

type ServerGameState = {
  users: Array<{
    name: string;
    socketId: string;
    position?: number | null;
    isAdmin?: boolean;
  }>,
  gameStarted?: boolean;
}

const socket = io('http://localhost:3000');
const gameState = ref<ServerGameState>({ users: [] });
const lobbyCode = ref<string>('');
const isAdmin = ref(false);
const mySocketId = ref('');

const handleBoxSelection = (boxNumber: number) => {
    socket.emit("position_selected", boxNumber);
}

const getUserAtPosition = (position: number) => {
  return gameState.value.users.find(user => user.position === position);
};

const handleStartGame = () => {
  socket.emit('start_game');
};

const handleKickUser = (socketId: string) => {
  socket.emit('kick_user', socketId);
};

const copyLobbyCode = async () => {
  try {
    await navigator.clipboard.writeText(lobbyCode.value);
    toast.success("Copied!", {
      description: "Lobby code copied to clipboard"
    });
  } catch (err) {
    toast.error("Failed to copy lobby code");
  }
};

const handleConnectError = () => {
    toast.error("Connection Failed", {
        description: "Unable to reach the HOSA Bowl server. Please try again."
    });
}

const handleConnect = () => {
  mySocketId.value = socket.id || '';
  toast.success("Connected to Server", {
    description: "Connecting to lobby..."
  });

  if (action.value === 'create') {
    socket.emit('create_lobby', userName.value, (response: any) => {
      if (response.success) {
        lobbyCode.value = response.lobbyId;
        isAdmin.value = response.isAdmin;
        toast.success("Lobby Created!", {
          description: `Lobby Code: ${response.lobbyId}`
        });
      } else {
        toast.error("Failed to create lobby", {
          description: response.error
        });
        router.push('/');
      }
    });
  } else if (action.value === 'join' && lobbyCodeParam.value) {
    socket.emit('join_lobby', {
      userName: userName.value,
      lobbyId: lobbyCodeParam.value
    }, (response: any) => {
      if (response.success) {
        lobbyCode.value = response.lobbyId;
        isAdmin.value = response.isAdmin;
        toast.success("Joined Lobby!", {
          description: `Welcome to ${response.lobbyId}`
        });
      } else {
        toast.error("Failed to join lobby", {
          description: response.error
        });
        router.push('/');
      }
    });
  }
};

const handleUserJoined = (userName: string) => {
  toast.info("User Joined", {
    description: userName
  });
};

const handleGameStateUpdate = (state: ServerGameState) => {
  gameState.value = state;
};

const handleGameStarted = () => {
  toast.success("Game Started!", {
    description: "The game has begun!"
  });
};

const handleKickedFromLobby = () => {
  toast.error("Kicked from Lobby", {
    description: "You have been removed from the lobby"
  });
  socket.disconnect();
  router.push('/');
};

const handleNewAdmin = (newAdminSocketId: string) => {
  if (socket.id === newAdminSocketId) {
    isAdmin.value = true;
    toast.info("You are now the admin", {
      description: "The previous admin has left"
    });
  }
};

socket.on('connect', handleConnect);
socket.on('user_joined', handleUserJoined);
socket.on('updateGameState', handleGameStateUpdate);
socket.on('game_started', handleGameStarted);
socket.on('kicked_from_lobby', handleKickedFromLobby);
socket.on('new_admin', handleNewAdmin);
socket.on('connect_error', handleConnectError);
</script>

<template>
        <!-- Header with Lobby Info and Profile -->
        <div class="absolute top-4 left-4 right-4 flex items-center justify-between">
            <div class="flex items-center gap-4">
                <div class="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2">
                    <span class="text-sm text-white/70">Lobby:</span>
                    <span class="text-lg font-bold text-white">{{ lobbyCode }}</span>
                    <Button @click="copyLobbyCode" size="sm" variant="ghost" class="h-6 w-6 p-0">
                        <Copy class="h-4 w-4" />
                    </Button>
                </div>
                <div v-if="isAdmin" class="bg-amber-500/20 backdrop-blur-sm rounded-lg px-3 py-1 flex items-center gap-2">
                    <Crown class="h-4 w-4 text-amber-400" />
                    <span class="text-sm text-amber-300">Admin</span>
                </div>
            </div>
            <ProfilePicture :name="userName" />
        </div>
    <div class="grid grid-cols-4 gap-x-16 gap-y-8 max-w-4xl">
      <!-- Row 1 -->
      <div class="flex flex-col items-center gap-4">
        <div class="h-8 flex items-center gap-2">
          <ProfilePicture v-if="getUserAtPosition(1)" :name="getUserAtPosition(1)!.name" size="sm" />
          <Button v-if="isAdmin && getUserAtPosition(1) && getUserAtPosition(1)!.socketId !== mySocketId"
                  @click="handleKickUser(getUserAtPosition(1)!.socketId)"
                  size="sm" variant="destructive" class="h-6 w-6 p-0">
            <X class="h-3 w-3" />
          </Button>
        </div>
        <Button v-if="!isAdmin" @click="handleBoxSelection(1)" :disabled="!!getUserAtPosition(1)">
          Click to pick this spot
        </Button>
        <AnswerBox :onPress="() => { }" :rotate=180 />
      </div>

      <!-- Row 2 -->
      <div class="flex flex-col items-center gap-4">
        <div class="h-8 flex items-center gap-2">
          <ProfilePicture v-if="getUserAtPosition(2)" :name="getUserAtPosition(2)!.name" size="sm" />
          <Button v-if="isAdmin && getUserAtPosition(2) && getUserAtPosition(2)!.socketId !== mySocketId"
                  @click="handleKickUser(getUserAtPosition(2)!.socketId)"
                  size="sm" variant="destructive" class="h-6 w-6 p-0">
            <X class="h-3 w-3" />
          </Button>
        </div>
        <Button v-if="!isAdmin" @click="handleBoxSelection(2)" :disabled="!!getUserAtPosition(2)">
          Click to pick this spot
        </Button>
        <AnswerBox :onPress="() => { }" :rotate=180 />
      </div>

      <div class="flex flex-col items-center gap-4">
        <div class="h-8 flex items-center gap-2">
          <ProfilePicture v-if="getUserAtPosition(3)" :name="getUserAtPosition(3)!.name" size="sm" />
          <Button v-if="isAdmin && getUserAtPosition(3) && getUserAtPosition(3)!.socketId !== mySocketId"
                  @click="handleKickUser(getUserAtPosition(3)!.socketId)"
                  size="sm" variant="destructive" class="h-6 w-6 p-0">
            <X class="h-3 w-3" />
          </Button>
        </div>
        <Button v-if="!isAdmin" @click="handleBoxSelection(3)" :disabled="!!getUserAtPosition(3)">
          Click to pick this spot
        </Button>
        <AnswerBox :onPress="() => { }" :rotate=180 />
      </div>

      <div class="flex flex-col items-center gap-4">
        <div class="h-8 flex items-center gap-2">
          <ProfilePicture v-if="getUserAtPosition(4)" :name="getUserAtPosition(4)!.name" size="sm" />
          <Button v-if="isAdmin && getUserAtPosition(4) && getUserAtPosition(4)!.socketId !== mySocketId"
                  @click="handleKickUser(getUserAtPosition(4)!.socketId)"
                  size="sm" variant="destructive" class="h-6 w-6 p-0">
            <X class="h-3 w-3" />
          </Button>
        </div>
        <Button v-if="!isAdmin" @click="handleBoxSelection(4)" :disabled="!!getUserAtPosition(4)">
          Click to pick this spot
        </Button>
        <AnswerBox :onPress="() => { }" :rotate=180 />
      </div>

    </div>
    <!-- Center Text or Admin Button -->
    <div class="col-span-2 flex items-center justify-center py-8">
      <Button v-if="isAdmin" @click="handleStartGame" size="lg" class="text-xl px-8 py-6">
        Start Game
      </Button>
      <p v-else class="text-xl text-white/90 text-center">
        Click a button to select your answer box position
      </p>
    </div>

    <div class="grid grid-cols-4 gap-x-16 gap-y-8 max-w-4xl">
      <!-- Row 3 -->
      <div class="flex flex-col items-center gap-4">
        <AnswerBox :onPress="() => { }" />
        <Button v-if="!isAdmin" @click="handleBoxSelection(5)" :disabled="!!getUserAtPosition(5)">
          Click to pick this spot
        </Button>
        <div class="h-8 flex items-center gap-2">
          <ProfilePicture v-if="getUserAtPosition(5)" :name="getUserAtPosition(5)!.name" size="sm" />
          <Button v-if="isAdmin && getUserAtPosition(5) && getUserAtPosition(5)!.socketId !== mySocketId"
                  @click="handleKickUser(getUserAtPosition(5)!.socketId)"
                  size="sm" variant="destructive" class="h-6 w-6 p-0">
            <X class="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div class="flex flex-col items-center gap-4">
        <AnswerBox :onPress="() => { }" />
        <Button v-if="!isAdmin" @click="handleBoxSelection(6)" :disabled="!!getUserAtPosition(6)">
          Click to pick this spot
        </Button>
        <div class="h-8 flex items-center gap-2">
          <ProfilePicture v-if="getUserAtPosition(6)" :name="getUserAtPosition(6)!.name" size="sm" />
          <Button v-if="isAdmin && getUserAtPosition(6) && getUserAtPosition(6)!.socketId !== mySocketId"
                  @click="handleKickUser(getUserAtPosition(6)!.socketId)"
                  size="sm" variant="destructive" class="h-6 w-6 p-0">
            <X class="h-3 w-3" />
          </Button>
        </div>
      </div>

      <!-- Row 4 -->
      <div class="flex flex-col items-center gap-4">
        <AnswerBox :onPress="() => { }" />
        <Button v-if="!isAdmin" @click="handleBoxSelection(7)" :disabled="!!getUserAtPosition(7)">
          Click to pick this spot
        </Button>
        <div class="h-8 flex items-center gap-2">
          <ProfilePicture v-if="getUserAtPosition(7)" :name="getUserAtPosition(7)!.name" size="sm" />
          <Button v-if="isAdmin && getUserAtPosition(7) && getUserAtPosition(7)!.socketId !== mySocketId"
                  @click="handleKickUser(getUserAtPosition(7)!.socketId)"
                  size="sm" variant="destructive" class="h-6 w-6 p-0">
            <X class="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div class="flex flex-col items-center gap-4">
        <AnswerBox :onPress="() => { }" />
        <Button v-if="!isAdmin" @click="handleBoxSelection(8)" :disabled="!!getUserAtPosition(8)">
          Click to pick this spot
        </Button>
        <div class="h-8 flex items-center gap-2">
          <ProfilePicture v-if="getUserAtPosition(8)" :name="getUserAtPosition(8)!.name" size="sm" />
          <Button v-if="isAdmin && getUserAtPosition(8) && getUserAtPosition(8)!.socketId !== mySocketId"
                  @click="handleKickUser(getUserAtPosition(8)!.socketId)"
                  size="sm" variant="destructive" class="h-6 w-6 p-0">
            <X class="h-3 w-3" />
          </Button>
        </div>
      </div>

    </div>
</template>
