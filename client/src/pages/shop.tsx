import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function ShopPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [searchCode, setSearchCode] = useState("");
  const [roomStatus, setRoomStatus] = useState<"available" | "taken" | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isBuying, setIsBuying] = useState(false);

  // Check room status
  const checkRoom = async () => {
    if (searchCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Room code must be 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsChecking(true);
    try {
      const res = await fetch(`/api/shop/check/${searchCode}`);
      const data = await res.json();
      setRoomStatus(data.status); // available or taken
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to check room status.",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  // Buy a room
  const buyRoom = async () => {
    setIsBuying(true);
    try {
      const res = await fetch("/api/shop/buy-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode: searchCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "Error",
          description: data.error || "Purchase failed.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Room purchased successfully!",
      });

      setLocation(`/payment?room=${searchCode}`);

    } catch (error) {
      toast({
        title: "Error",
        description: "Unexpected error.",
        variant: "destructive",
      });
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Buy a Permanent Room</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          
          {/* Search Input */}
          <div className="space-y-2">
            <Label>Search Room Code</Label>
            <Input
              placeholder="Enter 6-digit room code"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="text-center font-mono text-lg tracking-wider"
            />
          </div>

          <Button
            className="w-full"
            onClick={checkRoom}
            disabled={isChecking}
          >
            {isChecking ? "Checking..." : "Check Availability"}
          </Button>

          {/* Status */}
          {roomStatus && (
            <div
              className={`p-3 rounded-lg text-center font-medium ${
                roomStatus === "available"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {roomStatus === "available"
                ? "Room is available!"
                : "Room is already taken"}
            </div>
          )}

          {/* Buy Button */}
          {roomStatus === "available" && (
            <Button
              className="w-full"
              onClick={buyRoom}
              disabled={isBuying}
            >
              {isBuying ? "Processing..." : "Buy Room"}
            </Button>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
