import { z } from "zod";

// Room schema
export const roomSchema = z.object({
  code: z.string().length(6),
  createdAt: z.number(),
  lastActivity: z.number(),
  users: z.array(z.object({
    id: z.string(),
    username: z.string(),
    color: z.string(),
  })),
});

export type Room = z.infer<typeof roomSchema>;

// Message schema
export const messageSchema = z.object({
  id: z.string(),
  roomCode: z.string(),
  userId: z.string(),
  username: z.string(),
  userColor: z.string(),
  content: z.string(),
  timestamp: z.number(),
  type: z.enum(['user', 'system']),
});

export type Message = z.infer<typeof messageSchema>;

// User in room schema
export const userInRoomSchema = z.object({
  id: z.string(),
  username: z.string(),
  color: z.string(),
});

export type UserInRoom = z.infer<typeof userInRoomSchema>;

// Socket event schemas
export const joinRoomSchema = z.object({
  roomCode: z.string().length(6),
});

export const sendMessageSchema = z.object({
  roomCode: z.string(),
  content: z.string().min(1).max(1000),
});

export const typingEventSchema = z.object({
  roomCode: z.string(),
  isTyping: z.boolean(),
});

export type JoinRoomEvent = z.infer<typeof joinRoomSchema>;
export type SendMessageEvent = z.infer<typeof sendMessageSchema>;
export type TypingEvent = z.infer<typeof typingEventSchema>;

// Room creation response
export type CreateRoomResponse = {
  roomCode: string;
};

// Predefined user colors for chat bubbles
export const USER_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
];
