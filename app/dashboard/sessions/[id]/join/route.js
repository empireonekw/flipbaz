import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { LiveSession, JOIN_OPENS_MINUTES } from "@/lib/models";
import { getMemberAccess } from "@/lib/membership";

/**
 * GET /dashboard/sessions/[id]/join
 * Sends an active member to the session's meeting link, but only from
 * JOIN_OPENS_MINUTES before the start until it ends. The link is never put in
 * the page, so it can't be copied ahead of time by non-members.
 */
export async function GET(request, { params }) {
  const { id } = await params;
  const home = new URL("/dashboard", request.url);

  const access = await getMemberAccess();
  if (!access.user) return NextResponse.redirect(new URL(`/login?next=/dashboard`, request.url));
  if (!access.isMember) return NextResponse.redirect(new URL("/dashboard/membership", request.url));
  if (!mongoose.isValidObjectId(id)) return NextResponse.redirect(home);

  await connectDB();
  const s = await LiveSession.findOne({ _id: id, active: true }).lean();
  if (!s) return NextResponse.redirect(home);

  const now = Date.now();
  const start = new Date(s.startsAt).getTime();
  const end = start + s.durationMinutes * 60000;
  if (now < start - JOIN_OPENS_MINUTES * 60000 || now > end) return NextResponse.redirect(home);

  try {
    const target = new URL(s.joinUrl);
    if (target.protocol !== "https:") return NextResponse.redirect(home);
    return NextResponse.redirect(target);
  } catch {
    return NextResponse.redirect(home);
  }
}
