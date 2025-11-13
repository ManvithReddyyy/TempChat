import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, Users, LogOut } from "lucide-react";

interface ChatHeaderProps {
  roomCode: string;
  userCount: number;
  onLeave: () => void;
}

export function ChatHeader({ roomCode, userCount, onLeave }: ChatHeaderProps) {
  const { toast } = useToast();

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      toast({
        title: "Copied!",
        description: "Room code copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy room code",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={copyRoomCode}
          className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-lg px-3 py-2 transition-all"
          data-testid="button-copy-code"
          aria-label="Copy room code"
        >
          <span className="text-2xl md:text-3xl font-mono font-bold tracking-wider">
            {roomCode}
          </span>
          <Copy className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold" data-testid="text-user-count">
          <Users className="w-4 h-4" />
          <span>{userCount}</span>
        </div>

        <Button
          onClick={onLeave}
          variant="ghost"
          size="sm"
          className="gap-2"
          data-testid="button-leave-room"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Leave</span>
        </Button>
      </div>
    </header>
  );
}
