# TempChat - Temporary Chat Rooms

## Overview
TempChat is a real-time temporary chat room application built with React, TypeScript, Socket.IO, and Express. Users can create or join temporary chat rooms that automatically expire after 30 minutes of inactivity.

## Current State
✅ **MVP Complete and Fully Functional**

### Implemented Features
- **Room Management**: Create rooms with 6-digit codes, auto-expiring after 30 minutes of inactivity
- **Real-time Messaging**: Socket.IO-based bidirectional communication
- **User Experience**: 
  - Random username and color assignment for each user
  - Message bubbles with user-specific colors
  - Typing indicators with animated dots
  - User join/leave system notifications
  - Active user count display
  - Room code copy to clipboard
- **UI/UX**: Beautiful, responsive design following modern chat UI patterns
  - Landing page with create/join functionality
  - Chat interface with header, scrollable messages, typing indicator, and input area
  - Auto-scroll to latest messages
  - Smooth animations and transitions
  - Mobile-responsive layout

### Recent Changes (November 13, 2025)
- Initial implementation of TempChat MVP
- Data schema for rooms, messages, and users
- Frontend components with Socket.IO client integration
- Backend Socket.IO server with room management
- In-memory storage with TTL for auto-expiring rooms
- Fixed critical room expiration notification bug (rooms now notify clients before deletion)
- Comprehensive E2E testing completed successfully

## Project Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **Styling**: Tailwind CSS with custom design tokens
- **Real-time**: Socket.IO Client
- **Pages**:
  - `/` - Landing page (create/join room)
  - `/chat/:roomCode` - Chat interface

### Backend
- **Server**: Node.js with Express
- **Real-time**: Socket.IO Server on `/ws/socket.io` path
- **Storage**: In-memory with TTL-based auto-expiration
- **Room Management**: Custom RoomManager class with callback system for expiration events

### Data Models
- **Room**: code, createdAt, lastActivity, users[]
- **Message**: id, roomCode, userId, username, userColor, content, timestamp, type
- **UserInRoom**: id, username, color

## User Preferences
None specified yet.

## Key Files
- `shared/schema.ts` - Data models and validation schemas
- `client/src/pages/home.tsx` - Landing page
- `client/src/pages/chat.tsx` - Chat interface with Socket.IO integration
- `client/src/components/ChatHeader.tsx` - Room header with code, user count, leave button
- `client/src/components/MessageBubble.tsx` - Message display component
- `client/src/components/TypingIndicator.tsx` - Typing indicator with animations
- `client/src/components/ChatInput.tsx` - Message input with send functionality
- `server/routes.ts` - API endpoints and Socket.IO event handlers
- `server/roomManager.ts` - Room lifecycle management with TTL
- `design_guidelines.md` - Comprehensive design system documentation

## Technical Details

### Socket.IO Events
**Client → Server**: join-room, send-message, typing, stop-typing
**Server → Client**: joined, user-joined, user-left, receive-message, typing, stop-typing, room-expired, error

### Room Lifecycle
1. Room created via `/api/create-room` endpoint
2. Users join via Socket.IO `join-room` event
3. Activity updates reset the 30-minute inactivity timer
4. When timer expires:
   - Room is deleted from memory
   - All connected clients receive `room-expired` event
   - Clients are disconnected and redirected to home
5. Empty rooms (no users) are immediately deleted

### Design System
- **Fonts**: Inter, DM Sans (Google Fonts)
- **Colors**: Primary blue (#3B82F6), 8 predefined user colors
- **Spacing**: Consistent Tailwind units (2, 3, 4, 6, 8)
- **Animations**: Typing dots, fade-in messages, subtle hover effects

## Running the Application
```bash
npm install
npm run dev
```

Server runs on port 5000 with Socket.IO on `/ws/socket.io` path.

## Testing
Comprehensive E2E testing completed with Playwright covering:
- Room creation and joining
- Real-time messaging and synchronization
- Typing indicators
- User join/leave notifications
- Room code copying
- Error handling for invalid rooms

## Future Enhancements
- Persistent message history with configurable retention
- Room password protection
- Custom username editing
- File/image sharing
- Emoji picker and markdown support
- Room settings (customize expiry time, max users)
- Accessibility improvements (ARIA labels for typing indicator)

## Dependencies
**Frontend**: React, Socket.IO Client, Wouter, Tailwind CSS, Lucide React icons
**Backend**: Express, Socket.IO Server
**Development**: TypeScript, Vite, TSX

## Notes
- Room codes are 6-character alphanumeric strings
- Maximum 1000 characters per message
- Usernames auto-generated as "User####" with random 4-digit number
- 30-minute inactivity timeout is configurable in `server/roomManager.ts`
