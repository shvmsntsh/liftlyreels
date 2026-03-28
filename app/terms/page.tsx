import Link from "next/link";

export const metadata = {
  title: "Terms of Service — Liftly",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-10 max-w-2xl mx-auto">
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300">
        ← Back to Liftly
      </Link>

      <h1 className="mb-2 text-2xl font-black text-foreground">Terms of Service</h1>
      <p className="mb-8 text-sm text-slate-500">Last updated: March 2026</p>

      <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
        <section>
          <h2 className="mb-2 text-base font-bold text-foreground">1. Acceptance</h2>
          <p>By using Liftly, you agree to these Terms of Service. If you don&apos;t agree, don&apos;t use the app.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-foreground">2. Invite-Only Access</h2>
          <p>Liftly is currently invite-only. You need a valid invite code to create an account. Sharing, selling, or abusing invite codes is prohibited and may result in account termination.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-foreground">3. User Content</h2>
          <p>You are responsible for the content you post. By posting, you grant Liftly a license to display your content on the platform. You may not post content that is illegal, hateful, misleading, or violates others&apos; rights.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-foreground">4. Prohibited Behavior</h2>
          <ul className="mt-2 list-disc list-inside space-y-1 text-slate-400">
            <li>Spam, automated bots, or fake accounts</li>
            <li>Harassment or targeted abuse of other users</li>
            <li>Sharing misleading health, fitness, or financial advice</li>
            <li>Any activity that disrupts the platform or other users</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-foreground">5. Termination</h2>
          <p>We reserve the right to suspend or terminate accounts that violate these terms, at our sole discretion, without prior notice.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-foreground">6. Disclaimer</h2>
          <p>Liftly is provided &ldquo;as is&rdquo; without warranties of any kind. We are not responsible for user-generated content or outcomes from actions taken based on content seen in the app. Always consult qualified professionals before making significant health, fitness, or financial decisions.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-foreground">7. Changes</h2>
          <p>We may update these terms at any time. Continued use of Liftly after changes means you accept the new terms.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-foreground">8. Contact</h2>
          <p>For questions about these terms, contact us through the app&apos;s bug report feature.</p>
        </section>
      </div>
    </main>
  );
}
