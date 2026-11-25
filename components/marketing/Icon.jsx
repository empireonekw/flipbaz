const paths = {
  store: "M3 9.5 4.5 4h15L21 9.5M3 9.5h18M3 9.5a3 3 0 0 0 6 0m0 0a3 3 0 0 0 6 0m0 0a3 3 0 0 0 6 0M5 12v8h14v-8M10 20v-5h4v5",
  market: "M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.5L21 8H6M10 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  social: "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm5.5-9.5h.01",
  shop: "M4 21V10l8-6 8 6v11M9 21v-6h6v6",
  check: "m5 12.5 4.5 4.5L19 7.5",
  cross: "M7 7l10 10M17 7 7 17",
  whatsapp: "M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Zm-3 5.5c.3-.6.6-.6.9-.6h.6c.2 0 .4.1.6.5l.8 1.8c.1.2 0 .5-.1.6l-.5.6c-.1.2-.2.4 0 .6.8 1.3 1.8 2.1 3 2.7.2.1.4.1.6-.1l.7-.8c.2-.2.4-.2.6-.1l1.8.9c.2.1.3.3.3.5 0 .6-.3 1.3-.8 1.6-.6.4-1.5.6-2.9 0-2.3-1-4-3-4.6-4.3-.6-1.3-.3-2.3 0-2.9Z",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  shield: "M12 3 5 6v6c0 4.4 3 7.7 7 9 4-1.3 7-4.6 7-9V6l-7-3Zm-3 9 2 2 4-4",
  box: "M21 8 12 3 3 8m18 0-9 5m9-5v8l-9 5m0-8L3 8m9 5v8M3 8v8l9 5",
  tag: "M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9Zm5-4.5h.01",
  truck: "M3 6h11v10H3zM14 9h4l3 3v4h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  chat: "M4 5h16v11H8l-4 4V5Z",
  chart: "M4 20V10m6 10V4m6 16v-7m4 7H2",
  star: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.6l6.2-.9L12 3Z",
  image: "M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M15 9.5h.01",
};

/**
 * Small line icon set (original drawings, 24×24, stroke = currentColor).
 * @param {{ name: keyof paths, className?: string }} props
 */
export default function Icon({ name, className = "h-6 w-6" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name] ?? paths.check} />
    </svg>
  );
}
