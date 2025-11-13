import { Router } from "express";
import { roomManager } from "./roomManager";

const router = Router();

// Temporary in-memory permanent rooms
// Later you can move to a database
const permanentRooms = new Map<string, { purchasedAt: number }>();

// Check availability
router.get("/check/:roomCode", (req, res) => {
  const roomCode = req.params.roomCode;

  if (permanentRooms.has(roomCode)) {
    return res.json({ status: "taken" });
  }

  return res.json({ status: "available" });
});

// Buy a room
router.post("/buy-room", (req, res) => {
  const { roomCode } = req.body;

  if (!roomCode || roomCode.length !== 6) {
    return res.status(400).json({ error: "Invalid room code" });
  }

  if (permanentRooms.has(roomCode)) {
    return res.status(400).json({ error: "Room already purchased" });
  }

  permanentRooms.set(roomCode, { purchasedAt: Date.now() });

  return res.json({ success: true });
});

// Export for server use
export default router;
