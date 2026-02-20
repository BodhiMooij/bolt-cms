"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BoltLogo } from "@/components/bolt-logo";

export function AdminNav() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const spaceId = searchParams.get("space");

    const link = (href: string, label: string) => {
        const isActive = pathname === href;
        const url =
            spaceId && (href === "/admin/entries" || href === "/admin/settings")
                ? `${href}?space=${spaceId}`
                : href;
        return (
            <Link
                href={url}
                className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                    isActive
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
                        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
            >
                {label}
            </Link>
        );
    };

    if (spaceId) {
        return (
            <nav className="flex-1 space-y-0.5 p-3">
                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    This space
                </p>
                <Link
                    href="/admin"
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                    ← Back to my spaces
                </Link>
                {link("/admin/entries", "Entries")}
                {link("/admin/settings", "Settings")}
            </nav>
        );
    }

    return (
        <nav className="flex-1 space-y-0.5 p-3">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                My spaces
            </p>
            <Link
                href="/admin"
                className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                    pathname === "/admin"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
                        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
            >
                Overview
            </Link>
            <Link
                href="/admin/entries"
                className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                    pathname === "/admin/entries"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
                        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
            >
                Entries
            </Link>
            <Link
                href="/admin/tokens"
                className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                    pathname === "/admin/tokens"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
                        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
            >
                Access tokens
            </Link>
        </nav>
    );
}
