<script setup lang="ts">
import { useRoute } from 'vue-router'
import {Clipboard, Crown, Play, Zap} from'lucide-vue-next';
import AnswerBox from './AnswerBox.vue'
import ProfilePicture from './ProfilePicture.vue'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner';
import { io } from 'socket.io-client'

enum GameState {
    LOBBY = "LOBBY",
    IDLE = "IDLE",
    ADMIN_TRIGGERED = "ADMIN_TRIGGERED",
    PLAYER_RESPONDED = "PLAYER_RESPONDED",
    GAME_OVER = "GAME_OVER"
}

type User = {
    socketId: String;
    name: String;
    isAdmin: boolean
    position?: number | null;
}

type GameTimer = {
    masterTimeRemaining: number;
    countdownTimeRemaining: number;
    masterStartTime: number | null;
    countdownStartTime: number | null;
}

type ServerGameState = {
    users: User[];
    lobbyCode: string;
    gameState: GameState;
    timer: GameTimer;
    firstBuzzer: string | null;
}

const socket = io('http://localhost:3000');

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

const handleNewUser = (userName: string) => {
  toast.info("New User", {
    description: userName
  });
};

const isAdmin = computed(() => {
  const currentUser = gameState.value?.users.find(user => user.socketId === socket.id);
  return currentUser?.isAdmin ?? false;
});

const getUserAtPosition = (position: number) => {
  return gameState.value?.users.find(user => user.position === position);
};

const handleStartGame = () => {
  socket.emit('startGame');
};

const handleAdminTrigger = () => {
  socket.emit('adminTrigger');
};

const handlePlayerBuzz = () => {
  socket.emit('playerBuzz');
};

const handleConnectError = () => {
    toast.error("Connection Failed", {
        description: "Unable to reach the HOSA Bowl server. Please try again."
    });
}

const handleError = (error: { message: string }) => {
    toast.error("Error", {
        description: error.message
    });
}

