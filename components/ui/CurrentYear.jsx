import { cacheLife } from "next/cache";

/**
 * The current year, cached for a day so it can be part of the prerendered
 * static shell (Cache Components forbids a bare `new Date()` there).
 */
export default async function CurrentYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}
