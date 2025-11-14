import { Room, Message, UserInRoom } from "@shared/schema";
import dotenv from "dotenv";

dotenv.config();

// Hidden secret room values (not visible in GitHub because from .env)
const hiddenKey = (process.env.SPECIAL_KEY_1 || "").toUpperCase();
const hiddenPass = process.env.SPECIAL_KEY_2 || "";

// Temporary room inactivity timeout (30 minutes)
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

  /**
   * Validate password (ONLY for protected hidden room)
   */
  validatePassword(code: string, pass?: string): boolean {
    if (code !== hiddenKey) return true; // Normal rooms need no password
    return pass === hiddenPass;
  }

  /**
   * Generate random 6-character room code
   * Hidden room code is never generated.
   */
  generateRoomCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Avoid collisions + avoid generating secret room key
    if (this.rooms.has(code) || code === hiddenKey) {
      return this.generateRoomCode();
    }

    return code;
  }

  /**
   * Create a temporary auto-expiring room
   */
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

  /**
   * Get room info
   * Protected room returns a virtual room object (not stored)
   */
  getRoom(code: string): Room | undefined {
    if (code === hiddenKey) {
      return {
        code,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        users: [],
      };
    }

    return this.rooms.get(code)?.room;
  }

  getMessages(code: string): Message[] {
    if (code === hiddenKey) return []; // Never store protected messages
    return this.rooms.get(code)?.messages || [];
  }

  /**
   * Add user to room
   * Protected room NEVER stores user list
   */
  addUser(code: string, user: UserInRoom): boolean {
    if (code === hiddenKey) return true; // skip storing

    const data = this.rooms.get(code);
    if (!data) return false;

    if (!data.room.users.find((u) => u.id === user.id)) {
      data.room.users.push(user);
    }

    this.updateRoomActivity(code);
    return true;
  }

  removeUser(code: string, userId: string): UserInRoom | undefined {
    if (code === hiddenKey) return; // skip remove

    const data = this.rooms.get(code);
    if (!data) return;

    const idx = data.room.users.findIndex((u) => u.id === userId);
    if (idx === -1) return;

    const [removed] = data.room.users.splice(idx, 1);

    this.updateRoomActivity(code);

    if (data.room.users.length === 0) {
      this.deleteRoom(code);
    }

    return removed;
  }

  getUsers(code: string): UserInRoom[] {
    if (code === hiddenKey) return [];
    return this.rooms.get(code)?.room.users || [];
  }

  addMessage(code: string, message: Message): boolean {
    if (code === hiddenKey) return true; // do not store

    const data = this.rooms.get(code);
    if (!data) return false;

    data.messages.push(message);
    this.updateRoomActivity(code);
    return true;
  }

  /**
   * Update last activity and reset timeout
   */
  private updateRoomActivity(code: string) {
    if (code === hiddenKey) return;

    const data = this.rooms.get(code);
    if (!data) return;

    data.room.lastActivity = Date.now();

    clearTimeout(data.timeoutId);
    data.timeoutId = this.setRoomTimeout(code);
  }

  onRoomExpired(cb: RoomExpiredCallback) {
    this.onRoomExpiredCallbacks.push(cb);
  }

  /**
   * Set 30-minute timeout for room auto-deletion
   */
  private setRoomTimeout(code: string): NodeJS.Timeout {
    return setTimeout(() => {
      if (code === hiddenKey) return; // protected room never expires

      const data = this.rooms.get(code);
      if (data) {
        clearTimeout(data.timeoutId);
        this.rooms.delete(code);
      }

      this.onRoomExpiredCallbacks.forEach((cb) => cb(code));
      console.log(`Room ${code} expired.`);
    }, ROOM_INACTIVITY_TIMEOUT);
  }

  /**
   * Manual delete
   */
  deleteRoom(code: string) {
    if (code === hiddenKey) return; // cannot delete protected room

    const data = this.rooms.get(code);
    if (data) {
      clearTimeout(data.timeoutId);
      this.rooms.delete(code);
    }
    console.log(`Room deleted: ${code}`);
  }

  /**
   * Check existence
   */
  roomExists(code: string): boolean {
    if (code === hiddenKey) return true;
    return this.rooms.has(code);
  }

  /**
   * For debugging / admin tool
   */
  getActiveRooms(): string[] {
    return Array.from(this.rooms.keys());
  }
}

export const roomManager = new RoomManager();
