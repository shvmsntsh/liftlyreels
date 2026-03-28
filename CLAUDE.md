# Liftly — Claude Context File

Loaded automatically at the start of every Claude Code session. Keep this up to date.

---

## Project Summary

**Liftly** — invite-only social reels app for positive content. "Stop scrolling. Start proving."
- Users post short reels (workout tips, habits, mental health)
- Others react, comment, log impact ("I Did This"), and build streaks
- Challenge system, leaderboard, badges, commitment chains

**Deploy:** Vercel (auto-deploy from push to `main`) + Supabase cloud
**Repo:** `/Users/shivamsantosh/liftlygram` | GitHub: `shvmsntsh/liftlyreels`
**Dev:** `npm run dev` (Next.js 14 App Router, port 3000)

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 App Router (RSC + client components) |
| Auth + DB | Supabase (PostgreSQL, RLS, Auth, Storage) |
| Styling | Tailwind CSS + CSS variables (dark/light mode) |
| Animation | Framer Motion |
| Icons | Lucide React |
| Hosting | Vercel (frontend) + Supabase cloud (backend) |

---

## Key Supabase Tables

| Table | Purpose |
|---|---|
| `profiles` | username, display_name, avatar_url, bio, vibe_score, streak_current, streak_longest |
| `posts` | title, content (jsonb array), category, gradient, tags, source, author_id, views_count |
| `reactions` | user_id, post_id, reaction_type (sparked/fired_up/bookmarked) |
| `comments` | user_id, post_id, body, created_at |
| `follows` | follower_id, following_id |
| `notifications` | user_id, actor_id, type (follow/react/comment/impact), post_id |
| `impact_journal` | user_id, post_id, action_taken (text), created_at |
| `daily_challenges` | date, challenge_text, category, completions_count |
| `challenge_completions` | user_id, challenge_id, date |
| `bug_reports` | title, description, severity — also reused for content reports |
| `invites` | code, used_by, created_by |

**RPC functions:**
- `update_user_streak(user_uuid)` — updates streak_current/streak_longest
- `increment_views(post_id)` — increments posts.views_count non-blocking

---

## Auth Clients

```ts
// Server components / API routes (cookie-based)
import { createSupabaseServerClient } from "@/lib/supabase-server";

// Service role (notifications, admin writes)
import { createSupabaseServiceClient } from "@/lib/supabase-server";

// Client components
import { getSupabaseClient } from "@/lib/supabase";
```

**NEVER use `supabase.from("profiles").join(...)` for FK joins** — the profiles table references `auth.users`, not `public.profiles`. Always fetch profiles separately by `user_id` array.

---

## File Structure (Key Files)

```
app/
  page.tsx              # Landing / invite request page
  login/page.tsx        # Login (full-screen mobile layout)
  signup/page.tsx       # Signup multi-step (full-screen mobile layout)
  feed/page.tsx         # Feed (server, passes data to FeedClient)
  explore/page.tsx      # Explore / search
  challenge/page.tsx    # Daily challenge + leaderboard
  profile/[username]/page.tsx  # Profile (server)
  r/[id]/page.tsx       # Public reel share page (no auth)
  terms/page.tsx        # Terms of Service (static)
  privacy/page.tsx      # Privacy Policy (static)
  api/
    streak/route.ts     # POST: update streak (called on login + daily)
    impact/route.ts     # GET/POST: impact journal entries
    comments/route.ts   # GET/POST: comments (no FK join, separate profile fetch)
    feed/actions/route.ts  # GET: action feed from followed users
    report/route.ts     # POST: content reports → bug_reports table
    follows/list/route.ts  # GET: followers/following list

components/
  LiftlyLogo.tsx        # Canonical logo component (rounded-square + check-arrow)
  FeedClient.tsx        # Feed (3 tabs: For You / Following / Proof)
  ReelCard.tsx          # Individual reel card
  ProfileClient.tsx     # Profile page (tabs: reels/impact/new)
  ActionProofModal.tsx  # "I Did This" modal (text-only, no photo upload)
  ActionFeedTab.tsx     # Social proof feed tab
  CommentsSheet.tsx     # Comments bottom sheet
  CommitmentChain.tsx   # Personal 7/30/75-day chain tracker (localStorage)
  DailyChallengeBar.tsx # Challenge bar in feed
  StreakCelebration.tsx # Milestone streak animation overlay
  MorningMissionModal.tsx  # Daily intention setter (once/day after 5am)
  ReportSheet.tsx       # Content report bottom sheet
  FollowersSheet.tsx    # Followers/Following list bottom sheet
  StreakSheet.tsx       # Streak details bottom sheet
  TourOverlay.tsx       # First-time user tour (5-step)
  HowToPlayCard.tsx     # Dismissible how-to card on challenge page
  BottomNav.tsx         # Bottom navigation (Feed/Explore/Post/Challenge/Profile)

lib/
  types.ts              # REEL_GRADIENTS, CHALLENGE_BADGES, STREAK_RANKS, helpers
  supabase.ts           # Client-side Supabase singleton
  supabase-server.ts    # Server-side Supabase clients
```

