import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { ContactMessage } from "@/lib/models";
import { serialize } from "@/lib/serialize";
import { ADMIN_PAGE_SIZE, AdminError, pageNum } from "./common";

/**
 * Contact-form inbox, unread first.
 * @param {{ filter?: "unread"|"all", page?: number }} opts
 */
export async function listMessages({ filter, page } = {}) {
  await connectDB();
  const where = filter === "unread" ? { read: false } : {};
  const p = pageNum(page);
  const [items, total, unread] = await Promise.all([
    ContactMessage.find(where)
      .sort({ read: 1, createdAt: -1 })
      .skip((p - 1) * ADMIN_PAGE_SIZE)
      .limit(ADMIN_PAGE_SIZE)
      .lean(),
    ContactMessage.countDocuments(where),
    ContactMessage.countDocuments({ read: false }),
  ]);
  return { items: serialize(items), total, unread, page: p, pages: Math.ceil(total / ADMIN_PAGE_SIZE) };
}

/**
 * Mark a message read or unread.
 * @param {string} id
 * @param {boolean} read
 */
export async function setMessageRead(id, read) {
  await connectDB();
  if (!mongoose.isValidObjectId(id)) throw new AdminError("Message not found.");
  const res = await ContactMessage.updateOne({ _id: id }, { $set: { read } });
  if (!res.matchedCount) throw new AdminError("Message not found.");
}

/** @param {string} id */
export async function deleteMessage(id) {
  await connectDB();
  if (!mongoose.isValidObjectId(id)) throw new AdminError("Message not found.");
  const res = await ContactMessage.deleteOne({ _id: id });
  if (!res.deletedCount) throw new AdminError("Message not found.");
}
