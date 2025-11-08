import { ref } from 'vue'
import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

export function useSocket() {
    const isDev = process.env.NODE_ENV === "development";
    const url = isDev
        ? "http://localhost:3000"
        : process.env.API_URL!;

    console.log(isDev)

    if (!socketInstance) {
        socketInstance = io(url, {
            autoConnect: true
        });
    }

    const socket = ref(socketInstance);

    return { socket }
}

