import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { uploadImage, cloudinaryConfigured } from "@/lib/cloudinary";

// Allow a little headroom for image uploads (we downscale client-side first).
export const maxDuration = 30;

/**
 * Receives an image file from the admin's browser and forwards it to Cloudinary
 * server-side. The browser only ever talks to our own domain.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!cloudinaryConfigured()) {
    return NextResponse.json(
      { error: "Cloudinary isn't configured yet. Add the keys to .env." },
      { status: 503 },
    );
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "Please upload an image file." },
      { status: 400 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;
    const { url, publicId } = await uploadImage(dataUri);
    return NextResponse.json({ url, publicId });
  } catch (err) {
    console.error("[upload] Cloudinary upload failed:", err);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 502 },
    );
  }
}
