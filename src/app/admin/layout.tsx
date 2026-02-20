import Link from "next/link";
import { auth, signOut } from "@/auth";
import { BoltLogo } from "@/components/bolt-logo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
};

export default async function AdminLayout({
  children,
}: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex min-h-screen bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Left sidebar */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {/* Top: logo */}
        <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50"
          >
            <BoltLogo className="h-6 w-6 text-[#FF9800]" />
            Bolt
          </Link>
        </div>

        {/* Nav: My spaces */}
        <nav className="flex-1 space-y-0.5 p-3">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            My spaces
          </p>
          <Link
            href="/admin"
            className="block rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Overview
          </Link>
          <Link
            href="/admin/entries"
            className="block rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Entries
          </Link>
          <Link
            href="/admin/tokens"
            className="block rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Access tokens
          </Link>
          <Link
            href="/site"
            target="_blank"
            className="block rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            View site →
          </Link>
        </nav>

        {/* Bottom: logout */}
        <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
          {session?.user && (
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
              className="block"
            >
              <button
                type="submit"
                className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Log out
              </button>
            </form>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="min-w-0 flex-1 overflow-auto">{children}</main>
    </div>
  );
}
