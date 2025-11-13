import { Room, Message, UserInRoom, USER_COLORS } from "@shared/schema";

// 30 minutes
const ROOM_INACTIVITY_TIMEOUT = 30 * 60 * 1000;

// Imported from the shop system
// If you moved this to its own module, import it instead.
export const permanentRooms = new Map<string, { purchasedAt: number }>();

interface RoomData {
  room: Room;
  messages: Message[];
  timeoutId: NodeJS.Timeout;
}

type RoomExpiredCallback = (roomCode: string) => void;

class RoomManager {
  private rooms: Map<string, RoomData> = new Map();
  private onRoomExpiredCallbacks: RoomExpiredCallback[] = [];

  // Generate random code
  generateRoomCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (this.rooms.has(code) || permanentRooms.has(code)) {
      return this.generateRoomCode();
    }
    return code;
  }

  // Create new temp room
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

  // Fetch room
  getRoom(code: string): Room | undefined {
    const d = this.rooms.get(code);
    return d?.room;
  }

  getMessages(code: string): Message[] {
    const d = this.rooms.get(code);
    return d?.messages || [];
  }

  // Add user
  addUser(code: string, user: UserInRoom): boolean {
    const d = this.rooms.get(code);
    if (!d) return false;

    // Skip duplicate users
    if (!d.room.users.find((u) => u.id === user.id)) {
      d.room.users.push(user);
    }

    this.updateRoomActivity(code);
    return true;
  }

  // Remove user
  removeUser(code: string, userId: string): UserInRoom | undefined {
    const d = this.rooms.get(code);
    if (!d) return;

    const idx = d.room.users.findIndex((u) => u.id === userId);
    if (idx === -1) return;

    const [removed] = d.room.users.splice(idx, 1);

    this.updateRoomActivity(code);

    // If temporary room AND empty → delete
    if (!permanentRooms.has(code) && d.room.users.length === 0) {
      this.deleteRoom(code);
    }

    return removed;
  }

  getUsers(code: string): UserInRoom[] {
    const d = this.rooms.get(code);
    return d?.room.users || [];
  }

  addMessage(code: string, message: Message): boolean {
    const d = this.rooms.get(code);
    if (!d) return false;

    d.messages.push(message);

    this.updateRoomActivity(code);

    return true;
  }

  // Update timestamp + reset timeout
  private updateRoomActivity(code: string) {
    const d = this.rooms.get(code);
    if (!d) return;

    d.room.lastActivity = Date.now();

    // Permanent rooms do NOT have timeouts
    if (permanentRooms.has(code)) {
      return;
    }

    clearTimeout(d.timeoutId);
    d.timeoutId = this.setRoomTimeout(code);
  }

  onRoomExpired(cb: RoomExpiredCallback) {
    this.onRoomExpiredCallbacks.push(cb);
  }

  // Auto delete after 30 min inactivity
  private setRoomTimeout(code: string): NodeJS.Timeout {
    return setTimeout(() => {
      // Permanent room → DO NOT DELETE
      if (permanentRooms.has(code)) {
        console.log(`Permanent room ${code} skipped expiration.`);
        return;
      }

      console.log(`Room ${code} expired due to inactivity`);

      const d = this.rooms.get(code);
      if (d) {
        clearTimeout(d.timeoutId);
        this.rooms.delete(code);
      }

      this.onRoomExpiredCallbacks.forEach((cb) => cb(code));
    }, ROOM_INACTIVITY_TIMEOUT);
  }

  // Manual delete (does nothing for permanent rooms)
  deleteRoom(code: string) {
    if (permanentRooms.has(code)) {
      console.log(`Room ${code} is permanent → NOT deleted.`);
      return;
    }

    const d = this.rooms.get(code);
    if (d) {
      clearTimeout(d.timeoutId);
      this.rooms.delete(code);
    }

    console.log(`Room deleted: ${code}`);
  }

  roomExists(code: string): boolean {
    return this.rooms.has(code) || permanentRooms.has(code);
  }

  getActiveRooms(): string[] {
    return Array.from(this.rooms.keys());
  }
}

export const roomManager = new RoomManager();
