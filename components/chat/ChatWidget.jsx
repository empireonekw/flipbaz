"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import ChatThread from "./ChatThread";
import ChatComposer from "./ChatComposer";
import ShellIcon from "@/components/dashboard/shell/icons";
import { getSocket, request } from "@/lib/socket-client";

/**
 * Seller support chat: floating bubble + panel, live over Socket.IO.
 * Opens automatically when the URL has ?chat=open (used by "Support replied"
 * updates).
 * @param {{ firstName: string }} props
 */
export default function ChatWidget({ firstName }) {
  const openFromUrl = useSearchParams().get("chat") === "open";
  const [open, setOpen] = useState(openFromUrl);
  const [connected, setConnected] = useState(false);
  const [unread, setUnread] = useState(0);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [typing, setTyping] = useState(null);
  const [error, setError] = useState("");
  const openRef = useRef(open);
  const typingTimer = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const addMessage = useCallback((m) => {
    setMessages((list) => (list.some((x) => x._id === m._id) ? list : [...list, m]));
  }, []);

  // Connect once; keep the unread badge live even while closed.
  useEffect(() => {
    const socket = getSocket();
    const onConnect = () => {
      setConnected(true);
      setError("");
      request("chat:unread").then((r) => !openRef.current && setUnread(r.unread)).catch(() => {});
    };
    const onDisconnect = () => setConnected(false);
    const onMessage = (m) => {
      addMessage(m);
      if (m.role === "ADMIN") {
        setTyping(null);
        if (openRef.current && document.visibilityState === "visible") request("chat:read").catch(() => {});
        else setUnread((n) => n + 1);
      }
    };
    const onTyping = (t) => {
      if (t.role !== "ADMIN") return;
      setTyping("Flip Baz team is typing…");
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(null), 3500);
    };
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", () => setConnected(false));
    socket.on("chat:message", onMessage);
    socket.on("chat:typing", onTyping);
    if (socket.connected) onConnect();
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("chat:message", onMessage);
      socket.off("chat:typing", onTyping);
      clearTimeout(typingTimer.current);
    };
  }, [addMessage]);

  // Load history the first time the panel opens (and once connected).
  useEffect(() => {
    if (!open || !connected) return;
    request("chat:read").catch(() => {});
    if (loaded) return;
    request("chat:history")
      .then((r) => {
        setMessages(r.messages);
        setHasMore(r.hasMore);
        setLoaded(true);
      })
      .catch((e) => setError(e.message));
  }, [open, connected, loaded]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function loadOlder() {
    const before = messages[0]?.createdAt;
    if (!before) return;
    const r = await request("chat:history", { before }).catch((e) => setError(e.message));
    if (r) {
      setMessages((list) => [...r.messages.filter((m) => !list.some((x) => x._id === m._id)), ...list]);
      setHasMore(r.hasMore);
    }
  }

  async function send(body) {
    setError("");
    try {
      const r = await request("chat:send", { body });
      addMessage(r.message);
    } catch (e) {
      setError(e.message);
      throw e;
    }
  }

  function toggle() {
    setOpen((o) => !o);
    setUnread(0);
  }

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="Chat with Flip Baz support"
          className="fixed inset-x-0 bottom-0 z-50 flex h-[85dvh] flex-col overflow-hidden rounded-t-3xl border border-line bg-page shadow-2xl sm:inset-x-auto sm:bottom-24 sm:right-6 sm:h-[34rem] sm:w-[24rem] sm:rounded-3xl"
        >
          <div className="flex items-center justify-between gap-3 bg-[#0f1714] px-4 py-3 text-white">
            <div>
              <p className="font-bold">Flip Baz support</p>
              <p className="flex items-center gap-1.5 text-xs text-white/70">
                <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-400" : "bg-white/40"}`} aria-hidden="true" />
                {connected ? "Online · Mon–Sat, 10am–7pm" : "Connecting…"}
              </p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat" className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10">
              <ShellIcon name="close" />
            </button>
          </div>

          <ChatThread
            messages={messages}
            mine="SELLER"
            typing={typing}
            hasMore={hasMore}
            onLoadOlder={loadOlder}
            empty={
              loaded ? (
                <div className="mx-auto mt-6 max-w-xs rounded-2xl bg-surface-2/70 p-4 text-center text-sm text-muted">
                  <p className="font-semibold text-ink">Hi {firstName}!</p>
                  <p className="mt-1">Ask us anything about products, orders or payments. A real person on our team will reply here.</p>
                </div>
              ) : (
                <p className="mt-6 text-center text-sm text-muted">Loading messages…</p>
              )
            }
          />
          {error && (
            <p role="alert" className="border-t border-line bg-red-50 px-4 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </p>
          )}
          <ChatComposer onSend={send} onTyping={() => getSocket().emit("chat:typing", {})} disabled={!connected} autoFocus />
        </div>
      )}

      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-label={open ? "Close support chat" : unread ? `Open support chat, ${unread} new` : "Open support chat"}
        aria-expanded={open}
        className="fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#0f1714] text-white shadow-xl ring-1 ring-white/10 transition hover:scale-105 sm:bottom-6 sm:right-6"
      >
        <ShellIcon name={open ? "close" : "chat"} className="h-6 w-6" />
        {!open && unread > 0 && (
          <span className="absolute -right-1 -top-1 min-w-6 rounded-full bg-accent-500 px-1.5 text-center text-xs font-bold leading-6 text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </>
  );
}
