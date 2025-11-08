import { ref } from 'vue'
import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

export function useSocket() {
    if (!socketInstance) {
        socketInstance = io('http://localhost:3000', {
            autoConnect: true
        });
    }

    const socket = ref(socketInstance);

    return { socket }
}

