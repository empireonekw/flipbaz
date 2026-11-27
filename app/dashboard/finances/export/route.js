import { getCurrentUser } from "@/lib/auth/dal";
import { balanceSide, getLedger, pkDay } from "@/lib/ledger";
import { LIMITS } from "@/lib/security/config";
import { checkLimit } from "@/lib/security/guard";
import { logError } from "@/lib/security/log";

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const SIDE = { DEBIT: "Debit", CREDIT: "Credit", SETTLED: "Settled" };

/**
 * One CSV cell: quoted, inner quotes doubled, and a leading ' on anything a
 * spreadsheet could run as a formula (=, +, -, @, tab, CR).
 * @param {unknown} v
 */
function cell(v) {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/**
 * GET /dashboard/finances/export?from=YYYY-MM-DD&to=YYYY-MM-DD
 * The signed-in seller's statement as CSV (oldest first), same range and
 * running balances as the Finances page.
 */
export async function GET(request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SELLER") return new Response("Not found", { status: 404 });

  const limited = checkLimit("ledger-export", user.id, LIMITS.listingDownload);
  if (limited) return new Response(limited.error, { status: 429 });

  const params = new URL(request.url).searchParams;
  let from = DAY.test(params.get("from") ?? "") ? params.get("from") : undefined;
  let to = DAY.test(params.get("to") ?? "") ? params.get("to") : undefined;
  if (from && to && from > to) [from, to] = [to, from];

  try {
    const ledger = await getLedger(user.id, { from, to });
    const rows = [["Date", "Reference", "Description", "Details", "Debit (PKR)", "Credit (PKR)", "Balance (PKR)", "Balance type"]];
    if (ledger.opening != null) rows.push([from, "", "Opening balance", "", "", "", Math.abs(ledger.opening), SIDE[balanceSide(ledger.opening)]]);
    for (const e of [...ledger.entries].reverse()) {
      rows.push([pkDay(e.date), e.reference, e.title, e.detail, e.debit || "", e.credit || "", Math.abs(e.balance), SIDE[balanceSide(e.balance)]]);
    }
    // BOM so Excel opens it as UTF-8.
    const csv = "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
    const name = `flipbaz-statement${from ? `-from-${from}` : ""}${to ? `-to-${to}` : ""}.csv`;
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${name}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    logError("ledger-export", err);
    return new Response("Something went wrong. Please try again.", { status: 500 });
  }
}
