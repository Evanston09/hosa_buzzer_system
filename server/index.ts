import { Server as Engine } from "@socket.io/bun-engine";
import { Server } from "socket.io";


type User = {
    socketId: String;
    name: String;
    isAdmin: boolean
    position?: number | null;
}

type Lobby = {
    users: User[];
    lobbyCode: string;
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
        if (lobby.users.length < 8) {
            socket.emit("error", { message: "Not enough people in lobby" });
        }
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
