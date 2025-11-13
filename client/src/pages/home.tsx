import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const [joinCode, setJoinCode] = useState("");
  const [username, setUsername] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const finalName = username.trim() === "" ? "random" : encodeURIComponent(username.trim());
  const SECRET_ROOM = import.meta.env.VITE_SECRET_ROOM_CODE; // secure

  // Create Room
  const handleCreateRoom = async () => {
    setIsCreating(true);
    try {
      const response = await fetch("/api/create-room", { method: "POST" });
      if (!response.ok) throw new Error("Failed to create room");

      const data = await response.json();
      setLocation(`/chat/${data.roomCode}?username=${finalName}`);
    } catch {
      toast({
        title: "Error",
        description: "Failed to create room. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Join Room
  const handleJoinRoom = () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Room code must be exactly 6 characters.",
        variant: "destructive",
      });
      return;
    }

    // ✅ Secret room login
    if (SECRET_ROOM && code === SECRET_ROOM) {
      const pass = prompt("This room is protected. Enter password:");

      if (!pass) {
        toast({
          title: "Password required",
          description: "You must enter a valid password.",
          variant: "destructive",
        });
        return;
      }

      setLocation(`/chat/${code}?username=${finalName}&key=${encodeURIComponent(pass)}`);
      return;
    }

    // Normal room
    setLocation(`/chat/${code}?username=${finalName}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">

      {/* SHOP BUTTON */}
      <div className="absolute top-4 right-4 z-50">
        <Link href="/shop">
          <button
            aria-label="Shop"
            className="p-2 rounded-full hover:bg-accent transition-all duration-300"
          >
            <svg
              width="34"
              height="34"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2"
              stroke="currentColor"
              className="text-primary transition-all duration-300 hover:text-primary/80"
            >
              <path
                d="M3 3h2l3.6 9.59a1 1 0 0 0 .93.65h7.92a1 1 0 0 0 .96-.74l2.1-7.26H6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="9" cy="20" r="2" />
              <circle cx="17" cy="20" r="2" />
            </svg>
          </button>
        </Link>
      </div>

      {/* CONTENT */}
      <div className="w-full max-w-md mx-auto animate-fadeIn">

        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="bg-primary/10 p-3 rounded-2xl shadow-sm">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">TempChat</h1>
          <p className="text-sm text-muted-foreground">Temporary chat rooms that auto-expire</p>
        </div>

        {/* CARD */}
        <Card className="shadow-lg border border-border/70 transition hover:shadow-xl duration-300">
          <CardHeader>
            <CardDescription className="text-center text-base">
              Create a new room or join an existing one
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">

            {/* USERNAME */}
            <div className="space-y-2">
              <Label htmlFor="username">Username (optional)</Label>
              <Input
                id="username"
                placeholder="Enter your name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                className="text-center text-lg font-mono tracking-wider"
              />
            </div>

            {/* CREATE ROOM */}
            <Button
              onClick={handleCreateRoom}
              disabled={isCreating}
              className="w-full shadow-sm"
            >
              {isCreating ? "Creating..." : "Create New Room"}
            </Button>

            {/* DIVIDER */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            {/* JOIN ROOM */}
            <div className="space-y-2">
              <Label htmlFor="room-code">Room Code</Label>
              <Input
                id="room-code"
                placeholder="Enter 6-digit code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                className="text-center text-lg font-mono tracking-wider"
              />

              <Button
                onClick={handleJoinRoom}
                variant="secondary"
                className="w-full shadow-sm"
              >
                Join Room
              </Button>
            </div>

          </CardContent>
        </Card>

        <div className="mt-6 text-center opacity-80 text-xs">
          Rooms automatically expire after 30 minutes of inactivity
        </div>
      </div>
    </div>
  );
}
