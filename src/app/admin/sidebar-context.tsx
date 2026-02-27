"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";

const SIDEBAR_EXPANDED_DEFAULT = 240;
const SIDEBAR_COLLAPSED = 72;

function isEntryEditPath(pathname: string | null): boolean {
    if (!pathname) return false;
    return /^\/admin\/entries\/[^/]+$/.test(pathname);
}

type SidebarContextValue = {
    collapsed: boolean;
    setCollapsed: (v: boolean) => void;
    width: number;
    setWidth: (v: number) => void;
    expandedWidth: number;
    sidebarWidth: number;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({
    children,
    defaultExpandedWidth = SIDEBAR_EXPANDED_DEFAULT,
}: {
    children: React.ReactNode;
    defaultExpandedWidth?: number;
}) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        setCollapsed(isEntryEditPath(pathname));
    }, [pathname]);
    const [expandedWidth, setExpandedWidth] = useState(defaultExpandedWidth);
    const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : expandedWidth;
    const setWidth = useCallback((w: number) => {
        setExpandedWidth((prev) => Math.min(320, Math.max(200, w)));
    }, []);

    return (
        <SidebarContext.Provider
            value={{
                collapsed,
                setCollapsed,
                width: expandedWidth,
                setWidth,
                expandedWidth,
                sidebarWidth,
            }}
        >
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const ctx = useContext(SidebarContext);
    if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
    return ctx;
}
