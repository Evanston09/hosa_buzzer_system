import { Server as Engine } from "@socket.io/bun-engine";
import { Server } from "socket.io";


type User = {
    socketId: string;
    name: string;
    position?: number | null;
    isAdmin?: boolean;
}

type Lobby = {
    id: string;
    adminSocketId: string;
    users: User[];
    createdAt: Date;
    gameStarted: boolean;
}

type GameState = {
    users: User[];
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

// Store all active lobbies
const lobbies = new Map<string, Lobby>();

// Generate unique 6-character lobby code
const generateLobbyCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars
    let code = '';
    do {
        code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    } while (lobbies.has(code));
    return code;
}

const updateGameState = (lobbyId: string) => {
    const lobby = lobbies.get(lobbyId);
    if (lobby) {
        io.to(lobbyId).emit("updateGameState", {
            users: lobby.users,
            gameStarted: lobby.gameStarted
        });
    }
}

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    let currentLobbyId: string | null = null;

    // Create a new lobby
    socket.on("create_lobby", (userName: string, callback) => {
        console.log(`Creating lobby for user: ${userName}`);

        const lobbyId = generateLobbyCode();
        const newUser: User = {
            name: userName,
            socketId: socket.id,
            isAdmin: true
        };

        const lobby: Lobby = {
            id: lobbyId,
            adminSocketId: socket.id,
            users: [newUser],
            createdAt: new Date(),
            gameStarted: false
        };

        lobbies.set(lobbyId, lobby);
        socket.join(lobbyId);
        currentLobbyId = lobbyId;

        console.log(`Lobby created: ${lobbyId}, Admin: ${userName}`);

        callback({ success: true, lobbyId, isAdmin: true });
        updateGameState(lobbyId);
    });

    // Join an existing lobby
    socket.on("join_lobby", (data: { userName: string, lobbyId: string }, callback) => {
        console.log(`User ${data.userName} attempting to join lobby: ${data.lobbyId}`);

        const lobby = lobbies.get(data.lobbyId);

        if (!lobby) {
            callback({ success: false, error: "Lobby not found" });
            return;
        }

        if (lobby.users.length >= 8) {
            callback({ success: false, error: "Lobby is full" });
            return;
        }

        if (lobby.gameStarted) {
            callback({ success: false, error: "Game already started" });
            return;
        }

        const newUser: User = {
            name: data.userName,
            socketId: socket.id,
            isAdmin: false
        };

        lobby.users.push(newUser);
        socket.join(data.lobbyId);
        currentLobbyId = data.lobbyId;

        console.log(`User ${data.userName} joined lobby ${data.lobbyId}`);

        io.to(data.lobbyId).emit("user_joined", data.userName);
        callback({ success: true, lobbyId: data.lobbyId, isAdmin: false });
        updateGameState(data.lobbyId);
    });

    // Select a position
    socket.on("position_selected", (boxNumber: number) => {
        if (!currentLobbyId) return;

        const lobby = lobbies.get(currentLobbyId);
        if (!lobby) return;

        const user = lobby.users.find((u) => u.socketId === socket.id);

        if (user) {
            user.position = boxNumber;
            console.log(`${user.name} selected position ${boxNumber}`);
        } else {
            console.warn(`User with socket ID ${socket.id} not found`);
        }

        updateGameState(currentLobbyId);
    });

    // Start game (admin only)
    socket.on("start_game", () => {
        if (!currentLobbyId) return;

        const lobby = lobbies.get(currentLobbyId);
        if (!lobby) return;

        if (lobby.adminSocketId !== socket.id) {
            socket.emit("error", "Only the admin can start the game");
            return;
        }

        lobby.gameStarted = true;
        console.log(`Game started in lobby ${currentLobbyId}`);

        io.to(currentLobbyId).emit("game_started");
        updateGameState(currentLobbyId);
    });

    // Kick user (admin only)
    socket.on("kick_user", (socketIdToKick: string) => {
        if (!currentLobbyId) return;

        const lobby = lobbies.get(currentLobbyId);
        if (!lobby) return;

        if (lobby.adminSocketId !== socket.id) {
            socket.emit("error", "Only the admin can kick users");
            return;
        }

        const userToKick = lobby.users.find(u => u.socketId === socketIdToKick);
        if (!userToKick) return;

        lobby.users = lobby.users.filter((user) => user.socketId !== socketIdToKick);

        io.to(socketIdToKick).emit("kicked_from_lobby");
        io.sockets.sockets.get(socketIdToKick)?.leave(currentLobbyId);

        console.log(`User ${userToKick.name} kicked from lobby ${currentLobbyId}`);
        updateGameState(currentLobbyId);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
        if (!currentLobbyId) return;

        const lobby = lobbies.get(currentLobbyId);
        if (!lobby) return;

        // Remove user from lobby
        const userLeaving = lobby.users.find(u => u.socketId === socket.id);
        lobby.users = lobby.users.filter((user) => user.socketId !== socket.id);

        // If admin left, assign new admin or delete lobby
        if (lobby.adminSocketId === socket.id) {
            if (lobby.users.length > 0) {
                // Assign first user as new admin
                lobby.adminSocketId = lobby.users[0].socketId;
                lobby.users[0].isAdmin = true;
                console.log(`New admin assigned in lobby ${currentLobbyId}: ${lobby.users[0].name}`);
                io.to(currentLobbyId).emit("new_admin", lobby.users[0].socketId);
            } else {
                // Delete empty lobby
                lobbies.delete(currentLobbyId);
                console.log(`Lobby ${currentLobbyId} deleted (empty)`);
                return;
            }
        }

        if (userLeaving) {
            console.log(`User ${userLeaving.name} left lobby ${currentLobbyId}`);
        }

        updateGameState(currentLobbyId);
    });
});



export default {
  port: 3000,
  idleTimeout: 30, // must be greater than the "pingInterval" option of the engine, which defaults to 25 seconds

  ...engine.handler(),
};
