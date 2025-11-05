import { Server as Engine } from "@socket.io/bun-engine";
import { Server } from "socket.io";


type User = {
    socketId: string;
    name: string;
    position?: number | null;
};

type Lobby = {
    code: string;
    adminSocketId: string;
    adminName: string;
    users: User[];
};

type GameState = {
    lobbyCode: string;
    admin: {
        socketId: string;
        name: string;
    };
    users: User[];
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

const lobbies = new Map<string, Lobby>();

const formatLobbyState = (lobby: Lobby): GameState => ({
    lobbyCode: lobby.code,
    admin: {
        socketId: lobby.adminSocketId,
        name: lobby.adminName,
    },
    users: lobby.users,
});

const updateLobbyState = (lobby: Lobby) => {
    io.to(lobby.code).emit("updateGameState", formatLobbyState(lobby));
};

const generateLobbyCode = () => {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    let code = "";
    do {
        code = Array.from({ length: 5 })
            .map(() => alphabet[Math.floor(Math.random() * alphabet.length)])
            .join("");
    } while (lobbies.has(code));
    return code;
};

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("create_lobby", (payload: { name: string }, callback) => {
        const { name } = payload;

        if (!name || typeof name !== "string") {
            callback?.({ success: false, error: "A name is required to create a lobby." });
            return;
        }

        const code = generateLobbyCode();
        const lobby: Lobby = {
            code,
            adminSocketId: socket.id,
            adminName: name,
            users: [],
        };

        const newUser: User = { socketId: socket.id, name, position: null };
        lobby.users.push(newUser);
        lobbies.set(code, lobby);

        socket.data.lobbyCode = code;
        socket.data.userName = name;
        socket.join(code);

        callback?.({ success: true, lobbyCode: code, gameState: formatLobbyState(lobby) });
        io.to(code).emit("user_connected", { name, lobbyCode: code });
        updateLobbyState(lobby);
    });

    socket.on(
        "join_lobby",
        (payload: { name: string; lobbyCode: string }, callback) => {
            const { name, lobbyCode } = payload;
            if (!name || typeof name !== "string") {
                callback?.({ success: false, error: "A name is required to join a lobby." });
                return;
            }

            if (!lobbyCode || typeof lobbyCode !== "string") {
                callback?.({ success: false, error: "Lobby code is required." });
                return;
            }

            const normalizedCode = lobbyCode.toUpperCase();
            const lobby = lobbies.get(normalizedCode);

            if (!lobby) {
                callback?.({ success: false, error: "Lobby not found." });
                return;
            }

            if (lobby.users.length >= 8) {
                callback?.({ success: false, error: "This lobby is full." });
                return;
            }

            if (lobby.users.find((user) => user.name.toLowerCase() === name.toLowerCase())) {
                callback?.({ success: false, error: "That display name is already taken in this lobby." });
                return;
            }

            const newUser: User = { socketId: socket.id, name, position: null };
            lobby.users.push(newUser);

            socket.data.lobbyCode = normalizedCode;
            socket.data.userName = name;
            socket.join(normalizedCode);

            callback?.({ success: true, lobbyCode: normalizedCode, gameState: formatLobbyState(lobby) });
            io.to(normalizedCode).emit("user_connected", { name, lobbyCode: normalizedCode });
            updateLobbyState(lobby);
        }
    );

    socket.on("position_selected", (boxNumber: number) => {
        const lobbyCode: string | undefined = socket.data.lobbyCode;
        if (!lobbyCode) {
            return;
        }

        const lobby = lobbies.get(lobbyCode);
        if (!lobby) {
            return;
        }

        const user = lobby.users.find((u) => u.socketId === socket.id);

        if (!user) {
            console.warn(`User with socket ID ${socket.id} not found in lobby ${lobbyCode}`);
            return;
        }

        const takenBy = lobby.users.find((u) => u.position === boxNumber && u.socketId !== socket.id);
        if (takenBy) {
            socket.emit("action_denied", "That position is already taken.");
            return;
        }

        user.position = boxNumber;
        console.log(`${user.name} selected position ${boxNumber} in lobby ${lobbyCode}`);

        updateLobbyState(lobby);
    });

    socket.on("start_game", () => {
        const lobbyCode: string | undefined = socket.data.lobbyCode;
        if (!lobbyCode) {
            return;
        }

        const lobby = lobbies.get(lobbyCode);
        if (!lobby) {
            return;
        }

        if (lobby.adminSocketId !== socket.id) {
            socket.emit("action_denied", "Only the lobby admin can start the game.");
            return;
        }

        io.to(lobby.code).emit("game_started");
        console.log(`Game started in lobby ${lobbyCode}`);
    });

    socket.on("disconnect", () => {
        const lobbyCode: string | undefined = socket.data.lobbyCode;
        if (!lobbyCode) {
            return;
        }

        const lobby = lobbies.get(lobbyCode);
        if (!lobby) {
            return;
        }

        lobby.users = lobby.users.filter((user) => user.socketId !== socket.id);

        if (lobby.adminSocketId === socket.id) {
            if (lobby.users.length === 0) {
                lobbies.delete(lobbyCode);
                return;
            }

            const newAdmin = lobby.users[0];
            lobby.adminSocketId = newAdmin.socketId;
            lobby.adminName = newAdmin.name;
            io.to(lobbyCode).emit("admin_changed", { name: newAdmin.name });
        }

        updateLobbyState(lobby);
    });
});



export default {
  port: 3000,
  idleTimeout: 30, // must be greater than the "pingInterval" option of the engine, which defaults to 25 seconds

  ...engine.handler(),
};
