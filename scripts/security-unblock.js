/**
 * Lift IP blocks from the command line: `npm run security:unblock [ip]`
 *
 * For when you're locked out and can't reach Admin → Security. Removes the
 * saved block(s) from MongoDB; then RESTART the server (npm run dev / npm start),
 * because the running server also keeps blocks in memory.
 *
 *   npm run security:unblock            remove every saved block
 *   npm run security:unblock 1.2.3.4    remove the block for one IP
 *   npm run security:unblock ::1        localhost (IPv6), stored as its /64
 */
import { connectDB, disconnectDB, DB_NAME } from "../lib/db.js";
import { SecurityBlock } from "../lib/models/SecurityBlock.js";
import { ipKey, normalizeIp } from "../lib/security/ip.js";

const arg = process.argv[2];

if (!process.env.MONGODB_URI) {
  console.error("✖ MONGODB_URI is missing. Add it to .env.local (see .env.example).");
  process.exit(1);
}

try {
  console.log(`• Connecting to MongoDB (database "${DB_NAME}") …`);
  await connectDB();
  const filter = arg ? { ip: { $in: [arg, ipKey(normalizeIp(arg))] } } : {};
  const { deletedCount } = await SecurityBlock.deleteMany(filter);
  console.log(`✓ Removed ${deletedCount} saved block${deletedCount === 1 ? "" : "s"}${arg ? ` for ${arg}` : ""}.`);
  console.log("  Now restart the server (Ctrl+C, then npm run dev) so it forgets the block in memory too.");
} catch (err) {
  console.error(`✖ ${err.name}: ${err.message}`);
  process.exitCode = 1;
} finally {
  await disconnectDB();
}
