import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { roomManager } from "./roomManager";
import { UserInRoom, Message } from "@shared/schema";
import dotenv from "dotenv";

dotenv.config();

// Hidden secret room credentials
const HIDDEN_ROOM_CODE = (process.env.SPECIAL_KEY_1 || "").toUpperCase();
const HIDDEN_ROOM_PASS = (process.env.SPECIAL_KEY_2 || "").trim();

// Map socket → user data
const socketToUser = new Map<
  string,
  { userId: string; roomCode: string; user: UserInRoom }
>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Public endpoint: create temporary room
  app.post("/api/create-room", (req, res) => {
    try {
      const roomCode = roomManager.createRoom();
      res.json({ roomCode });
    } catch (error) {
      res.status(500).json({ error: "Failed to create room" });
    }
  });

  const httpServer = createServer(app);

  const io = new SocketIOServer(httpServer, {
    path: "/ws/socket.io",
    cors: { origin: "*", methods: ["GET", "POST"] }
  });

  // Auto-expire old rooms
  roomManager.onRoomExpired((roomCode) => {
    io.to(roomCode).emit("room-expired");
    io.in(roomCode).disconnectSockets();
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // JOIN ROOM
    socket.on("join-room", (data) => {
      try {
        const roomCode = String(data?.roomCode || "").toUpperCase();
        const user = data?.user;

        // ❗ THIS IS THE CRITICAL FIX
        const password = data?.password;  // <--- MUST MATCH CLIENT

        if (!roomCode || !user) {
          socket.emit("error", { message: "Invalid join request" });
          return;
        }

        // Private hidden room
        if (roomCode === HIDDEN_ROOM_CODE) {
          if (!password || password.trim() !== HIDDEN_ROOM_PASS) {
            socket.emit("invalid-password");
            return;
          }
        }

        // Normal rooms
        if (!roomManager.roomExists(roomCode)) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        if (!roomManager.addUser(roomCode, user)) {
          socket.emit("error", { message: "Failed to join room" });
          return;
        }

        socketToUser.set(socket.id, { userId: user.id, roomCode, user });
        socket.join(roomCode);

        const messages = roomManager.getMessages(roomCode);
        const users = roomManager.getUsers(roomCode);

        socket.emit("joined", { users, messages });

        socket.to(roomCode).emit("user-joined", {
          username: user.username,
          users
        });

        if (roomCode === HIDDEN_ROOM_CODE) {
          console.log("[Hidden room] user joined.");
        } else {
          console.log(`User ${user.username} joined ${roomCode}`);
        }

      } catch (err) {
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    // SEND MESSAGE
    socket.on("send-message", (data) => {
      const userInfo = socketToUser.get(socket.id);
      if (!userInfo) return;

      const { roomCode, content } = data;
      if (!content?.trim() || roomCode !== userInfo.roomCode) return;

      const msg: Message = {
        id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
        roomCode,
        userId: userInfo.userId,
        username: userInfo.user.username,
        userColor: userInfo.user.color,
        content: content.trim(),
        timestamp: Date.now(),
        type: "user"
      };

      roomManager.addMessage(roomCode, msg);
      io.to(roomCode).emit("receive-message", { message: msg });
    });

    // TYPING
    socket.on("typing", (data) => {
      const userInfo = socketToUser.get(socket.id);
      if (!userInfo || userInfo.roomCode !== data.roomCode) return;

      socket.to(data.roomCode).emit("typing", {
        userId: userInfo.userId,
        username: userInfo.user.username
      });
    });

    socket.on("stop-typing", (data) => {
      const userInfo = socketToUser.get(socket.id);
      if (!userInfo || userInfo.roomCode !== data.roomCode) return;

      socket.to(data.roomCode).emit("stop-typing", {
        userId: userInfo.userId,
        username: userInfo.user.username
      });
    });

    // DISCONNECT
    socket.on("disconnect", () => {
      const info = socketToUser.get(socket.id);
      if (!info) return;

      const { roomCode, userId, user } = info;

      roomManager.removeUser(roomCode, userId);

      const users = roomManager.getUsers(roomCode);

      socket.to(roomCode).emit("user-left", {
        username: user.username,
        users
      });

      socketToUser.delete(socket.id);
    });
  });

  return httpServer;
}
