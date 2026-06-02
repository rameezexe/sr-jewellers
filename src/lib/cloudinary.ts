import "server-only";
import { v2 as cloudinary } from "cloudinary";

/**
 * Cloudinary holds all product photos. Uploads go *through our own server*
 * (the admin's browser sends the file to /api/admin/upload, and the server
 * forwards it to Cloudinary). This keeps the API secret server-side AND means
 * the browser never has to reach cloudinary.com directly — important on
 * networks that block it. Image *display* likewise flows through Next.js image
 * optimization (/_next/image), so only the server talks to Cloudinary.
 */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const UPLOAD_FOLDER = "sr-jewellers/products";

/** Upload an image (passed as a base64 data URI) to Cloudinary. */
export async function uploadImage(dataUri: string) {
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: UPLOAD_FOLDER,
    resource_type: "image",
  });
  return { url: result.secure_url, publicId: result.public_id };
}

/** Delete an asset when a product image is removed. Best-effort. */
export async function deleteImage(publicId: string): Promise<void> {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Cloudinary delete failed for", publicId, err);
  }
}

/** Whether Cloudinary env vars are present (used to show setup hints). */
export function cloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}
