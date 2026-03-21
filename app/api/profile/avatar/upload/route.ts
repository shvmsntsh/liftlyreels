import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase-server";
import { checkRateLimit } from "@/lib/rate-limit";
import sharp from "sharp";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB input limit
const AVATAR_SIZE = 200; // 200x200 px — plenty for profile pics, even retina
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 10 uploads per hour
  const rl = checkRateLimit(`avatar-upload:${user.id}`, 10, 60 * 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many uploads. Try again later." }, { status: 429 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

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

  // ── Compress: resize to 200x200, crop to square, convert to WebP ──
  const rawBuffer = Buffer.from(await file.arrayBuffer());

  let compressed: Buffer;
  try {
    compressed = await sharp(rawBuffer)
      .resize(AVATAR_SIZE, AVATAR_SIZE, {
        fit: "cover", // crop to square, keeping center
        position: "centre",
      })
      .webp({ quality: 78, effort: 6 }) // ~10-20 KB per avatar
      .toBuffer();
  } catch {
    return NextResponse.json({ error: "Could not process image." }, { status: 400 });
  }

  // Use service role client for storage ops (bypasses RLS)
  const admin = createSupabaseServiceClient();

  // ── Delete previous custom avatar to save storage ──
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  if (currentProfile?.avatar_url && !currentProfile.avatar_url.startsWith("emoji:")) {
    const match = currentProfile.avatar_url.match(/avatars\/(.+?)(\?|$)/);
    if (match) {
      await admin.storage.from("avatars").remove([match[1]]);
    }
  }

  // ── Upload compressed avatar ──
  const path = `${user.id}/avatar.webp`;

  const { error: uploadError } = await admin.storage
    .from("avatars")
    .upload(path, compressed, {
      contentType: "image/webp",
      upsert: true,
    });

  if (uploadError) {
    if (uploadError.message?.includes("not found") || uploadError.message?.includes("Bucket")) {
      return NextResponse.json(
        { error: "Avatar storage not configured. Create an 'avatars' bucket in Supabase Storage with public access." },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Cache-bust: append timestamp so browsers refetch
  const {
    data: { publicUrl },
  } = admin.storage.from("avatars").getPublicUrl(path);
  const url = `${publicUrl}?v=${Date.now()}`;

  // Save to profile
  const { error: profileError } = await admin
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", user.id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ url });
}
