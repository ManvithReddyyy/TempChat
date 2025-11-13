// This file is not used in TempChat
// TempChat uses server/roomManager.ts for in-memory room storage with TTL
// and Socket.IO for real-time communication

export interface IStorage {
  // Placeholder interface - not used in this application
}

export class MemStorage implements IStorage {
  constructor() {
    // Not used in TempChat
  }
}

export const storage = new MemStorage();
