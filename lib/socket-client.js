"use client";

import { io } from "socket.io-client";

/**
 * One Socket.IO connection per browser tab, shared by every component that
 * needs live updates. The session cookie authenticates it automatically.
 * @returns {import("socket.io-client").Socket}
 */
export function getSocket() {
  if (!globalThis.__flipBazSocket) {
    globalThis.__flipBazSocket = io({
      path: "/socket.io",
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnectionDelayMax: 10_000,
    });
  }
  return globalThis.__flipBazSocket;
}

/**
 * Emit with an acknowledgement, as a promise that rejects on { error } or timeout.
 * @param {string} event
 * @param {Object} payload
 * @param {number} [timeoutMs]
 */
export function request(event, payload = {}, timeoutMs = 10_000) {
  const socket = getSocket();
  return new Promise((resolve, reject) => {
    socket.timeout(timeoutMs).emit(event, payload, (err, res) => {
      if (err) return reject(new Error("The chat server didn't respond. Check your connection."));
      if (res?.error) return reject(new Error(res.error));
      resolve(res);
    });
  });
}
