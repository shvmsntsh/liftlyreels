# Liftly

**Invitation-only positive reels for people serious about growth.**

Built with Next.js 14 (App Router), Supabase Auth + PostgreSQL, Tailwind CSS, Framer Motion.

---

## What is Liftly?

Liftly is an invite-only social platform for positive, actionable reels across Books, Gym, Diet, Mindset, and Wellness. Think Instagram Reels — but every piece of content makes your life better, and the app mechanics are designed to reward real-world action, not just passive consumption.

---

## Key Features

### Core
- **Invite-only access** — each user gets invite codes to share; bootstrap codes seeded in DB
- **Supabase Auth** — email + password with invite code gate on signup
- **Vertical reel feed** — snap-scroll full-screen cards with gradient backgrounds
- **⚡ Spark / 🔥 Fired Up / 🔖 Bookmarked** — three meaningful reactions (not just likes)
- **Comments** — 200-char per comment, bottom sheet UI
- **Follow/unfollow** — full social graph

### Unique Innovations
- **Impact Journal** — log real-world actions you took from a reel. 24h later you're nudged "Did you act on this?" Your profile shows your Impact Rate.
- **Streak + Vibe Score** — daily streak for showing up. Vibe Score earned from reactions received, content created, and actions logged.
- **Daily Challenge** — one community-wide challenge per day. See how many completed it. Earns +2 Vibe.
- **Create Reels** — text-based reels with 5 gradient backgrounds and tag system. +2 Vibe per reel created.
- **Ripple Effect** — visualize your invite tree. See the collective Vibe Score of everyone you brought to Liftly.
- **Blindspot Reels** — once a day, get a reel from a category you haven't engaged with
- **Micro Commitments** — set 24h or 7-day reminders on bookmarked reels
- **Gratitude Glitch** — weekly Sunday journal (what worked / what to change / who inspired you)
- **Knowledge Chains** — multi-part reel series that build on each other
- **Momentum Mode** — set preferred viewing windows for intentional consumption
- **Accountability Twins** — matched with someone with similar interests, opposite strengths
- **Creator Challenges** — top creators can set community reel challenges with deadlines

### Early Tester Perks (First 100 Users)
- 🏛️ **Founding Member badge** — permanent, no one else gets this
- 10 invite codes (vs 3 for standard users)
- **Free Pro for life** — unlimited reels, advanced analytics, custom themes
- **Bug Bounty** — report a valid bug, earn Bug Crusher badge + 50 Vibe
- **Founders Wall** — your name in the app forever

### Badges (15+ Achievements)
`founder`, `pioneer`, `bug_crusher`, `first_spark`, `streak_3/7/14/30`, `first_reel`, `impact_logger`, `ripple_1`, `challenge_5`, `vibe_100/500`, `wisdomkeeper`

### Positive Content APIs
- ZenQuotes (daily quotes)
- Curated Stoic philosophy
- NASA APOD (universe perspective shifts)
- Open Library (book reels)
- Hand-crafted life advice content

---

## Setup

### 1. Environment

```bash
cp .env.example .env.local
# Fill in: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
```

### 2. Database

Run in order in Supabase SQL Editor:
1. `supabase/schema.sql` — core tables + RLS + invite codes seed
2. `supabase/schema_v2_additions.sql` — badges, chains, premium, health integrations

### 3. Run

```bash
npm install
npm run dev
```

### 4. Seed content

```bash
npx ts-node scripts/seed.ts          # Seed 28 posts across 4 categories
npm run import:books                  # Import 16 classics from Open Library
```

Or use the positive content API to seed from external sources:
```bash
curl -X POST http://localhost:3000/api/positive-content
```

### 5. Test login

Use any seed invite code from `supabase/schema.sql`:
- `SPARK-RISE-001`, `LIFT-UP-2025`, `GLOW-UP-REELS`, `MINDSET-FIRST`, etc.

---

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page with invite code entry |
| `/login` | Email + password login |
| `/signup?code=XXX` | Create account with invite code |
| `/feed` | Main reel feed (auth required) |
| `/explore` | Trending reels by category |
| `/create` | Create a reel |
| `/challenge` | Daily challenge + leaderboard |
| `/profile/[username]` | User profile |
| `/profile/me` | Redirect to own profile |
| `/categories` | Browse by category |
| `/saved` | Bookmarked reels |
| `/early-access` | Founding member perks + bug report |

---

## Tech Stack

- **Framework:** Next.js 14 App Router
- **Database + Auth:** Supabase (PostgreSQL + RLS)
- **Styling:** Tailwind CSS + Framer Motion
- **Icons:** Lucide React
- **Language:** TypeScript 5

---

## Architecture

- Server Components for data fetching (`/feed`, `/explore`, `/profile`)
- Client Components for interactions (`ReelCard`, `CommentsSheet`, `ProfileClient`)
- `@supabase/ssr` for cookie-based auth in middleware + server components
- Middleware protects all routes except `/`, `/login`, `/signup`
- Service role client for admin operations (badge awarding, profile creation)
