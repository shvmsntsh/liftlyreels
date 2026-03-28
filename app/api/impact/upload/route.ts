import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase-server";
import sharp from "sharp";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_DIMENSION = 800;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function getStorageClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey && serviceKey.length > 20) {
    return { client: createSupabaseServiceClient(), isAdmin: true };
  }
  return { client: createSupabaseServerClient(), isAdmin: false };
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const postId = formData.get("postId") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Use JPEG, PNG, WebP, or GIF." },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum 5 MB." },
      { status: 400 }
    );
  }

  // Compress: resize to max 800px, convert to WebP
  const rawBuffer = Buffer.from(await file.arrayBuffer());

  let compressed: Buffer;
  try {
    compressed = await sharp(rawBuffer)
      .resize(MAX_DIMENSION, MAX_DIMENSION, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 80, effort: 4 })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: "Could not process image." }, { status: 400 });
  }

  const { client: storageClient } = getStorageClient();

  // Upload to proof-photos bucket
  const timestamp = Date.now();
  const safePart = postId ? postId.slice(0, 8) : "action";
  const path = `${user.id}/${safePart}-${timestamp}.webp`;

  const { error: uploadError } = await storageClient.storage
    .from("proof-photos")
    .upload(path, compressed, {
      contentType: "image/webp",
      upsert: false,
    });

  if (uploadError) {
    // If bucket doesn't exist, fall back gracefully
    if (uploadError.message?.includes("not found") || uploadError.message?.includes("Bucket")) {
      // Try avatars bucket as fallback
      const fallbackPath = `proof/${user.id}/${safePart}-${timestamp}.webp`;
      const { error: fallbackErr } = await storageClient.storage
        .from("avatars")
        .upload(fallbackPath, compressed, {
          contentType: "image/webp",
          upsert: false,
        });

      if (fallbackErr) {
        return NextResponse.json({ error: "Storage not configured for proof photos." }, { status: 500 });
      }

      const { data: { publicUrl } } = storageClient.storage
        .from("avatars")
        .getPublicUrl(fallbackPath);

      return NextResponse.json({ url: `${publicUrl}?v=${timestamp}` });
    }
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = storageClient.storage
    .from("proof-photos")
    .getPublicUrl(path);

  return NextResponse.json({ url: `${publicUrl}?v=${timestamp}` });
}
