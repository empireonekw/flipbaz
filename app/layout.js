import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

/** Display font for the public marketing site. */
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

/** Compact UI font for the seller app (`font-app`). */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: {
    default: "Flip Baz | Sell Sialkot-made products without stock",
    template: "%s | Flip Baz",
  },
  description:
    "Sell Sialkot-made leather goods, sportswear and boxing gear on your own store. We make, check and ship every order to your customer.",
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1412" },
  ],
};

/**
 * Runs before paint so the saved (or system) theme is applied without a flash.
 * Kept tiny and dependency-free on purpose.
 */
const themeScript = `(function(){try{var t=localStorage.getItem('fb-theme');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
