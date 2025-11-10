import { Server as Engine } from "@socket.io/bun-engine";
import { Server } from "socket.io";
import type {Socket } from "socket.io";

const GAME_LENGTH = 600000
const BUZZ_LENGTH = 5000
const ANSWER_LENGTH = 5000
const USER_AMOUNT = 9 // Including admin

type User = {
    socketId: string;
    name: String;
    isAdmin: boolean;
    position?: number | null;
}


type Lobby = {
    gameState: 'lobby' | 'normal' | 'buzzTime' | 'answer';
    hotSeat? : number | null
    timeoutId?: NodeJS.Timeout| null;
    users: User[];
    lobbyCode: string;
    topSideBoxCount: number;    // Number of answer boxes on top side (1-4)
    bottomSideBoxCount: number; // Number of answer boxes on bottom side (1-4)
}

const corsConfig = process.env.NODE_ENV === 'production' 
  ? undefined 
  : {
      origin: ["http://localhost:5173", "http://localhost:4173", "http://localhost:3000"],
      methods: ["GET", "POST"],
      credentials: true
    };

const io = new Server({
  cors: corsConfig
});

const engine = new Engine({
  path: "/socket.io/",
  cors: corsConfig
});

io.bind(engine);


const generateLobbyCode = () => {
    return String(Math.floor(Math.random()*90000) + 10000);
}

const getLobbyCodeFromUser = (socketId: string) => {
    for (const [lobbyCode, lobby] of lobbies.entries()) {
        if (lobby.users.some(user => user.socketId === socketId)) {
            return lobbyCode;
        }
    }
}

const getLobbyForSocket = (socket: Socket): { lobby: Lobby; lobbyCode: string } | null => {
    const lobbyCode = getLobbyCodeFromUser(socket.id);
    if (!lobbyCode) {
        socket.emit("error", { message: "You are not in a lobby" });
        return null;
    }
    const lobby = lobbies.get(lobbyCode)!;
    return { lobby, lobbyCode };
}

const getCurrentUser = (lobby: Lobby, socketId: string): User | undefined => {
    return lobby.users.find(user => user.socketId === socketId);
}

const requireAdmin = (socket: Socket, lobby: Lobby): boolean => {
    const currentUser = getCurrentUser(lobby, socket.id);
    if (!currentUser?.isAdmin) {
        socket.emit("error", { message: "Only the admin can perform this action" });
        return false;
    }
    return true;
}

const broadcastGameState = (lobbyCode: string, lobby: Lobby) => {
    io.to(lobbyCode).emit("updateGameState", lobby);
}

const getValidPositions = (lobby: Lobby): number[] => {
    const positions: number[] = [];
    // Top side positions: 1, 2, 3, 4
    for (let i = 1; i <= lobby.topSideBoxCount; i++) {
        positions.push(i);
    }
    // Bottom side positions: 5, 6, 7, 8
    for (let i = 5; i < 5 + lobby.bottomSideBoxCount; i++) {
        positions.push(i);
    }
    return positions;
}

const getMaxUsers = (lobby: Lobby): number => {
    return lobby.topSideBoxCount + lobby.bottomSideBoxCount + 1; // +1 for admin
}

const clearLobbyTimeout = (lobby: Lobby) => {
    if (lobby.timeoutId) {
        clearTimeout(lobby.timeoutId);
        lobby.timeoutId = null;
    }
}

