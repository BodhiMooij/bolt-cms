"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useRef, useEffect, useState } from "react";
import { BladeLogo } from "@/components/blade-logo";
import { signOutAction } from "@/app/admin/actions";
import { IconOverview, IconEntries, IconBlocks, IconBack, IconSettings, IconLogout } from "./sidebar-icons";

const iconClass = "h-5 w-5 shrink-0";

type SessionUser = { name?: string | null; email?: string | null; image?: string | null };

export function AdminMobileHeader({ session }: { session: { user?: SessionUser } | null }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const spaceId = searchParams.get("space");
    const scrollRef = useRef<HTMLDivElement>(null);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!userMenuOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [userMenuOpen]);

    const navLink = (href: string, label: string, icon: React.ReactNode) => {
        const isActive = pathname === href;
        const url =
            spaceId &&
            (href === "/admin/dashboard" || href === "/admin/entries" || href === "/admin/blocks" || href === "/admin/settings")
                ? `${href}?space=${spaceId}`
                : href;
        return (
            <Link
                key={href}
                href={url}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap ${
                    isActive
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
                        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
            >
                {icon}
                {label}
            </Link>
        );
    };

    const navItems = spaceId
        ? [
              navLink("/admin/dashboard", "Dashboard", <IconOverview className={iconClass} />),
              navLink("/admin/entries", "Entries", <IconEntries className={iconClass} />),
              navLink("/admin/blocks", "Blocks", <IconBlocks className={iconClass} />),
              navLink("/admin/settings", "Settings", <IconSettings className={iconClass} />),
          ]
        : [navLink("/admin", "Overview", <IconOverview className={iconClass} />)];

    return (
        <header className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center gap-2 border-b border-zinc-200 bg-white px-2 dark:border-zinc-800 dark:bg-zinc-900 md:hidden">
            {spaceId ? (
                <Link
                    href="/admin"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    aria-label="Back to my spaces"
                >
                    <IconBack className="h-5 w-5" />
                </Link>
            ) : null}
            <Link
                href="/admin"
                className="flex shrink-0 items-center py-2 pr-1"
                aria-label="Blade home"
            >
                <BladeLogo className="h-6 w-auto" iconOnly />
            </Link>
            <div
                ref={scrollRef}
                className="flex flex-1 items-center gap-1 overflow-x-auto"
                style={{ WebkitOverflowScrolling: "touch" }}
            >
                {navItems}
            </div>
            <div className="relative shrink-0 pl-1" ref={userMenuRef}>
                {session?.user && (
                    <>
                        <button
                            type="button"
                            onClick={() => setUserMenuOpen((o) => !o)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-zinc-200 hover:ring-zinc-300 dark:ring-zinc-700 dark:hover:ring-zinc-600"
                            aria-expanded={userMenuOpen}
                            aria-label="User menu"
                        >
                            {session.user.image ? (
                                <img
                                    src={session.user.image}
                                    alt=""
                                    className="h-9 w-9 rounded-lg object-cover"
                                />
                            ) : (
                                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200 text-sm font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                                    {(session.user.name ?? session.user.email ?? "?")[0].toUpperCase()}
                                </span>
                            )}
                        </button>
                        {userMenuOpen && (
                            <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                                <Link
                                    href="/admin/account"
                                    onClick={() => setUserMenuOpen(false)}
                                    className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                                >
                                    <IconSettings className="h-5 w-5 shrink-0" />
                                    Account settings
                                </Link>
                                <form action={signOutAction}>
                                    <button
                                        type="submit"
                                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                                    >
                                        <IconLogout className="h-5 w-5 shrink-0" />
                                        Log out
                                    </button>
                                </form>
                            </div>
                        )}
                    </>
                )}
            </div>
        </header>
    );
}
