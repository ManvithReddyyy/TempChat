import { Room, Message, UserInRoom } from "@shared/schema";
import dotenv from "dotenv";

dotenv.config();

// Hidden secret room values
const hiddenKey = process.env.SPECIAL_KEY_1 || "";
const hiddenPass = process.env.SPECIAL_KEY_2 || "";

// 30 minutes timeout
const ROOM_INACTIVITY_TIMEOUT = 30 * 60 * 1000;

interface RoomData {
  room: Room;
  messages: Message[];
  timeoutId: NodeJS.Timeout;
}

type RoomExpiredCallback = (roomCode: string) => void;

class RoomManager {
  private rooms: Map<string, RoomData> = new Map();
  private onRoomExpiredCallbacks: RoomExpiredCallback[] = [];

  constructor() {
    if (hiddenKey) {
      console.log("Loaded protected room");
    }
  }

  // Password check ONLY for hidden room
  validatePassword(code: string, pass?: string): boolean {
    if (code !== hiddenKey) return true; // normal rooms don't need password
    return pass === hiddenPass;
  }

  generateRoomCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    if (this.rooms.has(code) || code === hiddenKey) {
      return this.generateRoomCode();
    }

    return code;
  }

  createRoom(): string {
    const code = this.generateRoomCode();
    const now = Date.now();

    const room: Room = {
      code,
      createdAt: now,
      lastActivity: now,
      users: [],
    };

    const timeoutId = this.setRoomTimeout(code);

    this.rooms.set(code, {
      room,
      messages: [],
      timeoutId,
    });

    console.log(`Room created: ${code}`);
    return code;
  }

  // Virtual room for hidden key
  getRoom(code: string): Room | undefined {
    if (code === hiddenKey) {
      return {
        code,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        users: [],
      };
    }

    const d = this.rooms.get(code);
    return d?.room;
  }

  getMessages(code: string): Message[] {
    const d = this.rooms.get(code);
    return d?.messages || [];
  }

  addUser(code: string, user: UserInRoom): boolean {
    if (code === hiddenKey) return true; // don't store

    const d = this.rooms.get(code);
    if (!d) return false;

    if (!d.room.users.find((u) => u.id === user.id)) {
      d.room.users.push(user);
    }

    this.updateRoomActivity(code);
    return true;
  }

  removeUser(code: string, userId: string): UserInRoom | undefined {
    if (code === hiddenKey) return;

    const d = this.rooms.get(code);
    if (!d) return;

    const idx = d.room.users.findIndex((u) => u.id === userId);
    if (idx === -1) return;

    const [removed] = d.room.users.splice(idx, 1);

    this.updateRoomActivity(code);

    if (d.room.users.length === 0) {
      this.deleteRoom(code);
    }

    return removed;
  }

  getUsers(code: string): UserInRoom[] {
    if (code === hiddenKey) return [];
    const d = this.rooms.get(code);
    return d?.room.users || [];
  }

  addMessage(code: string, message: Message): boolean {
    if (code === hiddenKey) return true;

    const d = this.rooms.get(code);
    if (!d) return false;

    d.messages.push(message);
    this.updateRoomActivity(code);
    return true;
  }

  private updateRoomActivity(code: string) {
    if (code === hiddenKey) return;

    const d = this.rooms.get(code);
    if (!d) return;

    d.room.lastActivity = Date.now();

    clearTimeout(d.timeoutId);
    d.timeoutId = this.setRoomTimeout(code);
  }

  onRoomExpired(cb: RoomExpiredCallback) {
    this.onRoomExpiredCallbacks.push(cb);
  }

  private setRoomTimeout(code: string): NodeJS.Timeout {
    return setTimeout(() => {
      if (code === hiddenKey) return;

      console.log(`Room ${code} expired due to inactivity`);
      const d = this.rooms.get(code);
      if (d) {
        clearTimeout(d.timeoutId);
        this.rooms.delete(code);
      }

      this.onRoomExpiredCallbacks.forEach((cb) => cb(code));
    }, ROOM_INACTIVITY_TIMEOUT);
  }

  deleteRoom(code: string) {
    if (code === hiddenKey) return;

    const d = this.rooms.get(code);
    if (d) {
      clearTimeout(d.timeoutId);
      this.rooms.delete(code);
    }

    console.log(`Room deleted: ${code}`);
  }

  roomExists(code: string): boolean {
    if (code === hiddenKey) return true;
    return this.rooms.has(code);
  }

  getActiveRooms(): string[] {
    return Array.from(this.rooms.keys());
  }
}

export const roomManager = new RoomManager();
