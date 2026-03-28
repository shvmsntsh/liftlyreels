import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Liftly",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-10 max-w-2xl mx-auto">
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300">
        ← Back to Liftly
      </Link>

      <h1 className="mb-2 text-2xl font-black text-foreground">Privacy Policy</h1>
      <p className="mb-8 text-sm text-slate-500">Last updated: March 2026</p>

      <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
        <section>
          <h2 className="mb-2 text-base font-bold text-foreground">What we collect</h2>
          <ul className="list-disc list-inside space-y-1 text-slate-400">
            <li><strong className="text-slate-300">Account data:</strong> email, username, display name, bio, avatar</li>
            <li><strong className="text-slate-300">Activity data:</strong> reels you post, actions you log, reactions, comments, streaks</li>
            <li><strong className="text-slate-300">Usage data:</strong> basic analytics (reel views, challenge completions)</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-foreground">How we use it</h2>
          <ul className="list-disc list-inside space-y-1 text-slate-400">
            <li>Providing and improving the Liftly platform</li>
            <li>Showing your activity to people you&apos;re connected with</li>
            <li>Sending in-app notifications about activity on your posts</li>
            <li>Calculating streaks and leaderboard rankings</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-foreground">What&apos;s public</h2>
          <p>Your username, display name, avatar, posts, reactions, and logged actions are visible to other Liftly users. Your email address is never shown to other users.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-foreground">Data storage</h2>
          <p>Your data is stored securely using Supabase (hosted on AWS). We do not sell your data to third parties.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-foreground">Cookies &amp; local storage</h2>
          <p>We use browser local storage to remember your preferences (e.g., tour completion, streak date, morning mission). No third-party tracking cookies are used.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-foreground">Your rights</h2>
          <p>You can delete your account at any time through the app settings, which will remove your data. You can request a data export by contacting us through the bug report feature.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-foreground">Contact</h2>
          <p>For privacy questions or data requests, use the in-app bug report or contact us directly.</p>
        </section>
      </div>
    </main>
  );
}
