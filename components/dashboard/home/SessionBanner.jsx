"use client";

import { useEffect, useState } from "react";
import ShellIcon from "@/components/dashboard/shell/icons";

const JOIN_OPENS_MS = 15 * 60 * 1000;
const pad = (n) => String(Math.max(0, n)).padStart(2, "0");

/**
 * Upcoming live session with a ticking countdown. The Join link unlocks 15
 * minutes before the start and stays open until the session ends; the link
 * itself goes through a server route that re-checks membership and timing.
 *
 * @param {{ session: { _id: string, title: string, host?: string, startsAt: string, durationMinutes: number }, isMember: boolean, whenLabel: string }} props
 */
export default function SessionBanner({ session, isMember, whenLabel }) {
  const start = new Date(session.startsAt).getTime();
  const end = start + session.durationMinutes * 60000;
  const [now, setNow] = useState(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  const left = now == null ? null : start - now;
  const live = now != null && now >= start && now < end;
  const canJoin = now != null && now >= start - JOIN_OPENS_MS && now < end;
  const totalSec = left == null ? 0 : Math.max(0, Math.floor(left / 1000));
  const days = Math.floor(totalSec / 86400);
  const parts =
    days > 0
      ? [
          [days, "days"],
          [Math.floor((totalSec % 86400) / 3600), "hrs"],
          [Math.floor((totalSec % 3600) / 60), "min"],
        ]
      : [
          [Math.floor(totalSec / 3600), "hrs"],
          [Math.floor((totalSec % 3600) / 60), "min"],
          [totalSec % 60, "sec"],
        ];

  return (
    <section aria-label="Upcoming live session" className="relative overflow-hidden rounded-[var(--radius-card)] bg-[#0f1714] p-5 text-white sm:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-brand-600/30 blur-3xl" />
      <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-medium text-white/70">
            <ShellIcon name="video" className="h-4 w-4" />
            {live ? "Live now" : "Upcoming live session"}
            {live && <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" aria-hidden="true" />}
          </p>
          <h2 className="mt-1 text-lg font-bold leading-snug sm:text-xl">{session.title}</h2>
          <p className="mt-1 text-sm text-white/70">
            {whenLabel}
            {session.host ? ` · with ${session.host}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {!live && (
            <div className="flex gap-2" role="timer" aria-live="off" aria-label="Time until it starts">
              {parts.map(([v, label]) => (
                <span key={label} className="flex w-14 flex-col items-center rounded-xl bg-white/10 py-2">
                  <span className="text-2xl font-extrabold tabular-nums">{now == null ? "--" : pad(v)}</span>
                  <span className="text-[11px] text-white/60">{label}</span>
                </span>
              ))}
            </div>
          )}
          {canJoin && isMember ? (
            <a
              href={`/dashboard/sessions/${session._id}/join`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center rounded-xl bg-accent-500 px-5 text-sm font-bold text-white hover:bg-accent-600"
            >
              Join session
            </a>
          ) : (
            <span className="text-sm font-semibold text-white/70">{isMember ? "Join opens 15 min before" : "Members only"}</span>
          )}
        </div>
      </div>
    </section>
  );
}
