<script setup lang="ts">
import { toast } from 'vue-sonner';
import { ref, computed, watch } from 'vue'
import { Spinner } from '@/components/ui/spinner'
import { useSocket } from '@/composables/useSocket'
import GameClock from './GameClock.vue';
import { Button } from '@/components/ui/button';
import AnswerBox from './AnswerBox.vue';
import ProfilePicture from './ProfilePicture.vue';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { router } from '@/router';

const { socket: socketRef } = useSocket()
const socket = socketRef.value
const buzzTime = ref(500);
const answerTime = ref(500);

const isConnected = ref(socket.connected)

type User = {
    socketId: string;
    name: string;
    isAdmin: boolean
    position?: number | null;
}

type ServerGameState = {
    gameState: 'lobby' | 'normal' | 'buzzTime' | 'answer';
    hotSeat? : number | null
    timeoutId?: number | null;
    users: User[];
    lobbyCode: string;
    topSideBoxCount: number;
    bottomSideBoxCount: number;
}

let mainCountdown = ref(600);
let dialogOpen = ref(false);

let mainCountdownInterval = setInterval(() => {
    mainCountdown.value -= 1;
    if(mainCountdown.value === 0) {
        if (mainCountdownInterval) clearInterval(mainCountdownInterval);
    }
}, 1000);

const gameState = ref<ServerGameState | null>();

const handleStartBuzzPhase = () => {
    socket.emit('startBuzzPhase');
    toast.success("Buzz phase started!", {
        description: "Players can now buzz in"
    });
}

const startBuzzTimer = () => {
    buzzTime.value = 500;
    let buzzTimerIntervalId = setInterval(() => {
        buzzTime.value -= 1;
        if(buzzTime.value === 0) {
            if (buzzTimerIntervalId) clearInterval(buzzTimerIntervalId);
        }
    }, 10);
}

const startAnswerTimer = () => {
    answerTime.value = 500;
    let answerTimerIntervalId = setInterval(() => {
        answerTime.value -= 1;
        if(answerTime.value === 0) {
            if (answerTimerIntervalId) clearInterval(answerTimerIntervalId);
        }
    }, 10);
}


const handleAnswerBoxPress = () => {
    console.log("handleAnswerBoxPress called, current gameState:", gameState.value?.gameState);

    if (gameState.value?.gameState !== 'buzzTime') {
        toast.error("Cannot answer yet", {
            description: `Current state: ${gameState.value?.gameState}. Wait for the buzz phase to start`
        });
        return;
    }

    console.log("Emitting buzz event");
    socket.emit("buzz");
}

watch(() => gameState.value?.gameState, (newState, oldState) => {
    console.log(`Game state changed from ${oldState} to ${newState}`);

    if (newState === 'buzzTime' && oldState !== 'buzzTime') {
        console.log("Starting buzz timer");
        startBuzzTimer();
    } else if (newState === 'answer' && oldState !== 'answer') {
        console.log("Starting answer timer");
        startAnswerTimer();
    }
});

const displayClock = computed(() => {
    if (gameState.value?.gameState === 'buzzTime') {
        return { time: buzzTime.value, mode: 'seconds:centiseconds'};
    } else if (gameState.value?.gameState === 'answer') {
        return { time: answerTime.value, mode: 'seconds:centiseconds'};
    }
    return { time: mainCountdown.value, mode: 'minutes:seconds'};
})

if (socket.connected) {
    isConnected.value = true
}

socket.emitWithAck('connectedToGame').then((r) => gameState.value = r);

const isAdmin = computed(() => {
    const currentUser = gameState.value?.users.find((user) => user.socketId === socket.id);
    return currentUser?.isAdmin ?? false;
})

const getUserAtPosition = (position: number) => {
    return gameState.value?.users.find(user => user.position === position);
}

const isHotSeat = (position: number) => {
    return gameState.value?.hotSeat === position;
}

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
}

socket.on('updateGameState', (payload: ServerGameState) => {
    console.log("Received updateGameState:", payload);
    gameState.value = payload;
});

socket.on('error', (error: { message: string }) => {
    toast.error("Error", {
        description: error.message
    });
});

socket.on('gameEnded', () => {
    dialogOpen.value = true;
});
</script>

