"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import ChatThread from "@/components/chat/ChatThread";
import ChatComposer from "@/components/chat/ChatComposer";
import { inputClass } from "@/components/ui/Field";
import { getSocket, request } from "@/lib/socket-client";

const ago = (iso) => {
  if (!iso) return "";
  const d = Date.now() - new Date(iso).getTime();
  if (d < 60e3) return "now";
  if (d < 3600e3) return `${Math.floor(d / 60e3)}m`;
  if (d < 86400e3) return `${Math.floor(d / 3600e3)}h`;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(iso));
};

/**
 * Admin support inbox: conversation list + live thread.
 * @param {{ initial: Object[] }} props  conversations rendered on the server
 */
export default function AdminChat({ initial }) {
  const [convs, setConvs] = useState(initial);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [typing, setTyping] = useState({});
  const [connected, setConnected] = useState(false);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const activeRef = useRef(null);
  const timers = useRef({});

  useEffect(() => {
    activeRef.current = activeId;
  }, [activeId]);

  const upsertConv = useCallback((c) => {
    setConvs((list) => {
      const rest = list.filter((x) => x._id !== c._id);
      const merged = activeRef.current === c._id ? { ...c, adminUnread: 0 } : c;
      return [merged, ...rest];
    });
  }, []);

  useEffect(() => {
    const socket = getSocket();
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onMessage = (m) => {
      if (m.conversation === activeRef.current) {
        setMessages((list) => (list.some((x) => x._id === m._id) ? list : [...list, m]));
        if (m.role === "SELLER") request("chat:read", { conversationId: m.conversation }).catch(() => {});
      }
      setTyping((t) => ({ ...t, [m.conversation]: null }));
    };
    const onConv = (c) => upsertConv(c);
    const onTyping = (t) => {
      if (t.role !== "SELLER") return;
      setTyping((all) => ({ ...all, [t.conversationId]: `${t.name ?? "Seller"} is typing…` }));
      clearTimeout(timers.current[t.conversationId]);
      timers.current[t.conversationId] = setTimeout(() => setTyping((all) => ({ ...all, [t.conversationId]: null })), 3500);
    };
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("chat:message", onMessage);
    socket.on("chat:conversation", onConv);
    socket.on("chat:typing", onTyping);
    if (socket.connected) onConnect();
    const allTimers = timers.current;
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("chat:message", onMessage);
      socket.off("chat:conversation", onConv);
      socket.off("chat:typing", onTyping);
      Object.values(allTimers).forEach(clearTimeout);
    };
  }, [upsertConv]);

  async function openConv(id) {
    setActiveId(id);
    setMessages([]);
    setError("");
    try {
      const r = await request("chat:history", { conversationId: id });
      setMessages(r.messages);
      setHasMore(r.hasMore);
      setConvs((list) => list.map((c) => (c._id === id ? { ...c, adminUnread: 0 } : c)));
    } catch (e) {
      setError(e.message);
    }
  }

  async function loadOlder() {
    const before = messages[0]?.createdAt;
    const r = await request("chat:history", { conversationId: activeId, before }).catch((e) => setError(e.message));
    if (r) {
      setMessages((list) => [...r.messages.filter((m) => !list.some((x) => x._id === m._id)), ...list]);
      setHasMore(r.hasMore);
    }
  }

  async function send(body) {
    setError("");
    try {
      const r = await request("chat:send", { conversationId: activeId, body });
      setMessages((list) => (list.some((x) => x._id === r.message._id) ? list : [...list, r.message]));
    } catch (e) {
      setError(e.message);
      throw e;
    }
  }

  async function search(e) {
    e.preventDefault();
    try {
      const r = await request("chat:conversations", { q });
      setConvs(r.conversations);
    } catch (err) {
      setError(err.message);
    }
  }

  const active = convs.find((c) => c._id === activeId);

  return (
    <div className="grid h-[calc(100dvh-14rem)] min-h-[28rem] grid-cols-1 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface md:grid-cols-[20rem_1fr]">
      <aside className={`flex min-h-0 flex-col border-line md:border-r ${activeId ? "hidden md:flex" : "flex"}`}>
        <form onSubmit={search} method="post" className="border-b border-line p-3" role="search">
          <label htmlFor="chat-search" className="sr-only">
            Search conversations
          </label>
          <input id="chat-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search sellers…" className={inputClass} />
        </form>
        <p className="flex items-center gap-1.5 px-4 py-2 text-xs text-muted">
          <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-stone-400"}`} aria-hidden="true" />
          {connected ? "Live" : "Connecting…"}
        </p>
        {convs.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted">No conversations yet.</p>
        ) : (
          <ul className="min-h-0 flex-1 divide-y divide-line overflow-y-auto">
            {convs.map((c) => (
              <li key={c._id}>
                <button
                  type="button"
                  onClick={() => openConv(c._id)}
                  aria-current={c._id === activeId ? "true" : undefined}
                  className={`block w-full px-4 py-3 text-left hover:bg-surface-2 ${c._id === activeId ? "bg-surface-2" : ""}`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className={`truncate text-sm ${c.adminUnread ? "font-semibold" : "font-semibold"}`}>{c.seller?.name ?? "Seller"}</span>
                    <span className="shrink-0 text-xs text-muted">{ago(c.lastMessage?.at)}</span>
                  </span>
                  <span className="mt-0.5 flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-muted">
                      {typing[c._id] ?? `${c.lastMessage?.role === "ADMIN" ? "You: " : ""}${c.lastMessage?.body ?? ""}`}
                    </span>
                    {c.adminUnread > 0 && (
                      <span className="shrink-0 rounded-full bg-accent-500 px-1.5 text-[11px] font-semibold leading-5 text-white">{c.adminUnread}</span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <section className={`min-h-0 flex-col ${activeId ? "flex" : "hidden md:flex"}`} aria-label="Conversation">
        {active ? (
          <>
            <div className="flex items-center gap-3 border-b border-line px-4 py-3">
              <button type="button" onClick={() => setActiveId(null)} className="rounded-lg px-2 py-1 text-sm font-semibold md:hidden" aria-label="Back to conversations">
                ←
              </button>
              <div className="min-w-0">
                <p className="truncate font-semibold">{active.seller?.name}</p>
                <p className="truncate text-xs text-muted">
                  {active.seller?.email}
                  {active.seller?.storeName ? ` · ${active.seller.storeName}` : ""}
                </p>
              </div>
              {active.seller?._id && (
                <Link href={`/admin/members/${active.seller._id}`} className="ml-auto shrink-0 text-sm font-semibold text-brand-700 hover:underline dark:text-brand-400">
                  Profile
                </Link>
              )}
            </div>
            <ChatThread messages={messages} mine="ADMIN" typing={typing[active._id]} hasMore={hasMore} onLoadOlder={loadOlder} />
            {error && (
              <p role="alert" className="border-t border-line bg-red-50 px-4 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-200">
                {error}
              </p>
            )}
            <ChatComposer
              key={active._id}
              onSend={send}
              onTyping={() => getSocket().emit("chat:typing", { conversationId: active._id })}
              disabled={!connected}
              placeholder={`Reply to ${active.seller?.name?.split(" ")[0] ?? "seller"}…`}
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted">Choose a conversation to reply.</div>
        )}
      </section>
    </div>
  );
}
