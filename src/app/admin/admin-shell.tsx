"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminSidebarContent } from "./admin-sidebar-content";
import { SidebarProvider, useSidebar } from "./sidebar-context";

type SessionUser = { name?: string | null; email?: string | null; image?: string | null };
type Session = { user?: SessionUser } | null;

const MOBILE_DRAWER_WIDTH = 280;

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

function SidebarWithResize({
    session,
    mobileMenuOpen,
    onCloseMobile,
}: {
    session: Session;
    mobileMenuOpen: boolean;
    onCloseMobile: () => void;
}) {
    const { collapsed, sidebarWidth, setWidth } = useSidebar();
    const [resizing, setResizing] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const startX = useRef(0);
    const startWidth = useRef(0);

    useEffect(() => {
        const mq = window.matchMedia("(max-width: 767px)");
        setIsMobile(mq.matches);
        const listener = () => setIsMobile(mq.matches);
        mq.addEventListener("change", listener);
        return () => mq.removeEventListener("change", listener);
    }, []);

    const onResizeStart = useCallback(
        (e: React.MouseEvent) => {
            if (collapsed || isMobile) return;
            e.preventDefault();
            startX.current = e.clientX;
            startWidth.current = sidebarWidth;
            setResizing(true);
        },
        [collapsed, sidebarWidth, isMobile]
    );

    useEffect(() => {
        if (!resizing) return;
        const onMouseMove = (e: MouseEvent) => {
            const delta = e.clientX - startX.current;
            setWidth(startWidth.current + delta);
        };
        const onMouseUp = () => setResizing(false);
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };
    }, [resizing, setWidth]);

    const width = isMobile ? MOBILE_DRAWER_WIDTH : (sidebarWidth || 240);

    return (
        <motion.aside
            className={`fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden border-r border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-zinc-950/50 md:static md:inset-auto md:shrink-0 md:shadow-none ${
                resizing ? "select-none" : ""
            }`}
            style={{ maxWidth: isMobile ? "85vw" : undefined }}
            initial={false}
            animate={{
                width,
                x: isMobile ? (mobileMenuOpen ? 0 : "-100%") : 0,
            }}
            transition={spring}
        >
            <div className="relative flex h-full flex-col overflow-hidden">
                <div className="absolute right-2 top-2 z-10 md:hidden">
                    <button
                        type="button"
                        onClick={onCloseMobile}
                        className="flex h-11 w-11 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        aria-label="Close menu"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="flex h-full flex-1 flex-col overflow-y-auto pt-14 md:pt-0">
                    <AdminSidebarContent session={session} onCloseMobile={onCloseMobile} />
                </div>
                {!collapsed && !isMobile && (
                    <div
                        onMouseDown={onResizeStart}
                        className="absolute right-0 top-0 hidden h-full w-1.5 cursor-col-resize touch-none md:block hover:bg-amber-500/20"
                        aria-hidden
                    />
                )}
            </div>
        </motion.aside>
    );
}

export function AdminShell({
    session,
    children,
}: {
    session: Session;
    children: React.ReactNode;
}) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full">
                <button
                    type="button"
                    onClick={() => setMobileMenuOpen(true)}
                    className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-md ring-1 ring-zinc-200 md:hidden dark:bg-zinc-900 dark:ring-zinc-700"
                    aria-label="Open menu"
                >
                    <svg
                        className="h-6 w-6 text-zinc-600 dark:text-zinc-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.button
                            type="button"
                            aria-label="Close menu"
                            className="fixed inset-0 z-40 bg-black/50 md:hidden"
                            onClick={() => setMobileMenuOpen(false)}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        />
                    )}
                </AnimatePresence>

                <SidebarWithResize
                    session={session}
                    mobileMenuOpen={mobileMenuOpen}
                    onCloseMobile={() => setMobileMenuOpen(false)}
                />

                <main className="min-w-0 flex-1 overflow-auto pt-14 md:pt-0">{children}</main>
            </div>
        </SidebarProvider>
    );
}
