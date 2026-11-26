import mongoose from "mongoose";
import { ChatMessage, CHAT_MAX_LENGTH } from "./models/ChatMessage.js";
import { Conversation } from "./models/Conversation.js";
import { User } from "./models/User.js";
import { notify } from "./notifications.js";

/**
 * Support chat data layer. Used by the Socket.IO server (server.js) and by
 * admin pages, so it only uses plain relative imports.
 *
 * Every function takes the acting user (`{ id, role, name }`) and enforces
 * access itself: sellers only ever see their own conversation.
 */

/** Error whose message is safe to send to the client. */
export class ChatError extends Error {}

const HISTORY_LIMIT = 50;

/** Shape a message for the wire. */
export function toWire(m) {
  return {
    _id: String(m._id),
    conversation: String(m.conversation),
    role: m.role,
    senderName: m.senderName,
    body: m.body,
    createdAt: new Date(m.createdAt).toISOString(),
  };
}

/** Shape a conversation for the admin inbox. */
function convToWire(c) {
  return {
    _id: String(c._id),
    seller: c.seller && typeof c.seller === "object" && c.seller.name
      ? { _id: String(c.seller._id), name: c.seller.name, email: c.seller.email, storeName: c.seller.storeName ?? "" }
      : { _id: String(c.seller) },
    lastMessage: c.lastMessage?.body
      ? { body: c.lastMessage.body, role: c.lastMessage.role, at: new Date(c.lastMessage.at).toISOString() }
      : null,
    adminUnread: c.adminUnread ?? 0,
    sellerUnread: c.sellerUnread ?? 0,
    status: c.status,
  };
}

/**
 * A seller's conversation (created on first use).
 * @param {string} sellerId
 */
export async function getOrCreateSellerConversation(sellerId) {
  return Conversation.findOneAndUpdate(
    { seller: sellerId },
    { $setOnInsert: { seller: sellerId } },
    { upsert: true, returnDocument: "after" }
  ).lean();
}

/**
 * Resolve which conversation an actor may use.
 * Sellers: always their own. Admins: the id they ask for.
 */
async function resolveConversation(actor, conversationId) {
  if (actor.role === "SELLER") return getOrCreateSellerConversation(actor.id);
  if (actor.role !== "ADMIN") throw new ChatError("Not allowed.");
  if (!mongoose.isValidObjectId(conversationId)) throw new ChatError("Conversation not found.");
  const conv = await Conversation.findById(conversationId).lean();
  if (!conv) throw new ChatError("Conversation not found.");
  return conv;
}

/**
 * Recent messages, oldest first, and mark them read for the actor's side.
 * @param {{ id: string, role: string }} actor
 * @param {string} [conversationId]  admins only
 * @param {string} [before]          ISO date for loading older messages
 */
export async function getHistory(actor, conversationId, before) {
  const conv = await resolveConversation(actor, conversationId);
  const where = { conversation: conv._id };
  if (before && !Number.isNaN(Date.parse(before))) where.createdAt = { $lt: new Date(before) };
  const docs = await ChatMessage.find(where).sort({ createdAt: -1 }).limit(HISTORY_LIMIT + 1).lean();
  const hasMore = docs.length > HISTORY_LIMIT;
  const messages = docs.slice(0, HISTORY_LIMIT).reverse().map(toWire);
  await markRead(actor, conv._id);
  return { conversationId: String(conv._id), messages, hasMore };
}

/**
 * Reset the unread counter for the actor's side.
 * @param {{ role: string }} actor
 * @param {string|import("mongoose").Types.ObjectId} conversationId
 */
export async function markRead(actor, conversationId) {
  const field = actor.role === "ADMIN" ? "adminUnread" : "sellerUnread";
  await Conversation.updateOne({ _id: conversationId }, { $set: { [field]: 0 } });
}

/**
 * Save a message and update the conversation summary.
 * Admin replies also drop a (de-duplicated) "Support replied" update in the
 * seller's feed.
 *
 * @param {{ id: string, role: string, name: string }} actor
 * @param {{ conversationId?: string, body: string }} input
 * @returns {Promise<{ message: Object, conversation: Object, sellerId: string }>}
 */
export async function sendMessage(actor, { conversationId, body }) {
  const text = String(body ?? "").replace(/\r\n/g, "\n").trim();
  if (!text) throw new ChatError("Message is empty.");
  if (text.length > CHAT_MAX_LENGTH) throw new ChatError(`Keep messages under ${CHAT_MAX_LENGTH} characters.`);

  const conv = await resolveConversation(actor, conversationId);
  const msg = await ChatMessage.create({
    conversation: conv._id,
    sender: actor.id,
    role: actor.role,
    senderName: actor.role === "ADMIN" ? "Flip Baz team" : actor.name,
    body: text,
  });

  const unreadField = actor.role === "ADMIN" ? "sellerUnread" : "adminUnread";
  const updated = await Conversation.findByIdAndUpdate(
    conv._id,
    {
      $set: { lastMessage: { body: text.slice(0, 200), role: actor.role, at: msg.createdAt }, status: "OPEN" },
      $inc: { [unreadField]: 1 },
    },
    { returnDocument: "after" }
  )
    .populate("seller", "name email storeName")
    .lean();

  const sellerId = String(conv.seller);
  if (actor.role === "ADMIN") {
    await notify(sellerId, {
      type: "SUPPORT_REPLY",
      title: "Support replied",
      body: text.slice(0, 160),
      href: "/dashboard?chat=open",
      key: `chat:${conv._id}`,
    });
  }
  return { message: toWire(msg), conversation: convToWire(updated), sellerId };
}

/**
 * Admin inbox: conversations with the newest message first.
 * @param {{ role: string }} actor
 * @param {{ q?: string }} [opts]
 */
export async function listConversations(actor, { q } = {}) {
  if (actor.role !== "ADMIN") throw new ChatError("Not allowed.");
  const where = { "lastMessage.at": { $exists: true } };
  const search = String(q ?? "").trim().slice(0, 60);
  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const sellers = await User.find({ role: "SELLER", $or: [{ name: rx }, { email: rx }, { storeName: rx }] }).select("_id").limit(100).lean();
    where.seller = { $in: sellers.map((s) => s._id) };
  }
  const convs = await Conversation.find(where).sort({ "lastMessage.at": -1 }).limit(100).populate("seller", "name email storeName").lean();
  return convs.map(convToWire);
}

/**
 * Seller's unread count (for the chat bubble badge).
 * @param {string} sellerId
 */
export async function sellerUnreadCount(sellerId) {
  const c = await Conversation.findOne({ seller: sellerId }).select("sellerUnread").lean();
  return c?.sellerUnread ?? 0;
}

/** Total unread across all conversations (admin nav badge). */
export async function adminUnreadTotal() {
  const [r] = await Conversation.aggregate([{ $group: { _id: null, n: { $sum: "$adminUnread" } } }]);
  return r?.n ?? 0;
}
