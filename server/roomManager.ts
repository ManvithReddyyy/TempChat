import { Room, Message, UserInRoom, USER_COLORS } from "@shared/schema";

// Room inactivity timeout (30 minutes)
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

  // Generate a random 6-digit room code
  generateRoomCode(): string {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    // Ensure uniqueness
    if (this.rooms.has(code)) {
      return this.generateRoomCode();
    }
    return code;
  }

  // Create a new room
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

  // Get room by code
  getRoom(code: string): Room | undefined {
    const roomData = this.rooms.get(code);
    return roomData?.room;
  }

  // Get messages for a room
  getMessages(code: string): Message[] {
    const roomData = this.rooms.get(code);
    return roomData?.messages || [];
  }

  // Add user to room
  addUser(code: string, user: UserInRoom): boolean {
    const roomData = this.rooms.get(code);
    if (!roomData) {
      return false;
    }

    // Check if user already exists
    const existingUser = roomData.room.users.find(u => u.id === user.id);
    if (!existingUser) {
      roomData.room.users.push(user);
    }

    this.updateRoomActivity(code);
    return true;
  }

  // Remove user from room
  removeUser(code: string, userId: string): UserInRoom | undefined {
    const roomData = this.rooms.get(code);
    if (!roomData) {
      return undefined;
    }

    const userIndex = roomData.room.users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return undefined;
    }

    const [removedUser] = roomData.room.users.splice(userIndex, 1);
    this.updateRoomActivity(code);

    // Delete room if no users left
    if (roomData.room.users.length === 0) {
      this.deleteRoom(code);
    }

    return removedUser;
  }

  // Get users in a room
  getUsers(code: string): UserInRoom[] {
    const roomData = this.rooms.get(code);
    return roomData?.room.users || [];
  }

  // Add message to room
  addMessage(code: string, message: Message): boolean {
    const roomData = this.rooms.get(code);
    if (!roomData) {
      return false;
    }

    roomData.messages.push(message);
    this.updateRoomActivity(code);
    return true;
  }

  // Update room activity timestamp and reset timeout
  private updateRoomActivity(code: string): void {
    const roomData = this.rooms.get(code);
    if (!roomData) {
      return;
    }

    roomData.room.lastActivity = Date.now();

    // Clear existing timeout
    clearTimeout(roomData.timeoutId);

    // Set new timeout
    roomData.timeoutId = this.setRoomTimeout(code);
  }

  // Register a callback for when rooms expire
  onRoomExpired(callback: RoomExpiredCallback): void {
    this.onRoomExpiredCallbacks.push(callback);
  }

  // Set room timeout for automatic deletion
  private setRoomTimeout(code: string): NodeJS.Timeout {
    return setTimeout(() => {
      console.log(`Room ${code} expired due to inactivity`);
      const roomData = this.rooms.get(code);
      if (roomData) {
        // Delete room FIRST to prevent new joins during expiration
        clearTimeout(roomData.timeoutId);
        this.rooms.delete(code);
        console.log(`Room deleted: ${code}`);
        // THEN notify all registered callbacks after room is deleted
        this.onRoomExpiredCallbacks.forEach(callback => callback(code));
      }
    }, ROOM_INACTIVITY_TIMEOUT);
  }

  // Delete a room (public method for manual deletion)
  deleteRoom(code: string): void {
    const roomData = this.rooms.get(code);
    if (roomData) {
      clearTimeout(roomData.timeoutId);
      this.rooms.delete(code);
      console.log(`Room deleted: ${code}`);
    }
  }

  // Check if room exists
  roomExists(code: string): boolean {
    return this.rooms.has(code);
  }

  // Get all active room codes (for debugging)
  getActiveRooms(): string[] {
    return Array.from(this.rooms.keys());
  }
}

export const roomManager = new RoomManager();
