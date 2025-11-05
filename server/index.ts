import { Server as Engine } from "@socket.io/bun-engine";
import { Server } from "socket.io";


type User = {
    socketId: string;
    name: string;
    isAdmin: boolean;
    position?: number | null;
};

type GamePhase = "idle" | "admin_trigger" | "player_response" | "completed";

type LobbyGameState = {
    masterTimerStartedAt: number | null;
    masterTimerEnd: number | null;
    phase: GamePhase;
    phaseEndsAt: number | null;
    triggeredBy: string | null;
    respondingPlayer: string | null;
};

type Lobby = {
    users: User[];
    lobbyCode: string;
    game: LobbyGameState;
};

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


const MASTER_TIMER_DURATION = 10 * 60 * 1000;
const PHASE_DURATION = 5 * 1000;

const generateLobbyCode = () => {
    return String(Math.floor(Math.random() * 90000) + 10000);
};

const createInitialGameState = (): LobbyGameState => ({
    masterTimerStartedAt: null,
    masterTimerEnd: null,
    phase: "idle",
    phaseEndsAt: null,
    triggeredBy: null,
    respondingPlayer: null,
});

const getLobbyCodeFromUser = (socketId: string) => {
    for (const [lobbyCode, lobby] of lobbies.entries()) {
        if (lobby.users.some(user => user.socketId === socketId)) {
            return lobbyCode;
            break;
        }
    }


}

const lobbies = new Map<string, Lobby>();

const createLobbySnapshot = (lobby: Lobby, serverTimestamp: number = Date.now()) => ({
    lobbyCode: lobby.lobbyCode,
    users: lobby.users,
    game: lobby.game,
    serverTimestamp,
});

const emitLobbyState = (lobbyCode: string, serverTimestamp?: number) => {
    const lobby = lobbies.get(lobbyCode);
    if (!lobby) {
        return;
    }

    io.to(lobbyCode).emit("updateGameState", createLobbySnapshot(lobby, serverTimestamp));
};

const updateLobbyTimers = (lobby: Lobby, currentTime: number) => {
    const { game } = lobby;
    let stateChanged = false;

    if (game.masterTimerEnd && currentTime >= game.masterTimerEnd) {
        if (game.phase !== "completed") {
            game.phase = "completed";
            game.phaseEndsAt = null;
            game.triggeredBy = null;
            game.respondingPlayer = null;
            stateChanged = true;
        }
    }

    if (game.phase === "admin_trigger" && game.phaseEndsAt && currentTime >= game.phaseEndsAt) {
        game.phase = "idle";
        game.phaseEndsAt = null;
        game.triggeredBy = null;
        stateChanged = true;
    }

    if (game.phase === "player_response" && game.phaseEndsAt && currentTime >= game.phaseEndsAt) {
        game.phase = "idle";
        game.phaseEndsAt = null;
        game.triggeredBy = null;
        game.respondingPlayer = null;
        stateChanged = true;
    }

    return stateChanged;
};

const TIMER_TICK_INTERVAL = 1000;

