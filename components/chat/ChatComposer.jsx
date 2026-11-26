"use client";

import { useRef, useState } from "react";
import ShellIcon from "@/components/dashboard/shell/icons";

const MAX = 2000;

/**
 * Message box: Enter sends, Shift+Enter adds a line. Calls onTyping at most
 * every 2 seconds while the user types.
 *
 * @param {{ onSend: (text: string) => Promise<void>, onTyping?: () => void, disabled?: boolean, placeholder?: string, autoFocus?: boolean }} props
 */
export default function ChatComposer({ onSend, onTyping, disabled = false, placeholder = "Write a message…", autoFocus = false }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const lastTyping = useRef(0);

  async function submit(e) {
    e?.preventDefault();
    const body = text.trim();
    if (!body || sending || disabled) return;
    setSending(true);
    try {
      await onSend(body);
      setText("");
    } finally {
      setSending(false);
    }
  }

  function onChange(e) {
    setText(e.target.value.slice(0, MAX));
    const now = Date.now();
    if (onTyping && now - lastTyping.current > 2000) {
      lastTyping.current = now;
      onTyping();
    }
  }

  return (
    <form onSubmit={submit} method="post" className="flex items-end gap-2 border-t border-line bg-surface p-3">
      <label htmlFor="chat-input" className="sr-only">
        Message
      </label>
      <textarea
        id="chat-input"
        value={text}
        onChange={onChange}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) submit(e);
        }}
        rows={1}
        maxLength={MAX}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-line bg-page px-3 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/20 disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={disabled || sending || !text.trim()}
        aria-label="Send message"
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-white hover:bg-brand-800 disabled:opacity-40 dark:bg-brand-500 dark:text-brand-950"
      >
        <ShellIcon name="send" className="h-5 w-5" />
      </button>
    </form>
  );
}
