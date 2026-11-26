/**
 * Bridge from app code to the Socket.IO server started in server.js.
 *
 * server.js stores its io instance on globalThis; app code running in the same
 * process can push events through these helpers. If the app runs without the
 * custom server (e.g. plain `next dev`), they silently do nothing: data is
 * still saved and shows up on the next page load.
 *
 * Plain relative imports only, so server.js can use this file too.
 */

/** @returns {import("socket.io").Server | null} */
export function getIO() {
  return globalThis.__flipBazIO ?? null;
}

/** Room name for one user's sockets. */
export const userRoom = (userId) => `user:${userId}`;
/** Room every connected admin joins. */
export const ADMIN_ROOM = "admins";

/**
 * Emit an event to all of a user's open tabs/devices.
 * @param {string} userId
 * @param {string} event
 * @param {unknown} payload
 */
export function emitToUser(userId, event, payload) {
  getIO()?.to(userRoom(String(userId))).emit(event, payload);
}

/**
 * Emit an event to every connected admin.
 * @param {string} event
 * @param {unknown} payload
 */
export function emitToAdmins(event, payload) {
  getIO()?.to(ADMIN_ROOM).emit(event, payload);
}
