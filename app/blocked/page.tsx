export default function BlockedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">🚫</div>
        <h1 className="text-xl font-bold text-foreground mb-2">Account Suspended</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Your account has been suspended for violating our community guidelines.
          If you believe this is a mistake, please contact support.
        </p>
      </div>
    </main>
  );
}
