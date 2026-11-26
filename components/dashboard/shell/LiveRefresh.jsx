"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket-client";

/**
 * Re-renders the current page (server data included) when a live update
 * arrives over the socket, so the Updates card and bell badge change without
 * a reload. Debounced so a burst of events causes one refresh.
 */
export default function LiveRefresh() {
  const router = useRouter();
  const timer = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    const onNotification = () => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), 400);
    };
    socket.on("notification:new", onNotification);
    return () => {
      socket.off("notification:new", onNotification);
      clearTimeout(timer.current);
    };
  }, [router]);

  return null;
}
