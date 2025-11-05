import { Server as Engine } from "@socket.io/bun-engine";
import { Server } from "socket.io";

// Game state enum
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
    masterTimeRemaining: number; // milliseconds remaining in 10-minute game
    countdownTimeRemaining: number; // milliseconds remaining in current 5-second countdown
    masterStartTime: number | null; // timestamp when master timer started
    countdownStartTime: number | null; // timestamp when countdown started
}

type Lobby = {
    users: User[];
    lobbyCode: string;
    gameState: GameState;
    timer: GameTimer;
    firstBuzzer: string | null; // socketId of player who buzzed first
}

const io = new Server({
  cors: {
    origin: "*", // In production, replace with your specific domain
    methods: ["GET", "POST"]
  }
});

const engine = new Engine({
  path: "/socket.io/",
  cors: {
    origin: "*", // In production, replace with your specific domain
    methods: ["GET", "POST"]
  }
});

io.bind(engine);


const generateLobbyCode = () => {
    return String(Math.floor(Math.random()*90000) + 10000);
}

const getLobbyCodeFromUser = (socketId: string) => {
    for (const [lobbyCode, lobby] of lobbies.entries()) {
        if (lobby.users.some(user => user.socketId === socketId)) {
            return lobbyCode;
            break;
        }
    }


}

let lobbies = new Map<string, Lobby>();

// Timer management
const MASTER_TIMER_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds
const COUNTDOWN_DURATION = 5 * 1000; // 5 seconds in milliseconds
const TIMER_BROADCAST_INTERVAL = 50; // Broadcast timer updates every 50ms

// Store interval IDs for each lobby
const lobbyTimerIntervals = new Map<string, NodeJS.Timeout>();

// Calculate remaining time based on server time
const calculateTimeRemaining = (startTime: number | null, duration: number): number => {
    if (!startTime) return duration;
    const elapsed = Date.now() - startTime;
    return Math.max(0, duration - elapsed);
}

// Broadcast timer updates to all clients in a lobby
const broadcastTimerUpdate = (lobbyCode: string) => {
    const lobby = lobbies.get(lobbyCode);
    if (!lobby) return;

    // Update timer values based on current server time
    if (lobby.timer.masterStartTime) {
        lobby.timer.masterTimeRemaining = calculateTimeRemaining(
            lobby.timer.masterStartTime,
            MASTER_TIMER_DURATION
        );

        // Check if master timer expired
        if (lobby.timer.masterTimeRemaining === 0) {
            lobby.gameState = GameState.GAME_OVER;
            stopLobbyTimer(lobbyCode);
        }
    }

    if (lobby.timer.countdownStartTime) {
        lobby.timer.countdownTimeRemaining = calculateTimeRemaining(
            lobby.timer.countdownStartTime,
            COUNTDOWN_DURATION
        );

        // Check if countdown expired
        if (lobby.timer.countdownTimeRemaining === 0) {
            handleCountdownExpired(lobbyCode);
        }
    }

    io.to(lobbyCode).emit("updateGameState", lobby);
}

// Start broadcasting timer updates for a lobby
const startLobbyTimer = (lobbyCode: string) => {
    // Clear any existing interval
    stopLobbyTimer(lobbyCode);

    const interval = setInterval(() => {
        broadcastTimerUpdate(lobbyCode);
    }, TIMER_BROADCAST_INTERVAL);

    lobbyTimerIntervals.set(lobbyCode, interval);
}

// Stop broadcasting timer updates for a lobby
const stopLobbyTimer = (lobbyCode: string) => {
    const interval = lobbyTimerIntervals.get(lobbyCode);
    if (interval) {
        clearInterval(interval);
        lobbyTimerIntervals.delete(lobbyCode);
    }
}

