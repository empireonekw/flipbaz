/**
 * Line icons for the seller app shell (original drawings, 24×24, currentColor).
 */
const paths = {
  home: "M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1v-8.5Z",
  orders: "M5 4h14v16H5zM8.5 8.5h7M8.5 12h7M8.5 15.5h4",
  plus: "M12 5v14M5 12h14",
  catalog: "M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v4H4zM14 15h6v4h-6z",
  membership: "M4 6h16v12H4zM4 10h16M8 15h3",
  services: "M14.5 5.5a3.5 3.5 0 0 0-4.6 4.6L4 16v4h4l5.9-5.9a3.5 3.5 0 0 0 4.6-4.6l-2.3 2.3-2.4-.6-.6-2.4 2.3-2.3Z",
  finances: "M4 7h16v11H4zM4 10.5h16M16 14.5h1.5",
  analytics: "M4 20V4M4 20h16M8 16l3.5-4 3 2.5L20 8",
  guidance: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-2-1.2L14.5 3h-5l-.4 2.6a7.6 7.6 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1c.6.5 1.3.9 2 1.2l.4 2.6h5l.4-2.6c.7-.3 1.4-.7 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z",
  bell: "M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Zm4 4h4",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6 6 18",
  calendar: "M5 6h14v14H5zM5 10h14M9 3v4M15 3v4",
  phone: "M6.5 4h3l1.5 4-2 1.3a10 10 0 0 0 5.7 5.7l1.3-2 4 1.5v3a2 2 0 0 1-2 2A15.5 15.5 0 0 1 4.5 6a2 2 0 0 1 2-2Z",
  bag: "M6 8h12l-1 12H7L6 8Zm3 0V6.5a3 3 0 0 1 6 0V8",
  video: "M4 7h11v10H4zM15 10.5l5-3v9l-5-3",
  wallet: "M4 7h14a2 2 0 0 1 2 2v9H4zM4 7l11-3v3M16 13h2",
  review: "M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Zm9 2-4-4M8.5 11l1.8 1.8 3.2-3.6",
  factory: "M4 20V10l5 3V10l5 3V6h4v14H4Zm4-3h2m3 0h2",
  truck: "M3 6h11v10H3zM14 9h4l3 3v4h-7M7 19a1.8 1.8 0 1 0 0-3.6A1.8 1.8 0 0 0 7 19Zm10 0a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Z",
  cash: "M3 7h18v10H3zM12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM6 10v4M18 10v4",
  chat: "M4 5h16v11H9l-5 4V5Z",
  send: "M4 12 20 4l-6 16-2.5-6.5L4 12Z",
  chevron: "m9 6 6 6-6 6",
  arrow: "M5 12h14m-5-5 5 5-5 5",
  check: "m5 12.5 4.5 4.5L19 7.5",
  logout: "M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10",
  search: "M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Zm9.5 3-4.8-4.8",
  bookmark: "M7 4h10v16l-5-3.5L7 20V4Z",
  request: "M12 4v16M4 12h16M5.5 5.5h13v13h-13z",
  chevronDown: "m6 9 6 6 6-6",
  image: "M4 5h16v14H4zM4 16l4.5-4.5 4 4 2.5-2.5L20 18M15.5 9.5h.01",
  copy: "M9 9h11v11H9zM5 15H4V4h11v1",
  download: "M12 4v11m0 0-4-4m4 4 4-4M5 19h14",
  trash: "M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13",
};

/**
 * @param {{ name: keyof typeof paths, className?: string, strokeWidth?: number }} props
 */
export default function ShellIcon({ name, className = "h-5 w-5", strokeWidth = 1.8 }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name] ?? paths.home} />
    </svg>
  );
}
