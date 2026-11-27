/**
 * Flip Baz custom server: Next.js + Socket.IO on one port.
 *
 *   npm run dev     → development (hot reload)
 *   npm run build   → production build (unchanged)
 *   npm start       → production (`node server.js --production`)
 *
 * Socket.IO powers live support chat and live "Updates". Because it needs a
 * long-running Node process, this app must run on a normal server/VPS (not
 * serverless hosting).
 *
 * Security: every request gets the resolved client IP in a trusted header
 * (CLIENT_IP_HEADER) that proxy.js, Server Actions and route handlers use for
 * rate limiting and IP blocking. Any copy of that header sent by the client is
 * removed first. Set TRUST_PROXY_HOPS when running behind Nginx/Cloudflare.
 */
import { createServer } from "node:http";
import next from "next";
import { attachSocketServer } from "./lib/socket-server.js";
import { CLIENT_IP_HEADER } from "./lib/security/config.js";
import { resolveClientIp } from "./lib/security/ip.js";
import { initBlockPersistence } from "./lib/security/persist.js";

const dev = !process.argv.includes("--production") && process.env.NODE_ENV !== "production";
// Like `next dev` / `next start`: make NODE_ENV match the mode when it isn't set,
// so code that checks it (e.g. the dev-only localhost exemption in
// lib/security/ip.js) can't mistake production for development.
process.env.NODE_ENV ||= dev ? "development" : "production";
const portArg = process.argv.find((a) => a.startsWith("--port="))?.split("=")[1];
const port = Number(portArg || process.env.PORT) || 3000;
const hostname = process.env.HOST || "localhost";

const httpServer = createServer();
const app = next({ dev, hostname, port, httpServer });
const handle = app.getRequestHandler();

await app.prepare();
await initBlockPersistence();

httpServer.on("request", (req, res) => {
  // Never trust a client-supplied copy of our internal header.
  delete req.headers[CLIENT_IP_HEADER];
  const ip = resolveClientIp(req);
  if (ip) req.headers[CLIENT_IP_HEADER] = ip;
  handle(req, res);
});
// Socket.IO wraps the listener above and takes only /socket.io/ traffic.
attachSocketServer(httpServer);

httpServer.listen(port, hostname, () => {
  console.log(`> Flip Baz ready on http://${hostname}:${port} (${dev ? "development" : "production"}, chat sockets on)`);
});
