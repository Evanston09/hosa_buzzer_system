<script setup lang="ts">
import { useRoute } from 'vue-router'
import {Clipboard, Crown} from'lucide-vue-next';
import AnswerBox from './AnswerBox.vue'
import ProfilePicture from './ProfilePicture.vue'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { toast } from 'vue-sonner';
import { io } from 'socket.io-client'

type User = {
    socketId: string;
    name: string;
    isAdmin: boolean;
    position?: number | null;
}

type GamePhase = "idle" | "admin_trigger" | "player_response" | "completed";

type ServerGameState = {
    users: User[];
    lobbyCode: string;
    game: {
        masterTimerStartedAt: number | null;
        masterTimerEnd: number | null;
        phase: GamePhase;
        phaseEndsAt: number | null;
        triggeredBy: string | null;
        respondingPlayer: string | null;
    };
    serverTimestamp: number;
}

const MASTER_TIMER_DURATION = 10 * 60 * 1000;

const socket = io('http://localhost:3000');

const route = useRoute()
const userName = computed(() => route.query.name as string || 'Guest')
const mode = computed(() => route.query.action as string)

const initialLobbyCode = route.query.lobbyCode
const gameState = ref<ServerGameState | null>(null)
const serverTimeOffset = ref(0)
const hasBuzzed = ref(false)
const now = ref(Date.now())
let nowInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  nowInterval = setInterval(() => {
    now.value = Date.now()
  }, 200)
})

onUnmounted(() => {
  if (nowInterval) {
    clearInterval(nowInterval)
  }
})

const handleBoxSelection = (boxNumber: number) => {
    socket.emit("positionSelected", boxNumber);
}

