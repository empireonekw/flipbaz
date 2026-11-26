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
 */
import { createServer } from "node:http";
import next from "next";
import { attachSocketServer } from "./lib/socket-server.js";

const dev = !process.argv.includes("--production") && process.env.NODE_ENV !== "production";
const portArg = process.argv.find((a) => a.startsWith("--port="))?.split("=")[1];
const port = Number(portArg || process.env.PORT) || 3000;
const hostname = process.env.HOST || "localhost";

const httpServer = createServer();
const app = next({ dev, hostname, port, httpServer });
const handle = app.getRequestHandler();

await app.prepare();

// Next handles every HTTP request; Socket.IO (attached below) wraps this
// listener and takes only /socket.io/ traffic for itself.
httpServer.on("request", (req, res) => handle(req, res));
attachSocketServer(httpServer);

httpServer.listen(port, hostname, () => {
  console.log(`> Flip Baz ready on http://${hostname}:${port} (${dev ? "development" : "production"}, chat sockets on)`);
});
