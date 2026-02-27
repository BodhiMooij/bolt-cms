"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminSidebarContent } from "./admin-sidebar-content";
import { AdminMobileHeader } from "./admin-mobile-header";
import { SidebarProvider, useSidebar } from "./sidebar-context";

type SessionUser = { name?: string | null; email?: string | null; image?: string | null };
type Session = { user?: SessionUser } | null;

const MOBILE_DRAWER_WIDTH = 280;

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };

function SidebarWithResize({ session }: { session: Session }) {
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
            className={`hidden h-screen flex-col overflow-hidden border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 md:flex md:static md:shrink-0 md:shadow-none ${
                resizing ? "select-none" : ""
            }`}
            style={{
                width: isMobile ? undefined : (width || 240),
                maxWidth: isMobile ? undefined : undefined,
            }}
            initial={false}
            animate={isMobile ? {} : { width }}
            transition={spring}
        >
            <div className="relative flex h-full flex-col overflow-hidden">
                <div className="flex h-full flex-1 flex-col overflow-y-auto">
                    <AdminSidebarContent session={session} />
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
    return (
        <SidebarProvider>
            <div className="flex h-screen w-full overflow-hidden">
                <AdminMobileHeader session={session} />

                <SidebarWithResize session={session} />

                <main className="min-h-0 min-w-0 flex-1 overflow-auto pt-14 md:pt-0">{children}</main>
            </div>
        </SidebarProvider>
    );
}
