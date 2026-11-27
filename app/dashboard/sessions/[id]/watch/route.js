import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { LiveSession } from "@/lib/models";
import { getMemberAccess } from "@/lib/membership";

/**
 * GET /dashboard/sessions/[id]/watch
 * Sends an active member to a past session's recording. Like the join link,
 * the recording URL is never put in the page, so only members can reach it.
 */
export async function GET(request, { params }) {
  const { id } = await params;
  const back = new URL("/dashboard/guidance", request.url);

  const access = await getMemberAccess();
  if (!access.user) return NextResponse.redirect(new URL("/login?next=/dashboard/guidance", request.url));
  if (!access.isMember) return NextResponse.redirect(new URL("/dashboard/membership", request.url));
  if (!mongoose.isValidObjectId(id)) return NextResponse.redirect(back);

  await connectDB();
  const s = await LiveSession.findOne({ _id: id, active: true }).select("recordingUrl").lean();
  if (!s?.recordingUrl) return NextResponse.redirect(back);
  try {
    const target = new URL(s.recordingUrl);
    if (target.protocol !== "https:") return NextResponse.redirect(back);
    return NextResponse.redirect(target);
  } catch {
    return NextResponse.redirect(back);
  }
}
