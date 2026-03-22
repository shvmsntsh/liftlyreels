import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { BottomNav } from "@/components/BottomNav";
import { ProfileClient } from "@/components/ProfileClient";
import { notFound } from "next/navigation";
import { PostRecord, ProfileRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: { username: string };
}) {
  if (!isSupabaseConfigured()) {
    notFound();
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", params.username.toLowerCase())
    .single();

  if (!profile) {
    notFound();
  }

  const isOwnProfile = currentUser?.id === profile.id;

  const [
    { data: posts, error: postsError },
    { data: followersData },
    { data: followingData },
    { data: isFollowingData },
    { data: impactEntries },
    { data: inviteCodes },
  ] = await Promise.all([
    supabase
      .from("posts")
      .select(`id,title,content,category,source,image_url,author_id,is_user_created,tags,views_count,gradient,audio_track,created_at`)
      .eq("author_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("follows")
      .select("follower_id")
      .eq("following_id", profile.id),
    supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", profile.id),
    currentUser
      ? supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", currentUser.id)
          .eq("following_id", profile.id)
          .single()
      : Promise.resolve({ data: null }),
    isOwnProfile
      ? supabase
          .from("impact_journal")
          .select("id,post_id,action_taken,created_at")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(10)
      : Promise.resolve({ data: [] }),
    isOwnProfile
      ? supabase
          .from("invite_codes")
          .select("code,used_by,created_at")
          .eq("created_by", profile.id)
          .is("used_by", null)
          .neq("code", profile.invite_code ?? "")
          .limit(5)
      : Promise.resolve({ data: [] }),
  ]);

  if (postsError) {
    console.error("Profile posts query error:", postsError.message);
  }

  // Author data for all posts on this page — we already have the profile
  const authorData: ProfileRecord = {
    id: profile.id,
    username: profile.username,
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
    vibe_score: profile.vibe_score,
  } as ProfileRecord;

  const fullProfile: ProfileRecord = {
    ...(profile as ProfileRecord),
    followers_count: followersData?.length ?? 0,
    following_count: followingData?.length ?? 0,
    posts_count: posts?.length ?? 0,
    is_following: Boolean(isFollowingData),
  };

  const typedPosts: PostRecord[] = (posts ?? []).map((row) => {
    return {
      id: String(row.id),
      title: String(row.title),
      content: Array.isArray(row.content) ? (row.content as string[]) : [],
      category: String(row.category),
      source: String(row.source),
      image_url: typeof row.image_url === "string" ? row.image_url : null,
      author_id: String(row.author_id),
      author: authorData,
      is_user_created: Boolean(row.is_user_created),
      tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
      views_count: Number(row.views_count ?? 0),
      gradient: typeof row.gradient === "string" ? row.gradient : "ocean",
      audio_track: typeof row.audio_track === "string" ? row.audio_track : null,
      created_at: String(row.created_at),
      reactions_summary: { sparked: 0, fired_up: 0, bookmarked: 0 },
      user_reactions: [],
      comments_count: 0,
    };
  });

  return (
    <main className="relative min-h-screen bg-background pb-28">
      <ProfileClient
        profile={fullProfile}
        posts={typedPosts}
        isOwnProfile={isOwnProfile}
        currentUserId={currentUser?.id}
        impactEntries={(impactEntries ?? []) as Array<{ id: string; post_id: string; action_taken: string; created_at: string }>}
        inviteCodes={(inviteCodes ?? []) as Array<{ code: string; used_by: string | null; created_at: string }>}
      />
      <BottomNav />
    </main>
  );
}
