import { Server as Engine } from "@socket.io/bun-engine";
import { Server } from "socket.io";


type User = {
    socketId: String;
    name: String;
    position?: number | null;
    isAdmin?: boolean;
}

type GameState = {
    users: User[];
    adminSocketId?: String;
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

let gameState: GameState = {users: []}

const updateGameState = (gameState: GameState) => {
    io.emit("updateGameState", gameState);
}

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("new_user_connection", (userName: String) => {
        console.log("User connection event received:", userName);
        io.emit("user_connected", userName);

        if (gameState.users.length >= 8) {
            socket.emit("error", "Too many users in game");
            return;
        }

        // First user becomes the admin (lobby creator)
        const isFirstUser = gameState.users.length === 0;
        const newUser: User = {
            name: userName,
            socketId: socket.id,
            isAdmin: isFirstUser
        }

        if (isFirstUser) {
            gameState.adminSocketId = socket.id;
            console.log(`${userName} is now the lobby admin`);
        }

        gameState.users.push(newUser);

        // Send admin status to the connecting user
        socket.emit("admin_status", isFirstUser);

        updateGameState(gameState);
    });

    socket.on("position_selected", (boxNumber: number) => {
        const user = gameState.users.find((u) => u.socketId === socket.id);

        if (user) {
            user.position = boxNumber;
            console.log(`${user.name} selected position ${boxNumber}`);
        } else {
            console.warn(`User with socket ID ${socket.id} not found`);
        }

        updateGameState(gameState);
    });


    socket.on("disconnect", () => {
        const disconnectingUser = gameState.users.find((user) => user.socketId === socket.id);
        const wasAdmin = disconnectingUser?.isAdmin;

        gameState.users = gameState.users.filter((user) => user.socketId !== socket.id);

        // If admin disconnects, promote the next user to admin
        if (wasAdmin && gameState.users.length > 0) {
            gameState.users[0].isAdmin = true;
            gameState.adminSocketId = gameState.users[0].socketId;
            console.log(`${gameState.users[0].name} is now the lobby admin`);

            // Notify the new admin
            io.to(gameState.users[0].socketId.toString()).emit("admin_status", true);
        } else if (gameState.users.length === 0) {
            // Reset admin if lobby is empty
            gameState.adminSocketId = undefined;
        }

        updateGameState(gameState);
    })
});



export default {
  port: 3000,
  idleTimeout: 30, // must be greater than the "pingInterval" option of the engine, which defaults to 25 seconds

  ...engine.handler(),
};
