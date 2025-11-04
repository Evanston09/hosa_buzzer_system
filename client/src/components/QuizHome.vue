<script setup lang="ts">
import { useRoute } from 'vue-router'
import AnswerBox from './AnswerBox.vue'
import ProfilePicture from './ProfilePicture.vue'
import { Button } from '@/components/ui/button'
import { computed, onUnmounted, ref } from 'vue'
import { toast } from 'vue-sonner';
import { io } from 'socket.io-client'

const route = useRoute()
const userName = computed(() => route.query.name as string || 'Guest')
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

const handleGameStateUpdate = (state: ServerGameState) => {
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
        <Button @click="handleBoxSelection(1)">
          Click to pick this spot
        </Button>
        <AnswerBox :onPress="() => { }" :rotate=180 />
      </div>

      <!-- Row 2 -->
      <div class="flex flex-col items-center gap-4">
        <Button @click="handleBoxSelection(2)">
          Click to pick this spot
        </Button>
        <AnswerBox :onPress="() => { }" :rotate=180 />
      </div>

      <div class="flex flex-col items-center gap-4">
        <Button @click="handleBoxSelection(3)">
          Click to pick this spot
        </Button>
        <AnswerBox :onPress="() => { }" :rotate=180 />
      </div>

      <div class="flex flex-col items-center gap-4">
        <Button @click="handleBoxSelection(4)">
          Click to pick this spot
        </Button>
        <AnswerBox :onPress="() => { }" :rotate=180 />
      </div>

    </div>
    <!-- Center Text -->
    <div class="col-span-2 flex items-center justify-center py-8">
      <p class="text-xl text-white/90 text-center">
        Click a button to select your answer box position
      </p>
    </div>

    <div class="grid grid-cols-4 gap-x-16 gap-y-8 max-w-4xl">
      <!-- Row 3 -->
      <div class="flex flex-col items-center gap-4">
        <AnswerBox :onPress="() => { }" />
        <Button @click="handleBoxSelection(5)">
          Click to pick this spot
        </Button>
      </div>

      <div class="flex flex-col items-center gap-4">
        <AnswerBox :onPress="() => { }" />
        <Button @click="handleBoxSelection(6)">
          Click to pick this spot
        </Button>
      </div>

      <!-- Row 4 -->
      <div class="flex flex-col items-center gap-4">
        <AnswerBox :onPress="() => { }" />
        <Button @click="handleBoxSelection(7)">
          Click to pick this spot
        </Button>
      </div>

      <div class="flex flex-col items-center gap-4">
        <AnswerBox :onPress="() => { }" />
        <Button @click="handleBoxSelection(8)">
          Click to pick this spot
        </Button>
      </div>

    </div>
</template>