<template>
    <div v-if="!gameState" class="flex flex-col items-center justify-center gap-4">
        <Spinner class="size-12" />
        <p class="text-xl text-white/90">Connecting to lobby...</p>
    </div>
    <template v-else>
        <AlertDialog v-model:open="dialogOpen">
            <AlertDialogContent  :disableOutsidePointerEvents="true" @escapeKeyDown="(event) => event.preventDefault()">
                <AlertDialogHeader>
                    <AlertDialogTitle>Time's Up</AlertDialogTitle>
                    <AlertDialogDescription>The game has ended.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction @click="router.push('/')">Return to Home</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        <div v-if="isAdmin">
            <div class="grid grid-cols-4 gap-x-16 gap-y-8 max-w-4xl">
                <!-- Position 1 -->
                <div v-if="isPositionAvailable(1)" class="flex flex-col items-center gap-4">
                    <div class="h-8">
                        <ProfilePicture v-if="getUserAtPosition(1)" :name="getUserAtPosition(1)!.name" size="sm" />
                    </div>
                    <AnswerBox
                        :onPress="() => {}"
                        :rotate="180"
                        :lightOn="isHotSeat(1)"
                    />
                </div>

                <!-- Position 2 -->
                <div v-if="isPositionAvailable(2)" class="flex flex-col items-center gap-4">
                    <div class="h-8">
                        <ProfilePicture v-if="getUserAtPosition(2)" :name="getUserAtPosition(2)!.name" size="sm" />
                    </div>
                    <AnswerBox
                        :onPress="() => {}"
                        :rotate="180"
                        :lightOn="isHotSeat(2)"
                    />
                </div>

                <!-- Position 3 -->
                <div v-if="isPositionAvailable(3)" class="flex flex-col items-center gap-4">
                    <div class="h-8">
                        <ProfilePicture v-if="getUserAtPosition(3)" :name="getUserAtPosition(3)!.name" size="sm" />
                    </div>
                    <AnswerBox
                        :onPress="() => {}"
                        :rotate="180"
                        :lightOn="isHotSeat(3)"
                    />
                </div>

                <!-- Position 4 -->
                <div v-if="isPositionAvailable(4)" class="flex flex-col items-center gap-4">
                    <div class="h-8">
                        <ProfilePicture v-if="getUserAtPosition(4)" :name="getUserAtPosition(4)!.name" size="sm" />
                    </div>
                    <AnswerBox
                        :onPress="() => {}"
                        :rotate="180"
                        :lightOn="isHotSeat(4)"
                    />
                </div>
            </div>

            <div class="flex-col flex items-center justify-center gap-2 py-8">
                <GameClock :time="displayClock.time" :mode="displayClock.mode"/>
                <Button @click="handleStartBuzzPhase" >
                    Start Buzz Phase
                </Button>
            </div>

            <div class="grid grid-cols-4 gap-x-16 gap-y-8 max-w-4xl">
                <!-- Position 5 -->
                <div v-if="isPositionAvailable(5)" class="flex flex-col items-center gap-4">
                    <AnswerBox
                        :onPress="() => {}"
                        :lightOn="isHotSeat(5)"
                    />
                    <div class="h-8">
                        <ProfilePicture v-if="getUserAtPosition(5)" :name="getUserAtPosition(5)!.name" size="sm" />
                    </div>
                </div>

                <!-- Position 6 -->
                <div v-if="isPositionAvailable(6)" class="flex flex-col items-center gap-4">
                    <AnswerBox
                        :onPress="() => {}"
                        :lightOn="isHotSeat(6)"
                    />
                    <div class="h-8">
                        <ProfilePicture v-if="getUserAtPosition(6)" :name="getUserAtPosition(6)!.name" size="sm" />
                    </div>
                </div>

                <!-- Position 7 -->
                <div v-if="isPositionAvailable(7)" class="flex flex-col items-center gap-4">
                    <AnswerBox
                        :onPress="() => {}"
                        :lightOn="isHotSeat(7)"
                    />
                    <div class="h-8">
                        <ProfilePicture v-if="getUserAtPosition(7)" :name="getUserAtPosition(7)!.name" size="sm" />
                    </div>
                </div>

                <!-- Position 8 -->
                <div v-if="isPositionAvailable(8)" class="flex flex-col items-center gap-4">
                    <AnswerBox
                        :onPress="() => {}"
                        :lightOn="isHotSeat(8)"
                    />
                    <div class="h-8">
                        <ProfilePicture v-if="getUserAtPosition(8)" :name="getUserAtPosition(8)!.name" size="sm" />
                    </div>
                </div>
            </div>
        </div>
        <div v-else>
            <h1 class="text-4xl font-bold mb-8">Game Page</h1>
            <GameClock :time="displayClock.time" :mode="displayClock.mode"/>
            <AnswerBox :width="360" :height="360" :rotate="0" :onPress="handleAnswerBoxPress"/>
        </div>
    </template>
</template>
