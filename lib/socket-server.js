import { Server } from "socket.io";
import mongoose from "mongoose";
import { connectDB } from "./db.js";
import { SESSION_COOKIE, verifySessionToken } from "./auth/token.js";
import { User } from "./models/User.js";
import { Conversation } from "./models/Conversation.js";
import { ChatError, getHistory, listConversations, markRead, sendMessage, sellerUnreadCount } from "./chat.js";
import { ADMIN_ROOM, userRoom } from "./realtime.js";

/**
 * Socket.IO server for live support chat (and live notifications).
 *
 * Auth: the same httpOnly `fb_session` cookie the app uses, verified with the
 * same JWT secret, then the user is re-checked in MongoDB (disabled accounts
 * are refused). Cross-site connections are rejected by an Origin check.
 *
 * Rooms: every socket joins `user:<id>`; admins also join `admins`.
 *
 * Events (client → server, all with an ack callback):
 *   chat:history       { conversationId?, before? } → { conversationId, messages, hasMore }
 *   chat:send          { conversationId?, body }    → { message }
 *   chat:read          { conversationId? }
 *   chat:typing        { conversationId? }          (no ack)
 *   chat:conversations { q? }                       → { conversations }  (admins)
 *   chat:unread        {}                           → { unread }         (sellers)
 * Events (server → client):
 *   chat:message, chat:conversation, chat:typing, notification:new
 */

/** Per-socket send limit: N messages per window. */
const RATE = { max: 8, windowMs: 10_000 };

/** Parse a Cookie header into an object. */
function parseCookies(header = "") {
  return Object.fromEntries(
    header
      .split(";")
      .map((p) => p.trim().split("="))
      .filter(([k]) => k)
      .map(([k, ...v]) => [k, decodeURIComponent(v.join("="))])
  );
}

/** Only accept browser connections from this same site. */
function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true; // non-browser clients don't send Origin
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

/** Run a handler, always answering the ack with { error } or the result. */
function handler(fn) {
  return async (payload, ack) => {
    const reply = typeof ack === "function" ? ack : () => {};
    try {
      reply(await fn(payload && typeof payload === "object" ? payload : {}));
    } catch (err) {
      if (!(err instanceof ChatError)) console.error("[socket]", err);
      reply({ error: err instanceof ChatError ? err.message : "Something went wrong. Please try again." });
    }
  };
}

/**
 * Attach Socket.IO to the HTTP server and expose it on globalThis so app code
 * (lib/realtime.js) can push events.
 * @param {import("node:http").Server} httpServer
 * @returns {Server}
 */
export function attachSocketServer(httpServer) {
  const io = new Server(httpServer, {
    path: "/socket.io",
    serveClient: false,
    // Let Next.js handle its own WebSocket upgrades (dev HMR) instead of destroying them.
    destroyUpgrade: false,
    maxHttpBufferSize: 64 * 1024,
    allowRequest: (req, cb) => cb(null, sameOrigin(req)),
  });
  globalThis.__flipBazIO = io;

  io.use(async (socket, next) => {
    try {
      const token = parseCookies(socket.handshake.headers.cookie)[SESSION_COOKIE];
      const session = await verifySessionToken(token);
      if (!session || !mongoose.isValidObjectId(session.userId)) return next(new Error("unauthorized"));
      await connectDB();
      const user = await User.findById(session.userId).select("name role isActive").lean();
      if (!user || user.isActive === false) return next(new Error("unauthorized"));
      socket.data.user = { id: String(user._id), role: user.role, name: user.name };
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const me = socket.data.user;
    socket.join(userRoom(me.id));
    if (me.role === "ADMIN") socket.join(ADMIN_ROOM);

    let sent = [];
    const limited = () => {
      const now = Date.now();
      sent = sent.filter((t) => now - t < RATE.windowMs);
      if (sent.length >= RATE.max) return true;
      sent.push(now);
      return false;
    };

    socket.on(
      "chat:history",
      handler(({ conversationId, before }) => getHistory(me, conversationId, before))
    );

    socket.on(
      "chat:send",
      handler(async ({ conversationId, body }) => {
        if (limited()) throw new ChatError("You're sending messages too fast. Please wait a moment.");
        const { message, conversation, sellerId } = await sendMessage(me, { conversationId, body });
        io.to(userRoom(sellerId)).emit("chat:message", message);
        io.to(ADMIN_ROOM).emit("chat:message", message);
        io.to(ADMIN_ROOM).emit("chat:conversation", conversation);
        return { message };
      })
    );

    socket.on(
      "chat:read",
      handler(async ({ conversationId }) => {
        if (me.role === "SELLER") {
          const conv = await Conversation.findOne({ seller: me.id }).select("_id").lean();
          if (conv) await markRead(me, conv._id);
        } else if (mongoose.isValidObjectId(conversationId)) {
          await markRead(me, conversationId);
        }
        return { ok: true };
      })
    );

    socket.on("chat:typing", async (payload) => {
      try {
        if (me.role === "SELLER") {
          const conv = await Conversation.findOne({ seller: me.id }).select("_id").lean();
          if (conv) socket.to(ADMIN_ROOM).emit("chat:typing", { conversationId: String(conv._id), role: "SELLER", name: me.name });
        } else if (me.role === "ADMIN" && mongoose.isValidObjectId(payload?.conversationId)) {
          const conv = await Conversation.findById(payload.conversationId).select("seller").lean();
          if (conv) {
            io.to(userRoom(String(conv.seller))).emit("chat:typing", { conversationId: String(conv._id), role: "ADMIN" });
            socket.to(ADMIN_ROOM).emit("chat:typing", { conversationId: String(conv._id), role: "ADMIN", name: me.name });
          }
        }
      } catch {
        /* typing hints are best-effort */
      }
    });

    socket.on(
      "chat:conversations",
      handler(async ({ q }) => ({ conversations: await listConversations(me, { q }) }))
    );

    socket.on(
      "chat:unread",
      handler(async () => ({ unread: me.role === "SELLER" ? await sellerUnreadCount(me.id) : 0 }))
    );
  });

  return io;
}