---

## CSS Variables (Theming)

```css
--background, --foreground, --surface-1, --surface-2,
--border, --muted, --accent
```

Dark mode default. Light mode toggled via `data-theme="light"` on `<html>`. CSS variables defined in `app/globals.css`.

---

## Known TypeScript Quirks

- **Framer Motion ease arrays**: must cast as `[number, number, number, number]` to satisfy tuple type
- **Set spread**: use `Array.from(new Set(...))` not `[...new Set(...)]` (TS2802)
- **Supabase RPC non-awaited**: use `void supabase.rpc(...)` not `.catch()`
- **Pre-existing errors in `app/page.tsx`**: Framer Motion `Variants` type errors are non-blocking (Next.js builds fine)

---

## Feature Status (as of v1.12 — Mar 27 2026)

| Feature | Status |
|---|---|
| Auth (invite-only signup, login) | ✅ Done |
| Feed (For You / Following / Proof tabs) | ✅ Done |
| Reels (post, react, comment, share) | ✅ Done |
| Impact logging ("I Did This" — text only) | ✅ Done (photo upload deferred post-PMF) |
| Daily challenges + leaderboard | ✅ Done |
| Commitment chains (7/30/75-day) | ✅ Done |
| Streak system + rank badges | ✅ Done |
| Streak celebrations on milestone | ✅ Done |
| Morning Mission modal | ✅ Done |
| Public reel share page /r/{id} | ✅ Done |
| Content reporting / flag | ✅ Done |
| Followers / Following sheets | ✅ Done |
| First-time user tour | ✅ Done |
| Explore / search | ✅ Done |
| Notifications | ✅ Done |
| Light / dark mode | ✅ Done |
| Profile editing | ✅ Done |
| LiftlyLogo canonical component | ✅ Done |
| Photo upload (impact proof) | ⏳ Deferred post-PMF |
| Push notifications | ⏳ Future |

---

## Build Rules

- **No photo uploads on Vercel free tier** — text-only proof logging for MVP
- **No PostgREST FK joins on profiles** — always fetch separately
- **No new DB tables without user confirmation** — reuse existing tables when possible
- **localStorage keys**: `liftly-tour-complete`, `liftly-streak-date`, `liftly-mission-date`, `liftly-commitment-chain`
- **Changelog**: always add entry to `CHANGELOG` array in `components/ProfileClient.tsx` before each deploy

---

## Deployment Checklist

1. `npx tsc --noEmit` — check for TS errors (ignore pre-existing `app/page.tsx` errors)
2. Update `CHANGELOG` in `components/ProfileClient.tsx`
3. `git add` specific files (not `git add .` to avoid accidental inclusions)
4. `git commit -m "..."` with clear session summary
5. `git push origin main` — triggers Vercel auto-deploy
6. If new Supabase tables/functions needed, note SQL for user to run in Supabase SQL Editor

---

## Session History Summary

| Session | Key Changes |
|---|---|
| Session 1 | Identity shift, landing page, invite system |
| Session 2 | Proof Feed, Morning Mission, Streak Celebrations |
| Session 3 | Public reels /r/{id}, 7-day chain tracker |
| Session 4 | Commitment Chains, weekly activity tracker, proof tab on other profiles |
| Session 5 | Report/flag, ToS, Privacy, terms links |
| Session 6 | LiftlyLogo component, mobile-app login/signup redesign |
