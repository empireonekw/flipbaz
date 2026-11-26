"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * True once React has hydrated on the client (false during SSR and before
 * hydration). Forms that submit through onSubmit + startTransition use this to
 * keep their submit button disabled until the handler is attached; otherwise
 * an early tap would fall back to a native GET submit and put form data in
 * the URL.
 * @returns {boolean}
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