// Helper to format time in MM:SS or SS.SS format
const formatTime = (milliseconds: number, showMillis = false): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const millis = Math.floor((milliseconds % 1000) / 10);

  if (showMillis) {
    return `${seconds}.${millis.toString().padStart(2, '0')}`;
  }

  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${seconds}`;
};

// Computed properties for UI state
const isGameActive = computed(() => {
  return gameState.value?.gameState !== GameState.LOBBY;
});

const canBuzz = computed(() => {
  const currentUser = gameState.value?.users.find(user => user.socketId === socket.id);
  return gameState.value?.gameState === GameState.ADMIN_TRIGGERED &&
         !currentUser?.isAdmin &&
         currentUser?.position !== null;
});

const canAdminTrigger = computed(() => {
  return isAdmin.value && gameState.value?.gameState === GameState.IDLE;
});

const firstBuzzerUser = computed(() => {
  if (!gameState.value?.firstBuzzer) return null;
  return gameState.value.users.find(u => u.socketId === gameState.value?.firstBuzzer);
});

const gameStateLabel = computed(() => {
  switch (gameState.value?.gameState) {
    case GameState.LOBBY:
      return "Waiting to start...";
    case GameState.IDLE:
      return "Ready for next round";
    case GameState.ADMIN_TRIGGERED:
      return "BUZZ IN NOW!";
    case GameState.PLAYER_RESPONDED:
      return `${firstBuzzerUser.value?.name} buzzed in!`;
    case GameState.GAME_OVER:
      return "Game Over";
    default:
      return "";
  }
});

socket.on('connect', handleConnect);
socket.on('user_connected', handleNewUser);
socket.on('connect_error', handleConnectError);
socket.on('error', handleError);
socket.on('updateGameState', (payload: ServerGameState) => {
    gameState.value = payload;
});

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

        <!-- Master Timer (shown when game is active) -->
        <div
            v-if="isGameActive"
            class="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center rounded-lg border-2 border-blue-500/50 bg-blue-950/30 px-6 py-3 space-y-1"
        >
            <span class="text-xs uppercase text-blue-300">Game Timer</span>
            <div class="font-mono text-4xl font-bold text-blue-400 tracking-wider">
                {{ formatTime(gameState.timer.masterTimeRemaining) }}
            </div>
        </div>
    <div class="grid grid-cols-4 gap-x-16 gap-y-8 max-w-4xl">
      <!-- Row 1 -->
      <div class="flex flex-col items-center gap-4">
        <div class="h-8">
          <ProfilePicture v-if="getUserAtPosition(1)" :name="getUserAtPosition(1)!.name" size="sm" />
        </div>
        <Button
          v-if="!isAdmin && gameState.gameState === 'LOBBY'"
          @click="handleBoxSelection(1)"
          :disabled="!!getUserAtPosition(1)"
        >
          Click to pick this spot
        </Button>
        <AnswerBox
          :onPress="() => { if (canBuzz && getUserAtPosition(1)?.socketId === socket.id) handlePlayerBuzz() }"
          :rotate=180
        />
      </div>

      <!-- Row 2 -->
      <div class="flex flex-col items-center gap-4">
        <div class="h-8">
          <ProfilePicture v-if="getUserAtPosition(2)" :name="getUserAtPosition(2)!.name" size="sm" />
        </div>
        <Button
          v-if="!isAdmin && gameState.gameState === 'LOBBY'"
          @click="handleBoxSelection(2)"
          :disabled="!!getUserAtPosition(2)"
        >
          Click to pick this spot
        </Button>
        <AnswerBox
          :onPress="() => { if (canBuzz && getUserAtPosition(2)?.socketId === socket.id) handlePlayerBuzz() }"
          :rotate=180
        />
      </div>

      <div class="flex flex-col items-center gap-4">
        <div class="h-8">
          <ProfilePicture v-if="getUserAtPosition(3)" :name="getUserAtPosition(3)!.name" size="sm" />
        </div>
        <Button
          v-if="!isAdmin && gameState.gameState === 'LOBBY'"
          @click="handleBoxSelection(3)"
          :disabled="!!getUserAtPosition(3)"
        >
          Click to pick this spot
        </Button>
        <AnswerBox
          :onPress="() => { if (canBuzz && getUserAtPosition(3)?.socketId === socket.id) handlePlayerBuzz() }"
          :rotate=180
        />
      </div>

      <div class="flex flex-col items-center gap-4">
        <div class="h-8">
          <ProfilePicture v-if="getUserAtPosition(4)" :name="getUserAtPosition(4)!.name" size="sm" />
        </div>
        <Button
          v-if="!isAdmin && gameState.gameState === 'LOBBY'"
          @click="handleBoxSelection(4)"
          :disabled="!!getUserAtPosition(4)"
        >
          Click to pick this spot
        </Button>
        <AnswerBox
          :onPress="() => { if (canBuzz && getUserAtPosition(4)?.socketId === socket.id) handlePlayerBuzz() }"
          :rotate=180
        />
      </div>

    </div>

    <!-- Center Control Panel -->
    <div class="col-span-2 flex flex-col items-center justify-center py-8 gap-6">
      <!-- Lobby Phase: Start Game Button -->
      <template v-if="gameState.gameState === 'LOBBY'">
        <Button v-if="isAdmin" @click="handleStartGame" size="lg" class="text-xl px-8 py-6">
          <Play class="mr-2" :size="24" />
          Start Game
        </Button>
        <p v-else class="text-xl text-white/90 text-center">
          Click a button to select your answer box position
        </p>
      </template>

      <!-- Game Active Phase -->
      <template v-else>
        <!-- Game State Display -->
        <div class="flex flex-col items-center gap-4">
          <!-- Countdown Timer (shown during triggers) -->
          <div
            v-if="gameState.gameState === 'ADMIN_TRIGGERED' || gameState.gameState === 'PLAYER_RESPONDED'"
            :class="[
              'text-center px-8 py-6 rounded-xl border-4 font-mono text-6xl font-bold tracking-wider min-w-[200px]',
              gameState.gameState === 'ADMIN_TRIGGERED'
                ? 'border-green-500/70 bg-green-950/40 text-green-400 animate-pulse'
                : 'border-purple-500/70 bg-purple-950/40 text-purple-400'
            ]"
          >
            {{ formatTime(gameState.timer.countdownTimeRemaining, true) }}
          </div>

          <!-- Game State Label -->
          <div :class="[
            'text-2xl font-semibold text-center px-6 py-3 rounded-lg',
            gameState.gameState === 'ADMIN_TRIGGERED' ? 'text-green-400 bg-green-950/30' :
            gameState.gameState === 'PLAYER_RESPONDED' ? 'text-purple-400 bg-purple-950/30' :
            'text-blue-400 bg-blue-950/30'
          ]">
            {{ gameStateLabel }}
          </div>

          <!-- First Buzzer Display -->
          <div v-if="firstBuzzerUser" class="flex flex-col items-center gap-3">
            <ProfilePicture :name="firstBuzzerUser.name" size="lg" />
            <span class="text-lg text-white/80">{{ firstBuzzerUser.name }}</span>
          </div>

          <!-- Admin Trigger Button -->
          <Button
            v-if="isAdmin"
            @click="handleAdminTrigger"
            :disabled="!canAdminTrigger"
            size="lg"
            class="text-xl px-8 py-4"
            :class="canAdminTrigger ? 'bg-green-600 hover:bg-green-700' : ''"
          >
            <Zap class="mr-2" :size="24" />
            Trigger Countdown
          </Button>
        </div>
      </template>
    </div>

    <div class="grid grid-cols-4 gap-x-16 gap-y-8 max-w-4xl">
      <!-- Row 3 -->
      <div class="flex flex-col items-center gap-4">
        <AnswerBox
          :onPress="() => { if (canBuzz && getUserAtPosition(5)?.socketId === socket.id) handlePlayerBuzz() }"
        />
        <Button
          v-if="!isAdmin && gameState.gameState === 'LOBBY'"
          @click="handleBoxSelection(5)"
          :disabled="!!getUserAtPosition(5)"
        >
          Click to pick this spot
        </Button>
        <div class="h-8">
          <ProfilePicture v-if="getUserAtPosition(5)" :name="getUserAtPosition(5)!.name" size="sm" />
        </div>
      </div>

      <div class="flex flex-col items-center gap-4">
        <AnswerBox
          :onPress="() => { if (canBuzz && getUserAtPosition(6)?.socketId === socket.id) handlePlayerBuzz() }"
        />
        <Button
          v-if="!isAdmin && gameState.gameState === 'LOBBY'"
          @click="handleBoxSelection(6)"
          :disabled="!!getUserAtPosition(6)"
        >
          Click to pick this spot
        </Button>
        <div class="h-8">
          <ProfilePicture v-if="getUserAtPosition(6)" :name="getUserAtPosition(6)!.name" size="sm" />
        </div>
      </div>

      <!-- Row 4 -->
      <div class="flex flex-col items-center gap-4">
        <AnswerBox
          :onPress="() => { if (canBuzz && getUserAtPosition(7)?.socketId === socket.id) handlePlayerBuzz() }"
        />
        <Button
          v-if="!isAdmin && gameState.gameState === 'LOBBY'"
          @click="handleBoxSelection(7)"
          :disabled="!!getUserAtPosition(7)"
        >
          Click to pick this spot
        </Button>
        <div class="h-8">
          <ProfilePicture v-if="getUserAtPosition(7)" :name="getUserAtPosition(7)!.name" size="sm" />
        </div>
      </div>

      <div class="flex flex-col items-center gap-4">
        <AnswerBox
          :onPress="() => { if (canBuzz && getUserAtPosition(8)?.socketId === socket.id) handlePlayerBuzz() }"
        />
        <Button
          v-if="!isAdmin && gameState.gameState === 'LOBBY'"
          @click="handleBoxSelection(8)"
          :disabled="!!getUserAtPosition(8)"
        >
          Click to pick this spot
        </Button>
        <div class="h-8">
          <ProfilePicture v-if="getUserAtPosition(8)" :name="getUserAtPosition(8)!.name" size="sm" />
        </div>
      </div>

    </div>
    </template>
</template>
