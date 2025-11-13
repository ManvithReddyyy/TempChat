import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();
  const [joinCode, setJoinCode] = useState("");
  const [username, setUsername] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  // Create Room
  const handleCreateRoom = async () => {
    setIsCreating(true);
    try {
      const response = await fetch("/api/create-room", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to create room");
      }

      const data = await response.json();

      const finalName =
        username.trim() === "" ? "random" : encodeURIComponent(username.trim());

      setLocation(`/chat/${data.roomCode}?username=${finalName}`);

    } catch (error) {
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

    const finalName =
      username.trim() === "" ? "random" : encodeURIComponent(username.trim());

    setLocation(`/chat/${code}?username=${finalName}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">

      {/* SHOP ICON TOP RIGHT */}
      <div className="absolute top-4 right-4 z-50">
        <Link href="/shop">
          <button
            className="p-2 rounded-full hover:bg-accent transition group"
            aria-label="Shop"
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              className="stroke-primary group-hover:stroke-primary/80 transition"
            >
              {/* Cart Body */}
              <path
                d="M3 3h2l3.6 9.59a1 1 0 0 0 .93.65h7.92a1 1 0 0 0 .96-.74l2.1-7.26H6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Left Wheel */}
              <circle
                cx="9"
                cy="20"
                r="2"
                strokeWidth="2"
                className="origin-center group-hover:animate-spin-l"
              />

              {/* Right Wheel */}
              <circle
                cx="17"
                cy="20"
                r="2"
                strokeWidth="2"
                className="origin-center group-hover:animate-spin-r"
              />
            </svg>
          </button>
        </Link>
      </div>

      <div className="w-full max-w-md mx-auto">

        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="bg-primary/10 p-3 rounded-2xl">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">TempChat</h1>
          <p className="text-sm text-muted-foreground">
            Temporary chat rooms that auto-expire
          </p>
        </div>

        {/* MAIN CARD */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Get Started</CardTitle>
            <CardDescription>
              Create a new room or join an existing one
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">

            {/* USERNAME */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">
                Username (optional)
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your name or leave blank"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                className="text-center text-lg font-mono tracking-wider"
              />
            </div>

            {/* CREATE ROOM */}
            <div className="space-y-3">
              <Button
                onClick={handleCreateRoom}
                disabled={isCreating}
                className="w-full"
                size="lg"
                data-testid="button-create-room"
              >
                {isCreating ? "Creating..." : "Create New Room"}
              </Button>
            </div>

            {/* DIVIDER */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            {/* JOIN ROOM */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="room-code" className="text-sm font-medium">
                  Room Code
                </Label>
                <Input
                  id="room-code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                  maxLength={6}
                  className="text-center text-lg font-mono tracking-wider"
                  data-testid="input-room-code"
                />
              </div>

              <Button
                onClick={handleJoinRoom}
                variant="secondary"
                className="w-full"
                size="lg"
                data-testid="button-join-room"
              >
                Join Room
              </Button>
            </div>

          </CardContent>
        </Card>

        {/* FOOTER */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Rooms automatically expire after 30 minutes of inactivity
          </p>
        </div>

      </div>
    </div>
  );
}
