<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import {Clipboard, Crown, Plus, Minus} from'lucide-vue-next';
import AnswerBox from './AnswerBox.vue'
import ProfilePicture from './ProfilePicture.vue'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner';
import { useSocket } from '@/composables/useSocket';

type User = {
    socketId: string;
    name: string;
    isAdmin: boolean
    position?: number | null;
}

type ServerGameState = {
    users: User[];
    lobbyCode: string;
    topSideBoxCount: number;
    bottomSideBoxCount: number;
}

const { socket: socketRef } = useSocket();
const socket = socketRef.value;

const router = useRouter();
const route = useRoute()
const userName = computed(() => route.query.name as string || 'Guest')
const mode = computed(() => route.query.action as string)

const initialLobbyCode = route.query.lobbyCode
const gameState = ref<ServerGameState | null>(null)
const handleBoxSelection = (boxNumber: number) => {
    socket.emit("positionSelected", boxNumber);
}

const copyCodeToClipboard = () => {
  navigator.clipboard.writeText(gameState.value!.lobbyCode);
  toast.success("Copied code to clipboard!")
}

const handleConnect = () => {
    if (mode.value === 'create') {
        socket.emit('createLobby', userName.value)
    }
    if (mode.value === 'join') {
        socket.emit("joinLobby", userName.value, initialLobbyCode);
    }
  toast.success("Connected to Server", {
    description: "You are now connected to the HOSA Bowl System"
  });
};


const isAdmin = computed(() => {
  const currentUser = gameState.value?.users.find(user => user.socketId === socket.id);
  return currentUser?.isAdmin ?? false;
});

const getUserAtPosition = (position: number) => {
  return gameState.value?.users.find(user => user.position === position);
};

const isPositionAvailable = (position: number) => {
  if (!gameState.value) return false;

  // Top side: positions 1-4
  if (position >= 1 && position <= 4) {
    return position <= gameState.value.topSideBoxCount;
  }
  // Bottom side: positions 5-8
  if (position >= 5 && position <= 8) {
    return position < 5 + gameState.value.bottomSideBoxCount;
  }
  return false;
};

const handleStartGame = () => {
  // TODO: Implement start game functionality
  socket.emit('startGame');
};

const handleGameStart = ({message}: {message: string, lobby: ServerGameState}) => {
    console.log(message); // Log the success message
    router.push({
        path: '/game',
    });
}

const handleError = (error: { message: string }) => {
    toast.error("Error", {
        description: error.message
    });
}

const updateBoxCount = (side: 'top' | 'bottom', delta: number) => {
    if (!gameState.value) return;

    const currentTop = gameState.value.topSideBoxCount;
    const currentBottom = gameState.value.bottomSideBoxCount;

    let newTop = currentTop;
    let newBottom = currentBottom;

    if (side === 'top') {
        newTop = Math.max(1, Math.min(4, currentTop + delta));
    } else {
        newBottom = Math.max(1, Math.min(4, currentBottom + delta));
    }

    socket.emit('updateBoxCounts', newTop, newBottom);
}

socket.on('connect', handleConnect);
socket.on('gameStarted', handleGameStart);
socket.on('error', handleError);
socket.on('updateGameState', (payload: ServerGameState) => {
    gameState.value = payload;
});

if (socket.connected) {
    handleConnect();
}

</script>