let lobbies = new Map<string, Lobby>(); 

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
            gameState: 'lobby',
            users: [adminUser],
            lobbyCode,
            topSideBoxCount: 4,    // Default to 4 boxes on top
            bottomSideBoxCount: 4, // Default to 4 boxes on bottom
        };

        lobbies.set(lobbyCode, lobby);
        socket.join(lobbyCode);

        console.log(`Lobby ${lobbyCode} created by ${userName}`);
        socket.emit("lobbyCreated", { lobbyCode, users: lobby.users });

        broadcastGameState(lobbyCode, lobby);
    });

    socket.on("joinLobby", (userName: string, lobbyCode: string) => {
        const lobby = lobbies.get(lobbyCode);

        if (!lobby) {
            socket.emit("error", { message: "Lobby not found" });
            return;
        }

        if (lobby.users.length >= getMaxUsers(lobby)) {
            socket.emit("error", { message: "Lobby is full" });
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
        broadcastGameState(lobbyCode, lobby);
    });



    socket.on("positionSelected", (position: number) => {
        const result = getLobbyForSocket(socket);
        if (!result) return;

        const { lobby, lobbyCode } = result;

        if (lobby.gameState !== 'lobby') {
            socket.emit("error", { message: "Cannot select position after game started" });
            return;
        }

        const validPositions = getValidPositions(lobby);
        if (!Number.isInteger(position) || !validPositions.includes(position)) {
            socket.emit("error", { message: "Invalid position" });
            return;
        }

        const isPositionTaken = lobby.users.some(user => user.position === position);
        if (isPositionTaken) {
            socket.emit("error", { message: "Position already taken" });
            return;
        }

        const user = getCurrentUser(lobby, socket.id);
        if (!user) {
            socket.emit("error", { message: "User not found in lobby" });
            return;
        }

        user.position = position;
        console.log(`User ${user.name} selected position ${position} in lobby ${lobbyCode}`);

        broadcastGameState(lobbyCode, lobby);
    });

    socket.on("startGame", () => {
        const result = getLobbyForSocket(socket);
        if (!result) return;

        const { lobby, lobbyCode } = result;

        if (!requireAdmin(socket, lobby)) return;

        if (lobby.gameState !== 'lobby') {
            socket.emit("error", { message: "Game already started" });
            return;
        }

        if (lobby.users.length < getMaxUsers(lobby)) {
            socket.emit("error", { message: "Not enough players in the lobby" });
            return;
        }

        const missingPositions = lobby.users.filter(
            (u) => !u.isAdmin && (u.position === null || u.position === undefined)
        );

        if (missingPositions.length > 0) {
            socket.emit("error", {
                message: `The following players haven't selected a position: ${missingPositions
.map((u) => u.name)
.join(", ")}`,
            });
            return;
        }

        lobby.gameState = 'normal';

        io.to(lobbyCode).emit("gameStarted", {
            message: "Game started successfully!",
            lobby,
        });

        setTimeout(() => {
            io.to(lobbyCode).emit("gameEnded");
        }, GAME_LENGTH)

        console.log(`Game started in lobby ${lobbyCode}`);
    });

    socket.on("connectedToGame", (callback) => {
        console.log("Client connected to game:", socket.id)
        const result = getLobbyForSocket(socket);
        if (!result) return;

        callback(result.lobby);
    })

    socket.on("startBuzzPhase", () => {
        const result = getLobbyForSocket(socket);
        if (!result) return;

        const { lobby, lobbyCode } = result;

        if (!requireAdmin(socket, lobby)) return;

        if (lobby.gameState !== 'normal') {
            socket.emit("error", { message: "Cannot start buzz phase in current state" });
            return;
        }

        lobby.gameState = 'buzzTime';
        broadcastGameState(lobbyCode, lobby);
        lobby.timeoutId = setTimeout(() => {
            lobby.gameState = 'normal';
            broadcastGameState(lobbyCode, lobby);
        }, BUZZ_LENGTH)
    })

    socket.on("buzz", () => {
        const result = getLobbyForSocket(socket);
        if (!result) return;

        const { lobby, lobbyCode } = result;

        if (lobby.gameState !== 'buzzTime') {
            socket.emit("error", { message: "Cannot buzz right now" });
            return
        }

        if (lobby.hotSeat !== null && lobby.hotSeat !== undefined) {
            socket.emit("error", { message: "Someone already buzzed" });
            return;
        }

        const currentUser = getCurrentUser(lobby, socket.id);
        if (!currentUser) {
            socket.emit("error", { message: "User not found in lobby" });
            return;
        }

        clearLobbyTimeout(lobby);

        lobby.gameState = 'answer';
        lobby.hotSeat = currentUser.position ?? null;

        broadcastGameState(lobbyCode, lobby);

        console.log(`User ${currentUser.name} buzzed in at position ${lobby.hotSeat}`);

        lobby.timeoutId = setTimeout(() => {
            lobby.gameState = 'normal';
            lobby.hotSeat = null;
            broadcastGameState(lobbyCode, lobby);
        }, ANSWER_LENGTH)
    })


    socket.on("updateBoxCounts", (topCount: number, bottomCount: number) => {
        const result = getLobbyForSocket(socket);
        if (!result) return;

        const { lobby, lobbyCode } = result;

        if (!requireAdmin(socket, lobby)) return;

        if (lobby.gameState !== 'lobby') {
            socket.emit("error", { message: "Cannot change box counts after game started" });
            return;
        }

        // Validate counts are within bounds
        if (!Number.isInteger(topCount) || topCount < 1 || topCount > 4) {
            socket.emit("error", { message: "Top side box count must be between 1 and 4" });
            return;
        }

        if (!Number.isInteger(bottomCount) || bottomCount < 1 || bottomCount > 4) {
            socket.emit("error", { message: "Bottom side box count must be between 1 and 4" });
            return;
        }

        lobby.topSideBoxCount = topCount;
        lobby.bottomSideBoxCount = bottomCount;

        // Clear positions that are no longer valid
        const validPositions = getValidPositions(lobby);
        lobby.users.forEach(user => {
            if (user.position && !validPositions.includes(user.position)) {
                user.position = null;
            }
        });

        // Remove users that exceed the new max
        const maxUsers = getMaxUsers(lobby);
        if (lobby.users.length > maxUsers) {
            // Keep admin and first (maxUsers-1) non-admin users
            const nonAdminUsers = lobby.users.filter(u => !u.isAdmin);
            const usersToRemove = nonAdminUsers.slice(maxUsers - 1);

            usersToRemove.forEach(user => {
                const userSocket = io.sockets.sockets.get(user.socketId);
                if (userSocket) {
                    userSocket.emit("error", { message: "You were removed from lobby due to box count change" });
                    userSocket.leave(lobbyCode);
                }
            });

            lobby.users = [
                ...lobby.users.filter(u => u.isAdmin),
                ...nonAdminUsers.slice(0, maxUsers - 1)
            ];
        }

        console.log(`Lobby ${lobbyCode} box counts updated: top=${topCount}, bottom=${bottomCount}`);
        broadcastGameState(lobbyCode, lobby);
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);

        for (const [lobbyCode, lobby] of lobbies.entries()) {
            const userIndex = lobby.users.findIndex(user => user.socketId === socket.id);
            if (userIndex !== -1) {
                const user = lobby.users[userIndex];
                lobby.users.splice(userIndex, 1);
                console.log(`User ${user.name} removed from lobby ${lobbyCode}`);

                clearLobbyTimeout(lobby);

                if (lobby.users.length === 0) {
                    lobbies.delete(lobbyCode);
                    console.log(`Lobby ${lobbyCode} deleted (empty)`);
                } else {
                    broadcastGameState(lobbyCode, lobby);
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