const copyCodeToClipboard = () => {
  if (!gameState.value) return
  navigator.clipboard.writeText(gameState.value.lobbyCode);
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

const currentUser = computed(() => {
  return gameState.value?.users.find(user => user.socketId === socket.id) ?? null
})

const isAdmin = computed(() => {
  return currentUser.value?.isAdmin ?? false;
});

const serverNow = computed(() => now.value + serverTimeOffset.value)

const masterTimeRemaining = computed(() => {
  const masterEnd = gameState.value?.game.masterTimerEnd
  if (!masterEnd) return null
  return Math.max(0, masterEnd - serverNow.value)
})

const formatTime = (milliseconds: number) => {
  const totalSeconds = Math.ceil(milliseconds / 1000)
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const seconds = (totalSeconds % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
}

const masterTimerDisplay = computed(() => {
  if (!gameState.value?.game.masterTimerEnd) {
    return formatTime(MASTER_TIMER_DURATION)
  }

  return formatTime(masterTimeRemaining.value ?? 0)
})

const currentPhase = computed<GamePhase>(() => {
  return gameState.value?.game.phase ?? 'idle'
})

const phaseTimeRemaining = computed(() => {
  const endsAt = gameState.value?.game.phaseEndsAt
  if (!endsAt) return null
  return Math.max(0, endsAt - serverNow.value)
})

const phaseTimerDisplay = computed(() => {
  if (phaseTimeRemaining.value == null) return null
  return formatTime(phaseTimeRemaining.value)
})

const phaseTimerLabel = computed(() => {
  switch (currentPhase.value) {
    case 'admin_trigger':
      return 'Buzz Window'
    case 'player_response':
      return 'Response Time'
    default:
      return null
  }
})

const respondingPlayer = computed(() => {
  const playerId = gameState.value?.game.respondingPlayer
  if (!playerId) return null
  return gameState.value?.users.find(user => user.socketId === playerId) ?? null
})

const phaseStatusText = computed(() => {
  if (!gameState.value?.game.masterTimerEnd) {
    return 'Waiting for game start'
  }

  switch (currentPhase.value) {
    case 'idle':
      return 'Awaiting admin trigger'
    case 'admin_trigger':
      return 'Trigger window active'
    case 'player_response': {
      const playerName = respondingPlayer.value?.name
      return playerName ? `${playerName} buzzed in` : 'Player responding'
    }
    case 'completed':
      return 'Master timer finished'
    default:
      return 'Waiting'
  }
})

const getUserAtPosition = (position: number) => {
  return gameState.value?.users.find(user => user.position === position);
};

const canStartGame = computed(() => {
  if (!isAdmin.value) return false
  const game = gameState.value?.game
  if (!game) return false
  if (!game.masterTimerEnd) return true
  if (game.phase === 'completed') return true
  return (masterTimeRemaining.value ?? 0) <= 0
})

const canTriggerWindow = computed(() => {
  if (!isAdmin.value) return false
  const game = gameState.value?.game
  if (!game?.masterTimerEnd) return false
  if (game.masterTimerEnd <= serverNow.value) return false
  return game.phase === 'idle'
})

const playerButtonDisabled = computed(() => {
  if (isAdmin.value) return true
  const game = gameState.value?.game
  if (!game?.masterTimerEnd) return true
  if (game.masterTimerEnd <= serverNow.value) return true
  if (game.phase !== 'admin_trigger') return true
  if (hasBuzzed.value) return true
  return false
})

const handleStartGame = () => {
  if (!canStartGame.value) return
  socket.emit('startGame');
};

const handleAdminTrigger = () => {
  if (!canTriggerWindow.value) return
  socket.emit('triggerWindow')
}

const handlePlayerBuzz = () => {
  if (playerButtonDisabled.value) return
  hasBuzzed.value = true
  socket.emit('playerBuzz')
}

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

const sortedUsers = computed(() => {
  return [...(gameState.value?.users ?? [])].sort((a, b) => {
    const aPos = a.position ?? 99
    const bPos = b.position ?? 99
    return aPos - bPos
  })
})

watch(() => gameState.value?.game.phase, (phase) => {
  if (!phase) return
  if (phase === 'idle' || phase === 'admin_trigger') {
    hasBuzzed.value = false
  }
})

socket.on('connect', handleConnect);
socket.on('user_connected', handleNewUser);
socket.on('connect_error', handleConnectError);
socket.on('error', handleError);
socket.on('updateGameState', (payload: ServerGameState) => {
    serverTimeOffset.value = payload.serverTimestamp - Date.now()
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
        <div class="relative flex w-full flex-col items-center">
            <div class="absolute top-4 right-4 flex items-center gap-3">
                <Crown v-if="isAdmin" class="stroke-yellow-400" :size="24" />
                <ProfilePicture :name="userName" />
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

            <div class="mt-16 flex flex-col items-center gap-2 text-center">
                <span class="font-mono text-6xl font-semibold text-white">{{ masterTimerDisplay }}</span>
                <span class="text-xs uppercase tracking-[0.35em] text-white/70">{{ phaseStatusText }}</span>
                <div v-if="phaseTimerDisplay && phaseTimerLabel" class="flex flex-col items-center gap-1">
                    <span class="text-[10px] uppercase tracking-[0.3em] text-white/50">{{ phaseTimerLabel }}</span>
                    <span class="font-mono text-2xl text-white">{{ phaseTimerDisplay }}</span>
                </div>
            </div>

            <div
                v-if="respondingPlayer"
                class="mt-6 flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-white/5 px-6 py-4 text-white backdrop-blur"
            >
                <ProfilePicture :name="respondingPlayer.name" size="lg" />
                <p class="text-xl font-semibold">{{ respondingPlayer.name }} buzzed in!</p>
            </div>

            <div class="mt-12 flex w-full flex-col items-center gap-10">
                <div class="grid max-w-4xl grid-cols-4 gap-x-16 gap-y-8">
                    <div class="flex flex-col items-center gap-4" v-for="position in 4" :key="`top-${position}`">
                        <div class="h-8">
                            <ProfilePicture
                                v-if="getUserAtPosition(position)"
                                :name="getUserAtPosition(position)!.name"
                                size="sm"
                            />
                        </div>
                        <Button
                            v-if="!isAdmin"
                            @click="handleBoxSelection(position)"
                            :disabled="!!getUserAtPosition(position)"
                        >
                            Click to pick this spot
                        </Button>
                        <AnswerBox :onPress="() => { }" :rotate="180" />
                    </div>
                </div>

                <div class="w-full max-w-4xl">
                    <div v-if="isAdmin" class="flex flex-col items-center gap-4 text-center">
                        <div class="flex flex-wrap items-center justify-center gap-4">
                            <Button
                                size="lg"
                                class="text-xl"
                                :disabled="!canStartGame"
                                @click="handleStartGame"
                            >
                                {{ canStartGame ? 'Start Master Timer' : 'Master Timer Running' }}
                            </Button>
                            <Button
                                size="lg"
                                variant="secondary"
                                :disabled="!canTriggerWindow"
                                @click="handleAdminTrigger"
                            >
                                Trigger 5-Second Window
                            </Button>
                        </div>
                        <p class="text-sm text-white/70">
                            The master timer runs continuously for the full 10 minutes once started.
                        </p>
                    </div>
                    <div v-else class="flex flex-col items-center gap-3 text-center">
                        <Button
                            size="lg"
                            class="px-10 py-6 text-2xl"
                            :disabled="playerButtonDisabled"
                            @click="handlePlayerBuzz"
                        >
                            Buzz In
                        </Button>
                        <p class="text-sm text-white/70">{{ phaseStatusText }}</p>
                    </div>
                </div>

                <div class="grid max-w-4xl grid-cols-4 gap-x-16 gap-y-8">
                    <div
                        class="flex flex-col items-center gap-4"
                        v-for="position in [5, 6, 7, 8]"
                        :key="`bottom-${position}`"
                    >
                        <AnswerBox :onPress="() => { }" />
                        <Button
                            v-if="!isAdmin"
                            @click="handleBoxSelection(position)"
                            :disabled="!!getUserAtPosition(position)"
                        >
                            Click to pick this spot
                        </Button>
                        <div class="h-8">
                            <ProfilePicture
                                v-if="getUserAtPosition(position)"
                                :name="getUserAtPosition(position)!.name"
                                size="sm"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div class="mt-10 w-full max-w-4xl rounded-xl border border-border/60 bg-white/5 px-6 py-5 text-white backdrop-blur">
                <h3 class="mb-4 text-sm uppercase tracking-[0.3em] text-white/60">Players</h3>
                <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div
                        v-for="player in sortedUsers"
                        :key="player.socketId"
                        class="flex items-center gap-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                    >
                        <ProfilePicture :name="player.name" size="sm" />
                        <div class="flex flex-col">
                            <span class="text-sm font-medium text-white">{{ player.name }}</span>
                            <span class="text-xs text-white/60">
                                <template v-if="player.position">Seat {{ player.position }}</template>
                                <template v-else>Seat unassigned</template>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </template>
</template>