<template>
    <!-- Loading Spinner -->
    <div v-if="!gameState" class="flex flex-col items-center justify-center gap-4">
        <Spinner class="size-12" />
        <p class="text-xl text-white/90">Connecting to lobby...</p>
    </div>

    <!-- Main Content -->
    <template v-else>
        <div class="absolute top-4 right-4 flex items-center gap-3">
            <Crown v-if="isAdmin" class="stroke-yellow-400" :size="24" />
            <ProfilePicture :name="userName"  />
        </div>
        <div
            v-if="gameState?.lobbyCode"
            class="absolute top-4 left-4 flex flex-col items-center rounded-lg border border-border px-4 py-3 space-y-1"
        >
            <span class="text-xs uppercase text-gray-400">Lobby Code</span>
            <div class="flex items-center justify-center space-x-2 font-mono text-2xl tracking-widest">
                <span>{{ gameState.lobbyCode }}</span>
                <Clipboard
                    @click="copyCodeToClipboard"
                    class="hover:stroke-gray-300 hover:cursor-pointer"
                />
            </div>
        </div>

        <!-- Admin Controls for Box Counts -->
        <div v-if="isAdmin" class="mb-8 p-6 rounded-lg border border-border bg-background/50">
            <h3 class="text-lg font-semibold mb-4 text-center">Answer Box Configuration</h3>
            <div class="flex items-center justify-center gap-12">
                <!-- Top Side Controls -->
                <div class="flex flex-col items-center gap-2">
                    <span class="text-sm text-gray-400 uppercase">Top Side Boxes</span>
                    <div class="flex items-center gap-2">
                        <Button
                            @click="updateBoxCount('top', -1)"
                            :disabled="gameState!.topSideBoxCount <= 1"
                            size="icon"
                            variant="outline"
                        >
                            <Minus class="h-4 w-4" />
                        </Button>
                        <span class="text-2xl font-bold min-w-[2rem] text-center">{{ gameState?.topSideBoxCount }}</span>
                        <Button
                            @click="updateBoxCount('top', 1)"
                            :disabled="gameState!.topSideBoxCount >= 4"
                            size="icon"
                            variant="outline"
                        >
                            <Plus class="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <!-- Bottom Side Controls -->
                <div class="flex flex-col items-center gap-2">
                    <span class="text-sm text-gray-400 uppercase">Bottom Side Boxes</span>
                    <div class="flex items-center gap-2">
                        <Button
                            @click="updateBoxCount('bottom', -1)"
                            :disabled="gameState!.bottomSideBoxCount <= 1"
                            size="icon"
                            variant="outline"
                        >
                            <Minus class="h-4 w-4" />
                        </Button>
                        <span class="text-2xl font-bold min-w-[2rem] text-center">{{ gameState?.bottomSideBoxCount }}</span>
                        <Button
                            @click="updateBoxCount('bottom', 1)"
                            :disabled="gameState!.bottomSideBoxCount >= 4"
                            size="icon"
                            variant="outline"
                        >
                            <Plus class="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>

    <div class="grid grid-cols-4 gap-x-16 gap-y-8 max-w-4xl">
      <!-- Position 1 -->
      <div v-if="isPositionAvailable(1)" class="flex flex-col items-center gap-4">
        <div class="h-8">
          <ProfilePicture v-if="getUserAtPosition(1)" :name="getUserAtPosition(1)!.name" size="sm" />
        </div>
        <Button v-if="!isAdmin" @click="handleBoxSelection(1)" :disabled="!!getUserAtPosition(1)">
          Click to pick this spot
        </Button>
        <AnswerBox :onPress="() => { }" :rotate=180 />
      </div>

      <!-- Position 2 -->
      <div v-if="isPositionAvailable(2)" class="flex flex-col items-center gap-4">
        <div class="h-8">
          <ProfilePicture v-if="getUserAtPosition(2)" :name="getUserAtPosition(2)!.name" size="sm" />
        </div>
        <Button v-if="!isAdmin" @click="handleBoxSelection(2)" :disabled="!!getUserAtPosition(2)">
          Click to pick this spot
        </Button>
        <AnswerBox :onPress="() => { }" :rotate=180 />
      </div>

      <!-- Position 3 -->
      <div v-if="isPositionAvailable(3)" class="flex flex-col items-center gap-4">
        <div class="h-8">
          <ProfilePicture v-if="getUserAtPosition(3)" :name="getUserAtPosition(3)!.name" size="sm" />
        </div>
        <Button v-if="!isAdmin" @click="handleBoxSelection(3)" :disabled="!!getUserAtPosition(3)">
          Click to pick this spot
        </Button>
        <AnswerBox :onPress="() => { }" :rotate=180 />
      </div>

      <!-- Position 4 -->
      <div v-if="isPositionAvailable(4)" class="flex flex-col items-center gap-4">
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
    <div class="col-span-2 flex items-center justify-center py-8">
      <Button v-if="isAdmin" @click="handleStartGame" size="lg" class="text-xl px-8 py-6">
        Start Game
      </Button>
      <p v-else class="text-xl text-white/90 text-center">
        Click a button to select your answer box position
      </p>
    </div>

    <div class="grid grid-cols-4 gap-x-16 gap-y-8 max-w-4xl">
      <!-- Position 5 -->
      <div v-if="isPositionAvailable(5)" class="flex flex-col items-center gap-4">
        <AnswerBox :onPress="() => { }" />
        <Button v-if="!isAdmin" @click="handleBoxSelection(5)" :disabled="!!getUserAtPosition(5)">
          Click to pick this spot
        </Button>
        <div class="h-8">
          <ProfilePicture v-if="getUserAtPosition(5)" :name="getUserAtPosition(5)!.name" size="sm" />
        </div>
      </div>

      <!-- Position 6 -->
      <div v-if="isPositionAvailable(6)" class="flex flex-col items-center gap-4">
        <AnswerBox :onPress="() => { }" />
        <Button v-if="!isAdmin" @click="handleBoxSelection(6)" :disabled="!!getUserAtPosition(6)">
          Click to pick this spot
        </Button>
        <div class="h-8">
          <ProfilePicture v-if="getUserAtPosition(6)" :name="getUserAtPosition(6)!.name" size="sm" />
        </div>
      </div>

      <!-- Position 7 -->
      <div v-if="isPositionAvailable(7)" class="flex flex-col items-center gap-4">
        <AnswerBox :onPress="() => { }" />
        <Button v-if="!isAdmin" @click="handleBoxSelection(7)" :disabled="!!getUserAtPosition(7)">
          Click to pick this spot
        </Button>
        <div class="h-8">
          <ProfilePicture v-if="getUserAtPosition(7)" :name="getUserAtPosition(7)!.name" size="sm" />
        </div>
      </div>

      <!-- Position 8 -->
      <div v-if="isPositionAvailable(8)" class="flex flex-col items-center gap-4">
        <AnswerBox :onPress="() => { }" />
        <Button v-if="!isAdmin" @click="handleBoxSelection(8)" :disabled="!!getUserAtPosition(8)">
          Click to pick this spot
        </Button>
        <div class="h-8">
          <ProfilePicture v-if="getUserAtPosition(8)" :name="getUserAtPosition(8)!.name" size="sm" />
        </div>
      </div>

    </div>
    </template>
</template>
