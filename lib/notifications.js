import { Notification } from "./models/Notification.js";
import { emitToUser } from "./realtime.js";
import { logError } from "./security/log.js";

/**
 * Fields a notification may expose to the browser (no owner id, dedupe key, __v).
 * @param {Object} n lean notification
 */
export function toWire(n) {
  return {
    _id: String(n._id),
    type: n.type,
    title: n.title,
    body: n.body ?? "",
    href: n.href ?? "",
    readAt: n.readAt ? new Date(n.readAt).toISOString() : null,
    createdAt: new Date(n.createdAt).toISOString(),
    updatedAt: new Date(n.updatedAt ?? n.createdAt).toISOString(),
  };
}

/**
 * Create (or refresh) an entry in a user's Updates feed and push it live.
 *
 * With `key`, an existing UNREAD notification with the same key is updated
 * instead of adding a new one, so a busy chat produces one "Support replied"
 * item rather than fifty.
 *
 * Never throws: a failed notification must not break the action that caused it.
 *
 * @param {string} userId
 * @param {{ type: string, title: string, body?: string, href?: string, key?: string }} n
 * @returns {Promise<void>}
 */
export async function notify(userId, { type, title, body, href, key }) {
  try {
    const data = { type, title, body: body?.slice(0, 400), href };
    let doc;
    if (key) {
      doc = await Notification.findOneAndUpdate(
        { user: userId, key, readAt: { $exists: false } },
        { $set: { ...data, user: userId, key }, $currentDate: { updatedAt: true } },
        { upsert: true, returnDocument: "after" }
      ).lean();
    } else {
      doc = (await Notification.create({ ...data, user: userId })).toObject();
    }
    emitToUser(userId, "notification:new", toWire(doc));
  } catch (err) {
    logError("notify", err);
  }
}

/**
 * Latest notifications for a user.
 * @param {string} userId
 * @param {number} [limit]
 */
export async function listNotifications(userId, limit = 20) {
  const docs = await Notification.find({ user: userId }).sort({ updatedAt: -1 }).limit(limit).lean();
  return docs.map(toWire);
}

/**
 * Number of unread notifications.
 * @param {string} userId
 */
export function unreadNotificationCount(userId) {
  return Notification.countDocuments({ user: userId, readAt: { $exists: false } });
}

/**
 * Mark all of a user's notifications read.
 * @param {string} userId
 */
export function markAllNotificationsRead(userId) {
  return Notification.updateMany({ user: userId, readAt: { $exists: false } }, { $set: { readAt: new Date() } });
}
