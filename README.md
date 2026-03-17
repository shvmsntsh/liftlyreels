# Liftly Reels

Mobile-first microlearning reels built with Next.js 14, Tailwind CSS, and Supabase.

## Local setup

1. Copy envs and fill in your Supabase values:

```bash
cp .env.example .env.local
```

2. Run the SQL in [`supabase/schema.sql`](./supabase/schema.sql).

3. Install and start the app:

```bash
npm install
npm run dev
```

4. Seed sample posts:

```bash
npx ts-node scripts/seed.ts
```

## Included in this MVP

- Reel-style `/feed` with one lesson per screen
- `/categories` with live counts
- `/saved` backed by local storage so content never disappears
- Supabase fetch helper with fallback content when envs or tables are missing
- Simple schema and a TypeScript seed script
