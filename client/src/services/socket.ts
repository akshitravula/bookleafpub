import { io, Socket } from "socket.io-client";

const RAW_URL = (import.meta.env.VITE_API_URL as string | undefined) || "";
const SOCKET_URL = RAW_URL ? RAW_URL.replace(/\/api\/?$/, "") : "/";

class SocketClient {
  private socket: Socket | null = null;
  private isConnected = false;

  public connect(): Socket {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ["websocket", "polling"],
        autoConnect: true,
      });

      this.socket.on("connect", () => {
        this.isConnected = true;
        console.log("🟢 Connected to BookLeaf real-time WebSocket");
      });

      this.socket.on("disconnect", () => {
        this.isConnected = false;
        console.log("🔴 Disconnected from WebSocket");
      });
    }
    return this.socket;
  }

  public getSocket(): Socket {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  public joinAuthor(authorId: string) {
    this.getSocket().emit("join:author", authorId);
  }

  public joinAdmin() {
    this.getSocket().emit("join:admin");
  }

  public joinTicket(ticketId: string) {
    this.getSocket().emit("join:ticket", ticketId);
  }

  public leaveTicket(ticketId: string) {
    this.getSocket().emit("leave:ticket", ticketId);
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

export const socketClient = new SocketClient();
