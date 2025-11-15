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

  const [passwordRequired, setPasswordRequired] = useState(true);
  const [passwordInput, setPasswordInput] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const roomCode = params?.roomCode?.toUpperCase();

  // Client env
  const SPECIAL_ROOM = import.meta.env.VITE_SPECIAL_ROOM?.toUpperCase();
  const SPECIAL_PASSWORD = import.meta.env.VITE_SPECIAL_PASSWORD?.trim();
  const isProtectedRoom = roomCode === SPECIAL_ROOM;

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!roomCode) {
      setLocation("/");
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const passParam = searchParams.get("password");

    // Ask password first
    if (isProtectedRoom && !passParam) {
      setPasswordRequired(true);
      setIsConnecting(false);
      return;
    }

    // Username logic
    const usernameParam = searchParams.get("username");
    const finalUsername =
      !usernameParam || usernameParam === "random"
        ? `User${Math.floor(Math.random() * 10000)}`
        : decodeURIComponent(usernameParam);

    const finalColor =
      USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
    const finalUserId = Math.random().toString(36).substring(7);

    const user: UserInRoom = {
      id: finalUserId,
      username: finalUsername,
      color: finalColor,
    };

    setCurrentUser(user);

    // Connect socket
    const socket = io({
      path: "/ws/socket.io",
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-room", {
        roomCode,
        user,
        password: passParam || "",   // <-- FIXED!
      });
    });

    socket.on("invalid-password", () => {
      toast({
        title: "Access Denied",
        description: "Incorrect password.",
        variant: "destructive",
      });
      setTimeout(() => setLocation("/"), 1500);
    });

    socket.on("joined", (data) => {
      setIsConnecting(false);
      setUsers(data.users);
      setMessages(data.messages || []);
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
    });

    socket.on("receive-message", (data) => {
      setMessages((prev) => [...prev, data.message]);
    });

    socket.on("typing", (data) => {
      setTypingUsers((prev) =>
        prev.includes(data.username) ? prev : [...prev, data.username]
      );
    });

    socket.on("stop-typing", (data) => {
      setTypingUsers((prev) =>
        prev.filter((name) => name !== data.username)
      );
    });

    socket.on("room-expired", () => {
      toast({
        title: "Room Expired",
        description: "Messages cleared.",
        variant: "destructive",
      });
    });

    socket.on("error", (data) => {
      setConnectionError(data.message);
      setIsConnecting(false);
      setTimeout(() => setLocation("/"), 2000);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomCode, isProtectedRoom, setLocation, toast]);

  const sendMessage = (content: string) => {
    if (socketRef.current?.connected && currentUser) {
      socketRef.current.emit("send-message", { roomCode, content });
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
    socketRef.current?.disconnect();
    setLocation("/");
  };

  // PASSWORD SCREEN
  if (passwordRequired && isProtectedRoom) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background p-6">
        <h2 className="text-xl font-semibold mb-4">Enter Room Password</h2>

        <input
          type="password"
          className="border p-2 rounded mb-3 w-64 text-center"
          placeholder="Enter Password"
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
        />

        <button
          className="bg-primary text-white px-4 py-2 rounded"
          onClick={() => {
            if (passwordInput.trim() === SPECIAL_PASSWORD) {
              setPasswordRequired(false);
              setLocation(
                `/chat/${roomCode}?password=${encodeURIComponent(
                  SPECIAL_PASSWORD!
                )}`
              );
            } else {
              toast({ title: "Incorrect Password", variant: "destructive" });
            }
          }}
        >
          Enter Room
        </button>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
        <p>Connecting...</p>
      </div>
    );
  }

  if (connectionError) {
    return <div>Error: {connectionError}</div>;
  }

  // MAIN UI
  return (
    <div className="h-screen flex flex-col bg-background">
      <ChatHeader
        roomCode={roomCode!}
        userCount={users.length}
        onLeave={handleLeave}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 md:px-8">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwnMessage={message.userId === currentUser?.id}
            />
          ))}
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
