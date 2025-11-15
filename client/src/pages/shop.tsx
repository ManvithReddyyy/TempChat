import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Gen-Z room suggestions
const GENZ_WORDS = [
  "SKY", "LIT", "HYPE", "VIBE", "MOON",
  "NOVA", "ZOOM", "CLOUD", "WAVE",
  "CYBR", "PINK", "FLY"
];

const generateGenZCodes = () =>
  Array.from({ length: 12 }, () => {
    const word = GENZ_WORDS[Math.floor(Math.random() * GENZ_WORDS.length)];
    const num = Math.floor(100 + Math.random() * 900);
    return `${word}${num}`;
  });

export default function ShopPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Generate one-time device ID
  let deviceId = localStorage.getItem("deviceId");
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("deviceId", deviceId);
  }

  const [searchCode, setSearchCode] = useState("");
  const [roomStatus, setRoomStatus] = useState<"available" | "taken" | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [codes] = useState(generateGenZCodes());

  // ***************
  // FIXED CHECK ROOM
  // ***************
  const checkRoom = async (code?: string) => {
    const finalCode = (code || searchCode).toUpperCase();

    if (finalCode.length !== 6) return;

    setIsChecking(true);

    try {
      const res = await fetch(`/api/shop/check/${finalCode}`);
      const data = await res.json();
      setRoomStatus(data.status);
    } catch (err) {
      toast({
        title: "Error",
        description: "Could not check room.",
        variant: "destructive",
      });
    }

    setIsChecking(false);
  };

  // ***************
  // BUY ROOM
  // ***************
  const buyRoom = async () => {
    setIsBuying(true);
    try {
      const res = await fetch("/api/shop/buy-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode: searchCode,
          deviceId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success!",
        description: "Room purchased successfully!",
      });

      setLocation(`/payment?room=${searchCode}`);

    } catch (err) {
      toast({
        title: "Error",
        description: "Unexpected error.",
        variant: "destructive",
      });
    }

    setIsBuying(false);
  };

  return (
    <div className="min-h-screen p-6 flex flex-col items-center gap-8">

      {/* MAIN CARD */}
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Buy a Permanent Room</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">

          {/* INPUT */}
          <div className="space-y-2">
            <Label>Search Room Code</Label>
            <Input
              placeholder="Enter 6-digit room code"
              value={searchCode}
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                setSearchCode(val);
                if (val.length === 6) checkRoom(val);
              }}
              maxLength={6}
              className="text-center font-mono text-lg tracking-wider"
            />
          </div>

          <Button
            className="w-full"
            onClick={() => checkRoom(searchCode)}
            disabled={isChecking}
          >
            {isChecking ? "Checking..." : "Check Availability"}
          </Button>

          {/* STATUS */}
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

      {/* GEN Z ROOM CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-3xl">
        {codes.map((code) => (
          <div
            key={code}
            onClick={() => {
              setSearchCode(code);
              checkRoom(code); // FIXED: always checks right code
            }}
            className="cursor-pointer p-4 border rounded-xl shadow-sm hover:shadow-md transition bg-white text-center font-mono text-lg tracking-widest"
          >
            {code}
          </div>
        ))}
      </div>
    </div>
  );
}