setInterval(() => {
    const currentTime = Date.now();

    lobbies.forEach((lobby, lobbyCode) => {
        const stateChanged = updateLobbyTimers(lobby, currentTime);

        if (lobby.game.masterTimerEnd || lobby.game.phase !== "idle" || stateChanged) {
            emitLobbyState(lobbyCode, currentTime);
        }
    });
}, TIMER_TICK_INTERVAL);

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
            game: createInitialGameState(),
        };

        lobbies.set(lobbyCode, lobby);
        socket.join(lobbyCode);

        console.log(`Lobby ${lobbyCode} created by ${userName}`);
        socket.emit("lobbyCreated", { lobbyCode, users: lobby.users });

        emitLobbyState(lobbyCode);
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
        emitLobbyState(lobbyCode);
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

            emitLobbyState(userLobbyCode);
        }
    });

    socket.on("startGame", () => {
        const userLobbyCode = getLobbyCodeFromUser(socket.id)

        if (!userLobbyCode) {
            socket.emit("error", { message: "You are not in a lobby" });
            return;
        }

        const lobby = lobbies.get(userLobbyCode)!;
        if (lobby.users.length < 8) {
            socket.emit("error", { message: "Not enough people in lobby" });
            return;
        }

        const currentUser = lobby.users.find(user => user.socketId === socket.id);

        if (!currentUser?.isAdmin) {
            socket.emit("error", { message: "Only the admin can start the game" });
            return;
        }

        const now = Date.now();

        if (lobby.game.masterTimerEnd && lobby.game.masterTimerEnd > now && lobby.game.phase !== "completed") {
            socket.emit("error", { message: "Game is already running" });
            return;
        }

        lobby.game.masterTimerStartedAt = now;
        lobby.game.masterTimerEnd = now + MASTER_TIMER_DURATION;
        lobby.game.phase = "idle";
        lobby.game.phaseEndsAt = null;
        lobby.game.triggeredBy = null;
        lobby.game.respondingPlayer = null;

        emitLobbyState(userLobbyCode);
    });

    socket.on("triggerWindow", () => {
        const userLobbyCode = getLobbyCodeFromUser(socket.id);

        if (!userLobbyCode) {
            socket.emit("error", { message: "You are not in a lobby" });
            return;
        }

        const lobby = lobbies.get(userLobbyCode)!;
        const currentUser = lobby.users.find(user => user.socketId === socket.id);
        const now = Date.now();

        if (!currentUser?.isAdmin) {
            socket.emit("error", { message: "Only the admin can trigger the timer" });
            return;
        }

        if (!lobby.game.masterTimerEnd || lobby.game.masterTimerEnd <= now) {
            socket.emit("error", { message: "Start the game before triggering" });
            return;
        }

        if (lobby.game.phase !== "idle") {
            socket.emit("error", { message: "A round is already in progress" });
            return;
        }

        lobby.game.phase = "admin_trigger";
        lobby.game.phaseEndsAt = now + PHASE_DURATION;
        lobby.game.triggeredBy = socket.id;
        lobby.game.respondingPlayer = null;

        emitLobbyState(userLobbyCode);
    });

    socket.on("playerBuzz", () => {
        const userLobbyCode = getLobbyCodeFromUser(socket.id);

        if (!userLobbyCode) {
            socket.emit("error", { message: "You are not in a lobby" });
            return;
        }

        const lobby = lobbies.get(userLobbyCode)!;
        const now = Date.now();

        if (lobby.game.phase !== "admin_trigger") {
            return;
        }

        if (lobby.game.phaseEndsAt && lobby.game.phaseEndsAt <= now) {
            return;
        }

        if (lobby.game.respondingPlayer) {
            return;
        }

        lobby.game.phase = "player_response";
        lobby.game.phaseEndsAt = now + PHASE_DURATION;
        lobby.game.respondingPlayer = socket.id;

        emitLobbyState(userLobbyCode);
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);

        // Remove user from their lobby
        for (const [lobbyCode, lobby] of lobbies.entries()) {
            const userIndex = lobby.users.findIndex(user => user.socketId === socket.id);
            if (userIndex !== -1) {
                const user = lobby.users[userIndex];
                lobby.users.splice(userIndex, 1);
                console.log(`User ${user.name} removed from lobby ${lobbyCode}`);

                if (lobby.game.triggeredBy === socket.id) {
                    lobby.game.phase = "idle";
                    lobby.game.phaseEndsAt = null;
                    lobby.game.triggeredBy = null;
                }

                if (lobby.game.respondingPlayer === socket.id) {
                    lobby.game.phase = "idle";
                    lobby.game.phaseEndsAt = null;
                    lobby.game.respondingPlayer = null;
                    lobby.game.triggeredBy = null;
                }

                // If lobby is empty, delete it
                if (lobby.users.length === 0) {
                    lobbies.delete(lobbyCode);
                    console.log(`Lobby ${lobbyCode} deleted (empty)`);
                } else {
                    // Broadcast updated game state to remaining users
                    emitLobbyState(lobbyCode);
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
