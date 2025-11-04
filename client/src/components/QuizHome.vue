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
const isAdmin = ref(false)
type ServerGameState = {
  users: Array<{
    name: string;
    socketId: string;
    position?: number | null;
    isAdmin?: boolean;
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

const isUserAdmin = (position: number) => {
  const user = getUserAtPosition(position);
  return user?.isAdmin || false;
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

const handleAdminStatus = (adminStatus: boolean) => {
  isAdmin.value = adminStatus;
  if (adminStatus) {
    toast.success("Lobby Admin", {
      description: "You are the lobby administrator!"
    });
  }
};

const socket = io('http://localhost:3000');

socket.on('connect', handleConnect);
socket.on('user_connected', handleNewUser);
socket.on('updateGameState', handleGameStateUpdate);
socket.on('connect_error', handleConnectError);
socket.on('admin_status', handleAdminStatus);
</script>

<template>
        <!-- Profile Picture in Top Right -->
        <div class="absolute top-4 right-4 flex items-center gap-3">
            <div class="flex items-center gap-2">
                <ProfilePicture :name="userName"  />
                <span v-if="isAdmin" class="text-yellow-400 font-semibold text-sm">👑 Admin</span>
            </div>
        </div>
    <div class="grid grid-cols-4 gap-x-16 gap-y-8 max-w-4xl">
      <!-- Row 1 -->
      <div class="flex flex-col items-center gap-4">
        <div class="h-8 flex items-center gap-1">
          <ProfilePicture v-if="getUserAtPosition(1)" :name="getUserAtPosition(1)!.name" size="sm" />
          <span v-if="isUserAdmin(1)" class="text-yellow-400 text-xs">👑</span>
        </div>
        <Button v-if="!isAdmin" @click="handleBoxSelection(1)" :disabled="!!getUserAtPosition(1)">
          Click to pick this spot
        </Button>
        <AnswerBox :onPress="() => { }" :rotate=180 />
      </div>

      <!-- Row 2 -->
      <div class="flex flex-col items-center gap-4">
        <div class="h-8 flex items-center gap-1">
          <ProfilePicture v-if="getUserAtPosition(2)" :name="getUserAtPosition(2)!.name" size="sm" />
          <span v-if="isUserAdmin(2)" class="text-yellow-400 text-xs">👑</span>
        </div>
        <Button v-if="!isAdmin" @click="handleBoxSelection(2)" :disabled="!!getUserAtPosition(2)">
          Click to pick this spot
        </Button>
        <AnswerBox :onPress="() => { }" :rotate=180 />
      </div>

      <div class="flex flex-col items-center gap-4">
        <div class="h-8 flex items-center gap-1">
          <ProfilePicture v-if="getUserAtPosition(3)" :name="getUserAtPosition(3)!.name" size="sm" />
          <span v-if="isUserAdmin(3)" class="text-yellow-400 text-xs">👑</span>
        </div>
        <Button v-if="!isAdmin" @click="handleBoxSelection(3)" :disabled="!!getUserAtPosition(3)">
          Click to pick this spot
        </Button>
        <AnswerBox :onPress="() => { }" :rotate=180 />
      </div>

      <div class="flex flex-col items-center gap-4">
        <div class="h-8 flex items-center gap-1">
          <ProfilePicture v-if="getUserAtPosition(4)" :name="getUserAtPosition(4)!.name" size="sm" />
          <span v-if="isUserAdmin(4)" class="text-yellow-400 text-xs">👑</span>
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
        <div class="h-8 flex items-center gap-1">
          <ProfilePicture v-if="getUserAtPosition(5)" :name="getUserAtPosition(5)!.name" size="sm" />
          <span v-if="isUserAdmin(5)" class="text-yellow-400 text-xs">👑</span>
        </div>
      </div>

      <div class="flex flex-col items-center gap-4">
        <AnswerBox :onPress="() => { }" />
        <Button v-if="!isAdmin" @click="handleBoxSelection(6)" :disabled="!!getUserAtPosition(6)">
          Click to pick this spot
        </Button>
        <div class="h-8 flex items-center gap-1">
          <ProfilePicture v-if="getUserAtPosition(6)" :name="getUserAtPosition(6)!.name" size="sm" />
          <span v-if="isUserAdmin(6)" class="text-yellow-400 text-xs">👑</span>
        </div>
      </div>

      <!-- Row 4 -->
      <div class="flex flex-col items-center gap-4">
        <AnswerBox :onPress="() => { }" />
        <Button v-if="!isAdmin" @click="handleBoxSelection(7)" :disabled="!!getUserAtPosition(7)">
          Click to pick this spot
        </Button>
        <div class="h-8 flex items-center gap-1">
          <ProfilePicture v-if="getUserAtPosition(7)" :name="getUserAtPosition(7)!.name" size="sm" />
          <span v-if="isUserAdmin(7)" class="text-yellow-400 text-xs">👑</span>
        </div>
      </div>

      <div class="flex flex-col items-center gap-4">
        <AnswerBox :onPress="() => { }" />
        <Button v-if="!isAdmin" @click="handleBoxSelection(8)" :disabled="!!getUserAtPosition(8)">
          Click to pick this spot
        </Button>
        <div class="h-8 flex items-center gap-1">
          <ProfilePicture v-if="getUserAtPosition(8)" :name="getUserAtPosition(8)!.name" size="sm" />
          <span v-if="isUserAdmin(8)" class="text-yellow-400 text-xs">👑</span>
        </div>
      </div>

    </div>
</template>
