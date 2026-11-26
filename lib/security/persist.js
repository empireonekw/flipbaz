import { connectDB } from "../db.js";
import { SecurityBlock } from "../models/SecurityBlock.js";
import { restoreBlocks, setBlockHooks } from "./limiter.js";
import { logError } from "./log.js";

/**
 * Persist IP blocks to MongoDB (called once from server.js): loads active
 * blocks at startup, then writes each new block / unblock.
 */
export async function initBlockPersistence() {
  try {
    await connectDB();
    const active = await SecurityBlock.find({ until: { $gt: new Date() } }).lean();
    restoreBlocks(
      active.map((b) => ({
        ip: b.ip,
        reason: b.reason ?? "",
        accounts: b.accounts ?? 0,
        until: new Date(b.until).getTime(),
        createdAt: new Date(b.createdAt).getTime(),
      }))
    );
  } catch (err) {
    logError("security-restore", err);
  }

  setBlockHooks({
    onBlock: (e) => {
      SecurityBlock.updateOne(
        { ip: e.ip },
        { $set: { reason: e.reason, accounts: e.accounts, until: new Date(e.until) } },
        { upsert: true }
      ).catch((err) => logError("security-persist", err));
    },
    onUnblock: (key) => {
      SecurityBlock.deleteOne({ ip: key }).catch((err) => logError("security-persist", err));
    },
  });
}