// Handle countdown expiration
const handleCountdownExpired = (lobbyCode: string) => {
    const lobby = lobbies.get(lobbyCode);
    if (!lobby) return;

    if (lobby.gameState === GameState.ADMIN_TRIGGERED) {
        // 5-second player window expired with no buzzes
        lobby.gameState = GameState.IDLE;
        lobby.timer.countdownStartTime = null;
        lobby.timer.countdownTimeRemaining = COUNTDOWN_DURATION;
    } else if (lobby.gameState === GameState.PLAYER_RESPONDED) {
        // 5-second display period after player buzzed is complete
        lobby.gameState = GameState.IDLE;
        lobby.firstBuzzer = null;
        lobby.timer.countdownStartTime = null;
        lobby.timer.countdownTimeRemaining = COUNTDOWN_DURATION;
    }

    io.to(lobbyCode).emit("updateGameState", lobby);
} 

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("createLobby", (userName: string) => {
        const lobbyCode = generateLobbyCode();

        const adminUser: User = {
            socketId: socket.id,
            name: userName,
            isAdmin: true,
            position: null,
        };

        const lobby: Lobby = {
            users: [adminUser],
            lobbyCode,
            gameState: GameState.LOBBY,
            timer: {
                masterTimeRemaining: MASTER_TIMER_DURATION,
                countdownTimeRemaining: COUNTDOWN_DURATION,
                masterStartTime: null,
                countdownStartTime: null,
            },
            firstBuzzer: null,
        };

        lobbies.set(lobbyCode, lobby);
        socket.join(lobbyCode);

        console.log(`Lobby ${lobbyCode} created by ${userName}`);
        socket.emit("lobbyCreated", { lobbyCode, users: lobby.users });

        io.to(lobbyCode).emit("updateGameState", lobbies.get(lobbyCode))
    });

    socket.on("joinLobby", (userName: string, lobbyCode: string) => {
        const lobby = lobbies.get(lobbyCode);

        // Implement later
        if (!lobby) {
            return;
        }

        const user: User = {
            socketId: socket.id,
            name: userName,
            isAdmin: false,
            position: null,
        };

        lobby.users.push(user);

        socket.join(lobbyCode);

        console.log(`Lobby ${lobbyCode} joined by ${userName}`);
        io.to(lobbyCode).emit("updateGameState", lobbies.get(lobbyCode))
    });



    socket.on("positionSelected", (position: number) => {
        
        const userLobbyCode = getLobbyCodeFromUser(socket.id)

        if (!userLobbyCode) {
            socket.emit("error", { message: "You are not in a lobby" });
            return;
        }

        const lobby = lobbies.get(userLobbyCode)!;

        const isPositionTaken = lobby.users.some(user => user.position === position);
        if (isPositionTaken) {
            socket.emit("error", { message: "Position already taken" });
            return;
        }

        // Update the user's position
        const user = lobby.users.find(user => user.socketId === socket.id);
        if (user) {
            user.position = position;
            console.log(`User ${user.name} selected position ${position} in lobby ${userLobbyCode}`);

            io.to(userLobbyCode).emit("updateGameState", lobby);
        }
    });

    socket.on("startGame", () => {
        const userLobbyCode = getLobbyCodeFromUser(socket.id)

        if (!userLobbyCode) {
            socket.emit("error", { message: "You are not in a lobby" });
            return;
        }

        const lobby = lobbies.get(userLobbyCode)!;

        // Check if user is admin
        const user = lobby.users.find(u => u.socketId === socket.id);
        if (!user?.isAdmin) {
            socket.emit("error", { message: "Only admin can start the game" });
            return;
        }

        // Validate minimum players (at least 2 for testing, can be adjusted)
        if (lobby.users.length < 2) {
            socket.emit("error", { message: "Not enough players to start" });
            return;
        }

        // Start the master timer
        lobby.gameState = GameState.IDLE;
        lobby.timer.masterStartTime = Date.now();
        lobby.timer.masterTimeRemaining = MASTER_TIMER_DURATION;

        console.log(`Game started in lobby ${userLobbyCode}`);

        // Start broadcasting timer updates
        startLobbyTimer(userLobbyCode);

        io.to(userLobbyCode).emit("updateGameState", lobby);
    })

    socket.on("adminTrigger", () => {
        const userLobbyCode = getLobbyCodeFromUser(socket.id)

        if (!userLobbyCode) {
            socket.emit("error", { message: "You are not in a lobby" });
            return;
        }

        const lobby = lobbies.get(userLobbyCode)!;

        // Check if user is admin
        const user = lobby.users.find(u => u.socketId === socket.id);
        if (!user?.isAdmin) {
            socket.emit("error", { message: "Only admin can trigger countdown" });
            return;
        }

        // Only allow trigger in IDLE state
        if (lobby.gameState !== GameState.IDLE) {
            socket.emit("error", { message: "Cannot trigger countdown in current state" });
            return;
        }

        // Start the 5-second countdown for players to buzz
        lobby.gameState = GameState.ADMIN_TRIGGERED;
        lobby.timer.countdownStartTime = Date.now();
        lobby.timer.countdownTimeRemaining = COUNTDOWN_DURATION;
        lobby.firstBuzzer = null;

        console.log(`Admin triggered countdown in lobby ${userLobbyCode}`);

        io.to(userLobbyCode).emit("updateGameState", lobby);
    })

    socket.on("playerBuzz", () => {
        const userLobbyCode = getLobbyCodeFromUser(socket.id)

        if (!userLobbyCode) {
            socket.emit("error", { message: "You are not in a lobby" });
            return;
        }

        const lobby = lobbies.get(userLobbyCode)!;

        // Only allow buzzing during ADMIN_TRIGGERED state
        if (lobby.gameState !== GameState.ADMIN_TRIGGERED) {
            socket.emit("error", { message: "Cannot buzz in current state" });
            return;
        }

        // Only count the first buzzer
        if (lobby.firstBuzzer !== null) {
            return; // Ignore subsequent buzzes
        }

        // Record first buzzer
        lobby.firstBuzzer = socket.id;
        lobby.gameState = GameState.PLAYER_RESPONDED;
        lobby.timer.countdownStartTime = Date.now(); // Start 5-second display timer
        lobby.timer.countdownTimeRemaining = COUNTDOWN_DURATION;

        const user = lobby.users.find(u => u.socketId === socket.id);
        console.log(`Player ${user?.name} buzzed first in lobby ${userLobbyCode}`);

        io.to(userLobbyCode).emit("updateGameState", lobby);
    })

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);

        // Remove user from their lobby
        for (const [lobbyCode, lobby] of lobbies.entries()) {
            const userIndex = lobby.users.findIndex(user => user.socketId === socket.id);
            if (userIndex !== -1) {
                const user = lobby.users[userIndex];
                lobby.users.splice(userIndex, 1);
                console.log(`User ${user.name} removed from lobby ${lobbyCode}`);

                // If lobby is empty, delete it
                if (lobby.users.length === 0) {
                    lobbies.delete(lobbyCode);
                    stopLobbyTimer(lobbyCode); // Clean up timer interval
                    console.log(`Lobby ${lobbyCode} deleted (empty)`);
                } else {
                    // Broadcast updated game state to remaining users
                    io.to(lobbyCode).emit("updateGameState", lobby);
                }
                break;
            }
        }
    })
});



export default {
  port: 3000,
  idleTimeout: 30, // must be greater than the "pingInterval" option of the engine, which defaults to 25 seconds

  ...engine.handler(),
};
