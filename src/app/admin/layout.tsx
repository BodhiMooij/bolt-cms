import { auth } from "@/auth";
import { AdminShell } from "./admin-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Admin",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    return (
        <div className="flex min-h-screen bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
            <AdminShell session={session}>{children}</AdminShell>
        </div>
    );
}
