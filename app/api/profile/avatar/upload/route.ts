import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
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

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${user.id}/avatar-${Date.now()}.${ext}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    // If the bucket doesn't exist, try creating it (requires service role)
    if (uploadError.message?.includes("not found") || uploadError.message?.includes("Bucket")) {
      return NextResponse.json(
        {
          error:
            "Avatar storage not configured. Create an 'avatars' bucket in Supabase Storage with public access.",
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  // Save to profile
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ url: publicUrl });
}
