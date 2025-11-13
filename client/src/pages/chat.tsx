import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { io, Socket } from "socket.io-client";
import { ChatHeader } from "@/components/ChatHeader";
import { MessageBubble } from "@/components/MessageBubble";
import { TypingIndicator } from "@/components/TypingIndicator";
import { ChatInput } from "@/components/ChatInput";
import { useToast } from "@/hooks/use-toast";
import { Message, UserInRoom, USER_COLORS } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function Chat() {
  const [, params] = useRoute("/chat/:roomCode");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<UserInRoom[]>([]);
  const [currentUser, setCurrentUser] = useState<UserInRoom | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const roomCode = params?.roomCode?.toUpperCase();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Socket.IO connection
  useEffect(() => {
    if (!roomCode) {
      setLocation("/");
      return;
    }

    // Generate random username and color
    const randomUsername = `User${Math.floor(Math.random() * 10000)}`;
    const randomColor = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
    const userId = Math.random().toString(36).substring(7);

    const user: UserInRoom = {
      id: userId,
      username: randomUsername,
      color: randomColor,
    };
    setCurrentUser(user);

    // Connect to Socket.IO server
    const socket = io({
      path: "/ws/socket.io",
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket.IO connected");
      // Join room
      socket.emit("join-room", {
        roomCode,
        user,
      });
    });

    socket.on("joined", (data) => {
      setIsConnecting(false);
      setUsers(data.users);
      setMessages(data.messages || []);
      toast({
        title: "Connected",
        description: `Joined room ${roomCode}`,
      });
    });

    socket.on("user-joined", (data) => {
      setUsers(data.users);
      setMessages((prev) => [
        ...prev,
        {
          id: `system-${Date.now()}`,
          roomCode,
          userId: "system",
          username: "System",
          userColor: "#666",
          content: `${data.username} joined the room`,
          timestamp: Date.now(),
          type: "system",
        },
      ]);
    });

    socket.on("user-left", (data) => {
      setUsers(data.users);
      setMessages((prev) => [
        ...prev,
        {
          id: `system-${Date.now()}`,
          roomCode,
          userId: "system",
          username: "System",
          userColor: "#666",
          content: `${data.username} left the room`,
          timestamp: Date.now(),
          type: "system",
        },
      ]);
      // Remove from typing users
      setTypingUsers((prev) => prev.filter((u) => u !== data.username));
    });

    socket.on("receive-message", (data) => {
      setMessages((prev) => [...prev, data.message]);
    });

    socket.on("typing", (data) => {
      if (data.userId !== userId) {
        setTypingUsers((prev) => {
          if (!prev.includes(data.username)) {
            return [...prev, data.username];
          }
          return prev;
        });
      }
    });

    socket.on("stop-typing", (data) => {
      if (data.userId !== userId) {
        setTypingUsers((prev) => prev.filter((u) => u !== data.username));
      }
    });

    socket.on("room-expired", () => {
      toast({
        title: "Room Expired",
        description: "This room has been closed due to inactivity",
        variant: "destructive",
      });
      setTimeout(() => setLocation("/"), 2000);
    });

    socket.on("error", (data) => {
      setConnectionError(data.message);
      setIsConnecting(false);
      toast({
        title: "Error",
        description: data.message,
        variant: "destructive",
      });
      setTimeout(() => setLocation("/"), 2000);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket.IO connection error:", error);
      setConnectionError("Connection error");
      setIsConnecting(false);
    });

    socket.on("disconnect", () => {
      console.log("Socket.IO disconnected");
    });

    return () => {
      socket.disconnect();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [roomCode, setLocation, toast]);

  const sendMessage = (content: string) => {
    if (socketRef.current?.connected && currentUser) {
      socketRef.current.emit("send-message", {
        roomCode,
        content,
      });
    }
  };

  const handleTypingChange = (isTyping: boolean) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(isTyping ? "typing" : "stop-typing", {
        roomCode,
      });
    }
  };

  const handleLeave = () => {
    if (socketRef.current?.connected) {
      socketRef.current.disconnect();
    }
    setLocation("/");
  };

  if (isConnecting) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Connecting to room...</p>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <p className="text-destructive mb-4">{connectionError}</p>
          <p className="text-muted-foreground">Redirecting to home...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <ChatHeader
        roomCode={roomCode!}
        userCount={users.length}
        onLeave={handleLeave}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 md:px-8">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No messages yet. Start the conversation!
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwnMessage={message.userId === currentUser?.id}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <TypingIndicator typingUsers={typingUsers} />

      <ChatInput
        onSendMessage={sendMessage}
        onTypingChange={handleTypingChange}
        disabled={!currentUser}
      />
    </div>
  );
}
