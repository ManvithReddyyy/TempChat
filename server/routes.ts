import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { roomManager } from "./roomManager";
import { UserInRoom, Message, USER_COLORS } from "@shared/schema";

// Map to track socket connections to users
const socketToUser = new Map<string, { userId: string; roomCode: string; user: UserInRoom }>();

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoint to create a new room
  app.post("/api/create-room", (req, res) => {
    try {
      const roomCode = roomManager.createRoom();
      res.json({ roomCode });
    } catch (error) {
      console.error("Error creating room:", error);
      res.status(500).json({ error: "Failed to create room" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // Initialize Socket.IO server on /ws path
  const io = new SocketIOServer(httpServer, {
    path: "/ws/socket.io",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Register room expiration handler
  roomManager.onRoomExpired((roomCode) => {
    console.log(`Notifying clients in room ${roomCode} about expiration`);
    io.to(roomCode).emit("room-expired");
    // Disconnect all sockets in the room
    io.in(roomCode).disconnectSockets();
  });

  // Socket.IO event handlers
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join-room", (data) => {
      try {
        const { roomCode, user } = data;

        if (!roomCode || !user) {
          socket.emit("error", { message: "Invalid join request" });
          return;
        }

        // Check if room exists or create it
        if (!roomManager.roomExists(roomCode)) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        // Add user to room
        const success = roomManager.addUser(roomCode, user);
        if (!success) {
          socket.emit("error", { message: "Failed to join room" });
          return;
        }

        // Store socket-user mapping
        socketToUser.set(socket.id, { userId: user.id, roomCode, user });

        // Join socket room
        socket.join(roomCode);

        // Send current room state to the joining user
        const messages = roomManager.getMessages(roomCode);
        const users = roomManager.getUsers(roomCode);
        socket.emit("joined", { users, messages });

        // Notify other users in the room
        socket.to(roomCode).emit("user-joined", {
          username: user.username,
          users,
        });

        console.log(`User ${user.username} joined room ${roomCode}`);
      } catch (error) {
        console.error("Error joining room:", error);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    socket.on("send-message", (data) => {
      try {
        const { roomCode, content } = data;
        const userInfo = socketToUser.get(socket.id);

        if (!userInfo || !content || content.trim().length === 0) {
          return;
        }

        if (userInfo.roomCode !== roomCode) {
          return;
        }

        // Create message
        const message: Message = {
          id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
          roomCode,
          userId: userInfo.userId,
          username: userInfo.user.username,
          userColor: userInfo.user.color,
          content: content.trim(),
          timestamp: Date.now(),
          type: "user",
        };

        // Add message to room
        const success = roomManager.addMessage(roomCode, message);
        if (!success) {
          return;
        }

        // Broadcast message to all users in the room (including sender)
        io.to(roomCode).emit("receive-message", { message });

        console.log(`Message sent in room ${roomCode} by ${userInfo.user.username}`);
      } catch (error) {
        console.error("Error sending message:", error);
      }
    });

    socket.on("typing", (data) => {
      try {
        const { roomCode } = data;
        const userInfo = socketToUser.get(socket.id);

        if (!userInfo || userInfo.roomCode !== roomCode) {
          return;
        }

        // Notify other users (not the sender)
        socket.to(roomCode).emit("typing", {
          userId: userInfo.userId,
          username: userInfo.user.username,
        });
      } catch (error) {
        console.error("Error handling typing event:", error);
      }
    });

    socket.on("stop-typing", (data) => {
      try {
        const { roomCode } = data;
        const userInfo = socketToUser.get(socket.id);

        if (!userInfo || userInfo.roomCode !== roomCode) {
          return;
        }

        // Notify other users (not the sender)
        socket.to(roomCode).emit("stop-typing", {
          userId: userInfo.userId,
          username: userInfo.user.username,
        });
      } catch (error) {
        console.error("Error handling stop-typing event:", error);
      }
    });

    socket.on("disconnect", () => {
      try {
        const userInfo = socketToUser.get(socket.id);
        if (!userInfo) {
          console.log("Client disconnected:", socket.id);
          return;
        }

        const { roomCode, userId, user } = userInfo;

        // Remove user from room
        roomManager.removeUser(roomCode, userId);

        // Get updated user list
        const users = roomManager.getUsers(roomCode);

        // Notify other users
        socket.to(roomCode).emit("user-left", {
          username: user.username,
          users,
        });

        // Clean up mapping
        socketToUser.delete(socket.id);

        console.log(`User ${user.username} left room ${roomCode}`);
      } catch (error) {
        console.error("Error handling disconnect:", error);
      }
    });
  });

  // Periodic cleanup of expired rooms (handled by room manager timeouts)
  // Additional cleanup every 5 minutes for safety
  setInterval(() => {
    const activeRooms = roomManager.getActiveRooms();
    console.log(`Active rooms: ${activeRooms.length}`);
  }, 5 * 60 * 1000);

  return httpServer;
}
