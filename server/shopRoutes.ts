import { Router } from "express";
import { supabase } from "./supabaseClient";

const router = Router();

// LIST OF GEN-Z SHOP CODES THAT SHOULD NOT BE RANDOMLY GENERATED
const GENZ_CODES = [
  "SKY", "LIT", "HYPE", "VIBE", "MOON",
  "NOVA", "ZOOM", "CLOUD", "WAVE",
  "CYBR", "PINK", "FLY"
];

// Prevent random generator from producing these:
function isBlockedPrefix(code: string) {
  return GENZ_CODES.some((p) => code.startsWith(p));
}

// -----------------------------
// CHECK AVAILABILITY
// -----------------------------
router.get("/check/:roomCode", async (req, res) => {
  const code = req.params.roomCode.toUpperCase();

  const { data } = await supabase
    .from("premium_rooms")
    .select("code")
    .eq("code", code)
    .single();

  return res.json({
    status: data ? "taken" : "available",
  });
});

// -----------------------------
// BUY ROOM (device locked + 48hr window)
// -----------------------------
router.post("/buy-room", async (req, res) => {
  const { roomCode, deviceId } = req.body;

  if (!roomCode || roomCode.length !== 6)
    return res.status(400).json({ error: "Invalid code" });

  const code = roomCode.toUpperCase();

  // Check existing
  const { data: exists } = await supabase
    .from("premium_rooms")
    .select("code")
    .eq("code", code)
    .single();

  if (exists) {
    return res.status(400).json({ error: "Room already purchased" });
  }

  const now = Date.now();
  const expires = now + 48 * 60 * 60 * 1000;

  await supabase.from("premium_rooms").insert({
    code,
    purchased_at: now,
    device_id: deviceId,
    can_change_password_until: expires,
  });

  return res.json({ success: true });
});

// -----------------------------
// DEVICE-BASED + TIME-LIMITED PASSWORD CHANGE CHECK
// -----------------------------
router.post("/can-change-password", async (req, res) => {
  const { roomCode, deviceId } = req.body;

  const code = roomCode.toUpperCase();

  const { data: room } = await supabase
    .from("premium_rooms")
    .select("*")
    .eq("code", code)
    .single();

  if (!room) {
    return res.json({
      allowed: false,
      reason: "room-not-found",
    });
  }

  if (room.device_id !== deviceId) {
    return res.json({
      allowed: false,
      reason: "not-owner-device",
    });
  }

  if (Date.now() > room.can_change_password_until) {
    return res.json({
      allowed: false,
      reason: "password-window-expired",
    });
  }

  return res.json({ allowed: true });
});

// -----------------------------
// ANTI-RANDOM GENERATOR
// NEVER generate:
// - purchased rooms
// - shop genz codes
// -----------------------------
router.get("/generate-random-room", async (req, res) => {
  function randomCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let out = "";
    for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }

  async function isPremium(code: string) {
    const { data } = await supabase
      .from("premium_rooms")
      .select("code")
      .eq("code", code)
      .single();

    return !!data;
  }

  let code;
  do {
    code = randomCode();
  } while (await isPremium(code) || isBlockedPrefix(code));

  return res.json({ room: code });
});

export default router;
