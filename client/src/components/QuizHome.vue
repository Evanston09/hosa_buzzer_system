<script setup lang="ts">
import { useRoute } from 'vue-router'
import AnswerBox from './AnswerBox.vue'
import ProfilePicture from './ProfilePicture.vue'
import { Button } from '@/components/ui/button'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner';
import { io } from 'socket.io-client'

const route = useRoute()
const userName = computed(() => route.query.name as string || 'Guest')
const isAdmin = computed(() => userName.value === 'Admin')
type ServerGameState = {
  users: Array<{
    name: string;
    socketId: string;
    position?: number | null;
  }>
}


const handleBoxSelection = (boxNumber: number) => {
    socket.emit("position_selected", boxNumber);
}

const handleConnect = () => {
  socket.emit('new_user_connection', userName.value)
  toast.success("Connected to Server", {
    description: "You are now connected to the HOSA Bowl System"
  });
};

const handleNewUser = (userName: string) => {
  toast.info("New User", {
    description: userName
  });
};

const gameState = ref<ServerGameState>({ users: [] });

const handleGameStateUpdate = (state: ServerGameState) => {
  gameState.value = state;
};

const getUserAtPosition = (position: number) => {
  return gameState.value.users.find(user => user.position === position);
};

const handleStartGame = () => {
  // TODO: Implement start game functionality
  socket.emit('start_game');
  toast.success("Game Started", {
    description: "The game has been started!"
  });
};

const handleConnectError = () => {
    toast.error("Connection Failed", {
        description: "Unable to reach the HOSA Bowl server. Please try again."
    });
}

const socket = io('http://localhost:3000');

socket.on('connect', handleConnect);
socket.on('user_connected', handleNewUser);
socket.on('updateGameState', handleGameStateUpdate);
socket.on('connect_error', handleConnectError);
</script>

<template>
        <!-- Profile Picture in Top Right -->
        <div class="absolute top-4 right-4 flex items-center gap-3">
            <ProfilePicture :name="userName"  />
        </div>
    <div class="grid grid-cols-4 gap-x-16 gap-y-8 max-w-4xl">
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
</template>
