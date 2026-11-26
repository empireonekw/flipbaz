/**
 * Security headers sent with every response. (No script-src CSP: Next.js App
 * Router relies on inline scripts; the directives below still block framing,
 * plugins, <base> hijacking and cross-site form posts.)
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
  // Browsers ignore HSTS over plain http (local dev); it applies once served over https.
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  // Don't advertise the framework.
  poweredByHeader: false,
  // Never ship browser source maps in production builds.
  productionBrowserSourceMaps: false,
  experimental: {
    // Payment screenshots and product photos are up to 5 MB (see lib/storage.js),
    // plus multipart overhead.
    serverActions: { bodySizeLimit: "6mb" },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
