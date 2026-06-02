"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  addProductImageAction,
  deleteProductImageAction,
} from "@/app/admin/actions";

type Img = { id: string; url: string; alt: string };

export function ImageManager({
  productId,
  images,
}: {
  productId: string;
  images: Img[];
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        // 1. Downscale/compress in the browser so the upload stays small.
        const blob = await downscaleImage(file);

        // 2. Send to our own server, which forwards it to Cloudinary.
        const body = new FormData();
        body.append("file", blob, "photo.jpg");
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body,
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Upload failed.");
          break;
        }

        // 3. Persist the URL against the product.
        await addProductImageAction({
          productId,
          url: data.url,
          publicId: data.publicId,
        });
      }
      router.refresh();
    } catch {
      setError("Something went wrong while uploading.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {images.map((img) => (
          <div
            key={img.id}
            className="group relative aspect-square overflow-hidden rounded-lg border border-blush-deep/60 bg-blush"
          >
            <Image
              src={img.url}
              alt={img.alt}
              fill
              sizes="120px"
              className="object-cover"
            />
            <button
              disabled={pending}
              onClick={() =>
                startTransition(() => deleteProductImageAction(img.id))
              }
              className="absolute right-1 top-1 rounded-full bg-white/90 p-1.5 text-red-500 opacity-0 transition-opacity hover:bg-white group-hover:opacity-100"
              aria-label="Delete image"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-blush-deep text-center text-xs text-muted hover:border-brand hover:text-brand">
          {uploading ? "Uploading…" : "+ Add photo"}
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={uploading}
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
        </label>
      </div>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      <p className="mt-2 text-xs text-muted">
        First photo is the main image. Tip: square photos look best.
      </p>
    </div>
  );
}

/**
 * Resize an image to at most 1600px on its longest side and re-encode as JPEG.
 * Keeps uploads fast and well within serverless body limits. Falls back to the
 * original file if the browser can't process it.
 */
async function downscaleImage(file: File, maxSize = 1600): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    return blob ?? file;
  } catch {
    return file;
  }
}
