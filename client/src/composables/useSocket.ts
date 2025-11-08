import { ref } from 'vue'
import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

export function useSocket() {
    const isDev = import.meta.env.DEV;

    const url = isDev
        ? "http://localhost:3000"
        : import.meta.env.VITE_API_URL;
    console.log(import.meta.env.VITE_API_URL);

    console.log(isDev)

    if (!socketInstance) {
        socketInstance = io(url, {
            autoConnect: true
        });
    }

    const socket = ref(socketInstance);

    return { socket }
}

