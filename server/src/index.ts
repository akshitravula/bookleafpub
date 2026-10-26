import http from "http";
import dotenv from "dotenv";
dotenv.config();

import { app } from "./app";
import { socketService } from "./services/socket.service";

const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

const server = http.createServer(app);

// Initialize Socket.IO
socketService.init(server, CLIENT_ORIGIN);

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 BookLeaf Support API Server running on port ${PORT}`);
  console.log(`📄 Swagger OpenAPI Docs: http://localhost:${PORT}/api/docs`);
  console.log(`📡 WebSocket Real-time engine active`);
  console.log(`======================================================\n`);
});
