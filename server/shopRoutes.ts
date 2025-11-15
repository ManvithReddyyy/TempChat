import { Router } from "express";

const router = Router();

// PREMIUM ROOM STORAGE
interface PurchasedRoom {
  purchasedAt: number;
  deviceId: string;
  canChangePasswordUntil: number;
}

const permanentRooms = new Map<string, PurchasedRoom>();

// OPTIONAL: Example taken codes
// permanentRooms.set("SKY420", { purchasedAt: Date.now(), deviceId: "xx", canChangePasswordUntil: Date.now() });

// ---------------------------
// CHECK ROOM AVAILABILITY
// ---------------------------

router.get("/check/:roomCode", (req, res) => {
  const roomCode = req.params.roomCode.toUpperCase();

  if (permanentRooms.has(roomCode)) {
    return res.json({ status: "taken" });
  }
  return res.json({ status: "available" });
});


// ---------------------------
// BUY ROOM (DEVICE LOCKED)
// ---------------------------

router.post("/buy-room", (req, res) => {
  const { roomCode, deviceId } = req.body;

  if (!roomCode || roomCode.length !== 6)
    return res.status(400).json({ error: "Invalid room code" });

  if (!deviceId)
    return res.status(400).json({ error: "No device id provided" });

  const code = roomCode.toUpperCase();

  if (permanentRooms.has(code))
    return res.status(400).json({ error: "Room already purchased" });

  const now = Date.now();
  const expires = now + 48 * 60 * 60 * 1000; // 48 hours

  permanentRooms.set(code, {
    purchasedAt: now,
    deviceId,
    canChangePasswordUntil: expires,
  });

  res.json({ success: true });
});


// ---------------------------
// CHECK PASSWORD CHANGE ACCESS
// ---------------------------

router.post("/can-change-password", (req, res) => {
  const { roomCode, deviceId } = req.body;

  const data = permanentRooms.get(roomCode);

  if (!data)
    return res.status(404).json({ allowed: false, error: "Room not found" });

  const now = Date.now();

  if (data.deviceId !== deviceId)
    return res.status(403).json({ allowed: false, error: "Not your device" });

  if (now > data.canChangePasswordUntil)
    return res.json({
      allowed: false,
      message: "48-hour window expired",
    });

  return res.json({ allowed: true });
});


// ---------------------------
// GENERATE RANDOM ROOM CODE (NO PREMIUMS)
// ---------------------------

export function generateRandomRoom() {
  let code = "";

  do {
    code = Math.random().toString(36).substring(2, 8).toUpperCase();
  } while (permanentRooms.has(code)); // Block premium codes

  return code;
}

export default router;
