"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useSidebar } from "./sidebar-context";
import { IconOverview, IconEntries, IconTokens, IconBack, IconSettings } from "./sidebar-icons";

const iconClass = "h-5 w-5 shrink-0";
const navFade = {
    initial: { opacity: 0, width: 0 },
    animate: { opacity: 1, width: "auto" },
    exit: { opacity: 0, width: 0 },
    transition: { type: "spring" as const, stiffness: 300, damping: 30 },
};

export function AdminNav({ onNavigate }: { onNavigate?: () => void } = {}) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const spaceId = searchParams.get("space");
    const { collapsed } = useSidebar();

    const link = (href: string, label: string, icon: React.ReactNode) => {
        const isActive = pathname === href;
        const url =
            spaceId &&
            (href === "/admin/dashboard" || href === "/admin/entries" || href === "/admin/settings")
                ? `${href}?space=${spaceId}`
                : href;
        return (
            <Link
                href={url}
                onClick={onNavigate}
                title={collapsed ? label : undefined}
                className={`flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium leading-normal ${
                    isActive
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
                        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                } ${collapsed ? "justify-center px-2" : ""}`}
            >
                {icon}
                <AnimatePresence initial={false}>
                    {!collapsed && (
                        <motion.span key={label} className="truncate" {...navFade}>
                            {label}
                        </motion.span>
                    )}
                </AnimatePresence>
            </Link>
        );
    };

    if (spaceId) {
        return (
            <nav className="flex-1 space-y-0.5 p-3">
                <Link
                    href="/admin"
                    onClick={onNavigate}
                    title={collapsed ? "Back to my spaces" : undefined}
                    className={`flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 ${
                        collapsed ? "justify-center px-2" : ""
                    }`}
                >
                    <IconBack className={iconClass} />
                    <AnimatePresence initial={false}>
                        {!collapsed && (
                            <motion.span key="back" className="truncate" {...navFade}>
                                My spaces
                            </motion.span>
                        )}
                    </AnimatePresence>
                </Link>
                {link("/admin/dashboard", "Dashboard", <IconOverview className={iconClass} />)}
                {link("/admin/entries", "Entries", <IconEntries className={iconClass} />)}
                {link("/admin/settings", "Settings", <IconSettings className={iconClass} />)}
            </nav>
        );
    }

    return (
        <nav className="flex-1 space-y-0.5 p-3">
            {link("/admin", "Overview", <IconOverview className={iconClass} />)}
        </nav>
    );
}
