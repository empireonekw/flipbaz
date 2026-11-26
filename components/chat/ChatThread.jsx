"use client";

import { useEffect, useRef } from "react";

const timeFmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Karachi" });
const dayFmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Karachi" });

/**
 * Scrollable message list shared by the seller widget and the admin inbox.
 * Messages are rendered as plain text (never HTML).
 *
 * @param {{ messages: Object[], mine: "SELLER"|"ADMIN", typing?: string | null, empty?: React.ReactNode, onLoadOlder?: () => void, hasMore?: boolean }} props
 */
export default function ChatThread({ messages, mine, typing, empty, onLoadOlder, hasMore }) {
  const endRef = useRef(null);
  const lastId = messages.at(-1)?._id;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [lastId, typing]);

  const days = messages.map((m) => dayFmt.format(new Date(m.createdAt)));
  return (
    <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4" aria-live="polite" aria-relevant="additions">
      {hasMore && (
        <div className="text-center">
          <button type="button" onClick={onLoadOlder} className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-muted hover:bg-surface-2">
            Load earlier messages
          </button>
        </div>
      )}
      {messages.length === 0 && empty}
      {messages.map((m, i) => {
        const day = days[i];
        const showDay = i === 0 || day !== days[i - 1];
        const own = m.role === mine;
        return (
          <div key={m._id}>
            {showDay && <p className="my-3 text-center text-[11px] font-semibold uppercase tracking-wide text-muted">{day}</p>}
            <div className={`flex ${own ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                  own ? "rounded-br-md bg-brand-700 text-white dark:bg-brand-600" : "rounded-bl-md border border-line bg-surface text-ink"
                }`}
              >
                {!own && <p className="mb-0.5 text-[11px] font-bold opacity-70">{m.senderName}</p>}
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={`mt-0.5 text-right text-[10px] ${own ? "text-white/70" : "text-muted"}`}>{timeFmt.format(new Date(m.createdAt))}</p>
              </div>
            </div>
          </div>
        );
      })}
      {typing && <p className="text-xs italic text-muted">{typing}</p>}
      <div ref={endRef} />
    </div>
  );
}
