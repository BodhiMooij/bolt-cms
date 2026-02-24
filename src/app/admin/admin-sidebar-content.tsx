"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { BladeLogo } from "@/components/blade-logo";
import { signOutAction } from "@/app/admin/actions";
import { AdminNav } from "./admin-nav";
import { useSidebar } from "./sidebar-context";
import { IconChevronLeft, IconChevronRight, IconLogout, IconSettings } from "./sidebar-icons";

const fadeTransition = { type: "spring" as const, stiffness: 300, damping: 30 };
const fade = {
    initial: { opacity: 0, width: 0 },
    animate: { opacity: 1, width: "auto" },
    exit: { opacity: 0, width: 0 },
    transition: fadeTransition,
};

type SessionUser = {
    name?: string | null;
    email?: string | null;
    image?: string | null;
};

export function AdminSidebarContent({
    session,
    onCloseMobile,
}: {
    session: { user?: SessionUser } | null;
    onCloseMobile?: () => void;
}) {
    const { collapsed, setCollapsed } = useSidebar();
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

    return (
        <>
            <div className="flex min-w-0 items-center justify-between border-b border-zinc-200 p-3 pr-14 md:pr-3 dark:border-zinc-800">
                <Link
                    href="/admin"
                    className={`flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50 ${
                        collapsed ? "justify-center w-full" : "min-w-0"
                    }`}
                >
                    <BladeLogo className="h-6 w-6 shrink-0 text-[#FF9800]" />
                    <AnimatePresence initial={false}>
                        {!collapsed && (
                            <motion.span
                                key="logo-label"
                                className="truncate"
                                {...fade}
                            >
                                Blade
                            </motion.span>
                        )}
                    </AnimatePresence>
                </Link>
                <AnimatePresence initial={false}>
                    {collapsed ? (
                        <motion.button
                            key="expand-btn"
                            type="button"
                            onClick={() => setCollapsed(false)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            aria-label="Expand sidebar"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            <IconChevronRight className="h-5 w-5" />
                        </motion.button>
                    ) : (
                        <motion.button
                            key="collapse-btn"
                            type="button"
                            onClick={() => setCollapsed(true)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            aria-label="Collapse sidebar"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            <IconChevronLeft className="h-5 w-5" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <AdminNav onNavigate={onCloseMobile} />
            </div>
            <div className="relative border-t border-zinc-200 p-3 dark:border-zinc-800" ref={userMenuRef}>
                {session?.user && (
                    <>
                        <button
                            type="button"
                            onClick={() => setUserMenuOpen((open) => !open)}
                            className={`mb-3 flex w-full min-w-0 items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                                collapsed ? "justify-center" : ""
                            }`}
                            aria-expanded={userMenuOpen}
                            aria-haspopup="true"
                            aria-label="User menu"
                        >
                            {session.user.image ? (
                                <img
                                    src={session.user.image}
                                    alt=""
                                    className="h-9 w-9 shrink-0 rounded-full object-cover"
                                />
                            ) : (
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                                    {(session.user.name ?? session.user.email ?? "?")[0].toUpperCase()}
                                </span>
                            )}
                            <AnimatePresence initial={false}>
                                {!collapsed && (
                                    <motion.div
                                        key="user-info"
                                        className="min-w-0 flex-1 overflow-hidden"
                                        {...fade}
                                    >
                                        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                            {session.user.name ?? "User"}
                                        </p>
                                        {session.user.email && (
                                            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                                                {session.user.email}
                                            </p>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </button>
                        <AnimatePresence>
                            {userMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 4 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute bottom-full left-3 right-3 z-50 mb-1 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
                                >
                                    <Link
                                        href="/admin/account"
                                        onClick={() => setUserMenuOpen(false)}
                                        className="flex w-full min-w-0 items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                                    >
                                        <IconSettings className="h-5 w-5 shrink-0" />
                                        Account settings
                                    </Link>
                                    <form action={signOutAction}>
                                        <button
                                            type="submit"
                                            className="flex w-full min-w-0 items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                                        >
                                            <IconLogout className="h-5 w-5 shrink-0" />
                                            Log out
                                        </button>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}
            </div>
        </>
    );
}
