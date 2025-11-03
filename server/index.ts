import { Server as Engine } from "@socket.io/bun-engine";
import { Server } from "socket.io";

const io = new Server();

const engine = new Engine({
  path: "/socket.io/",
});

io.bind(engine);

io.on("connection", (socket) => {
  // ...
});

export default {
  port: 3000,
  idleTimeout: 30, // must be greater than the "pingInterval" option of the engine, which defaults to 25 seconds

  ...engine.handler(),
};