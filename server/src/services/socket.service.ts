import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";

export class SocketService {
  private io: SocketIOServer | null = null;

  public init(httpServer: HttpServer, clientOrigin: string) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: [clientOrigin, "http://localhost:5173", "http://127.0.0.1:5173"],
        methods: ["GET", "POST", "PATCH", "PUT"],
        credentials: true,
      },
    });

    this.io.on("connection", (socket: Socket) => {
      // Authors join their private author room
      socket.on("join:author", (authorId: string) => {
        if (authorId) {
          socket.join(`author:${authorId}`);
        }
      });

      // Admins join the admin queue room
      socket.on("join:admin", () => {
        socket.join("admin_queue");
      });

      // Join a specific ticket room for active chat viewing
      socket.on("join:ticket", (ticketId: string) => {
        if (ticketId) {
          socket.join(`ticket:${ticketId}`);
        }
      });

      socket.on("leave:ticket", (ticketId: string) => {
        if (ticketId) {
          socket.leave(`ticket:${ticketId}`);
        }
      });
    });

    console.log("⚡ Real-time Socket.IO initialized");
  }

  public notifyTicketCreated(ticket: any) {
    if (!this.io) return;
    // Notify all admins watching the ticket queue
    this.io.to("admin_queue").emit("ticket:created", ticket);
    // Notify the author
    this.io.to(`author:${ticket.authorId}`).emit("ticket:created", ticket);
  }

  public notifyTicketUpdated(ticket: any) {
    if (!this.io) return;
    this.io.to("admin_queue").emit("ticket:updated", ticket);
    this.io.to(`author:${ticket.authorId}`).emit("ticket:updated", ticket);
    this.io.to(`ticket:${ticket.id}`).emit("ticket:updated", ticket);
  }

  public notifyNewMessage(ticketId: string, authorId: string, message: any) {
    if (!this.io) return;
    // Internal notes are only broadcast to admins
    if (message.isInternalNote) {
      this.io.to("admin_queue").emit("message:new", { ticketId, message });
      this.io.to(`ticket:${ticketId}`).emit("message:new", { ticketId, message });
    } else {
      // Normal messages go to both admin and author
      this.io.to("admin_queue").emit("message:new", { ticketId, message });
      this.io.to(`author:${authorId}`).emit("message:new", { ticketId, message });
      this.io.to(`ticket:${ticketId}`).emit("message:new", { ticketId, message });
    }
  }
}

export const socketService = new SocketService();
