import { Server as Engine } from "@socket.io/bun-engine";
import { Server } from "socket.io";


type User = {
    socketId: String;
    name: String;
    position?: number | null;
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

let gameState: GameState = {users: []}

const updateGameState = (gameState: GameState) => {
    io.emit("updateGameState", gameState);
}

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("new_user_connection", (userName: String) => {
        console.log("User connection event received:", userName);
        io.emit("user_connected", userName);
        const newUser: User = {name: userName, socketId: socket.id}

        if (gameState.users.length >= 8) {
            socket.emit("error", "Too many users in game");
            return;
        }
        gameState.users.push(newUser);
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
        gameState.users = gameState.users.filter((user) => user.socketId !== socket.id);
        updateGameState(gameState);
    })
});



export default {
  port: 3000,
  idleTimeout: 30, // must be greater than the "pingInterval" option of the engine, which defaults to 25 seconds

  ...engine.handler(),
};
