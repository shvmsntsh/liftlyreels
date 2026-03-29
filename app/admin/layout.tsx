import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  if (!user) redirect("/feed");

  const navItems = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/content", label: "Content" },
    { href: "/admin/collector", label: "Collector" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top admin bar */}
      <header
        className="sticky top-0 z-50 px-4 py-3 backdrop-blur-xl"
        style={{ backgroundColor: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-sm font-black text-foreground">
              Liftly Admin
            </Link>
            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold transition"
                  style={{ color: "var(--muted)" }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <Link
            href="/feed"
            className="text-xs font-medium"
            style={{ color: "var(--muted)" }}
          >
            Back to App
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
