import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const PHOTOS_DIR = path.join(process.cwd(), "data", "photos");
const EXTENSIONS = [".jpg", ".jpeg", ".png", ".JPG", ".JPEG", ".PNG"];

// Mime types for each extension
const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".JPG": "image/jpeg",
  ".JPEG": "image/jpeg",
  ".PNG": "image/png",
};

/**
 * Build a map of all photos: stripped enrollment → { fullPath, mimeType }
 * This is cached in memory after the first call.
 */
let photoIndex: Map<string, { filePath: string; mime: string }> | null = null;

function buildPhotoIndex(): Map<string, { filePath: string; mime: string }> {
  if (photoIndex) return photoIndex;

  photoIndex = new Map();
  try {
    const files = fs.readdirSync(PHOTOS_DIR);
    for (const file of files) {
      const ext = path.extname(file);
      if (!EXTENSIONS.includes(ext)) continue;

      const baseName = path.basename(file, ext);
      const filePath = path.join(PHOTOS_DIR, file);
      const mime = MIME[ext] || "image/jpeg";

      // Index by the full basename (e.g. "00314803122")
      if (!photoIndex.has(baseName)) {
        photoIndex.set(baseName, { filePath, mime });
      }

      // Also index by the stripped version (no leading zeros: "314803122")
      const stripped = baseName.replace(/^0+/, "");
      if (stripped && !photoIndex.has(stripped)) {
        photoIndex.set(stripped, { filePath, mime });
      }
    }
  } catch (err) {
    console.error("Failed to build photo index:", err);
  }

  return photoIndex;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ enrollment: string }> }
) {
  const { enrollment } = await params;

  if (!enrollment) {
    return new NextResponse(null, { status: 400 });
  }

  const index = buildPhotoIndex();

  // Try exact match first, then stripped
  let match = index.get(enrollment);
  if (!match) {
    const stripped = enrollment.replace(/^0+/, "");
    match = index.get(stripped);
  }
  // Also try padding with zeros (sheet sends "314803122", file is "00314803122")
  if (!match) {
    for (let pad = 1; pad <= 3; pad++) {
      const padded = enrollment.padStart(enrollment.length + pad, "0");
      match = index.get(padded);
      if (match) break;
    }
  }

  if (!match) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const buffer = fs.readFileSync(match.filePath);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": match.mime,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
