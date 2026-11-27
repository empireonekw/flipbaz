import { connectDB } from "@/lib/db";
import { Payment, ProductRequest } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth/dal";
import { PRIVATE_FOLDERS, readUpload } from "@/lib/storage";

/**
 * GET /uploads/[folder]/[name]
 * Serves files saved by lib/storage.js. Product and category images are
 * public; payment screenshots and custom-request photos are visible only to
 * the seller who uploaded them and to admins.
 */
export async function GET(_request, { params }) {
  const { folder, name } = await params;

  if (PRIVATE_FOLDERS.includes(folder)) {
    const user = await getCurrentUser();
    if (!user) return new Response("Not found", { status: 404 });
    if (user.role !== "ADMIN") {
      await connectDB();
      const url = `/uploads/${folder}/${name}`;
      const owns =
        folder === "payments"
          ? await Payment.exists({ user: user.id, screenshotUrl: url })
          : folder === "requests"
            ? await ProductRequest.exists({ seller: user.id, $or: [{ images: url }, { image: url }] })
            : null;
      if (!owns) return new Response("Not found", { status: 404 });
    }
  }

  const file = await readUpload(folder, name);
  if (!file) return new Response("Not found", { status: 404 });

  return new Response(file.bytes, {
    headers: {
      "Content-Type": file.contentType,
      "X-Content-Type-Options": "nosniff",
      // Uploads are images only; never let one run script or be framed.
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
      "Cross-Origin-Resource-Policy": "same-origin",
      "Cache-Control": PRIVATE_FOLDERS.includes(folder)
        ? "private, no-store"
        : "public, max-age=31536000, immutable",
    },
  });
}
