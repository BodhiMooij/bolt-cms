import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import { getSessionUser, canAccessSpace } from "@/lib/api-auth";

export const metadata: Metadata = {
    title: "Space dashboard",
};

export default async function AdminDashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ space?: string }>;
}) {
    const user = await getSessionUser();
    if (!user) redirect("/login");
    const { space: spaceId } = await searchParams;

    if (!spaceId) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                    <p>Select a space to view its dashboard.</p>
                    <Link href="/admin" className="mt-2 inline-block text-sm font-medium underline">
                        My spaces
                    </Link>
                </div>
            </div>
        );
    }

    const access = await canAccessSpace(spaceId, user.id);
    if (!access.ok) redirect("/admin");

    const space = await prisma.space.findUnique({
        where: { id: spaceId },
        select: { id: true, name: true, updatedAt: true },
    });
    if (!space) redirect("/admin");

    const lastUpdated = space.updatedAt.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
            <div className="mb-8 flex flex-row items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                        {space.name}
                    </h1>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        Last updated {lastUpdated}
                    </p>
                </div>
                <Link
                    href={`/admin/settings?space=${space.id}`}
                    className="shrink-0 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                    Space settings
                </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <Link
                    href={`/admin/entries?space=${space.id}`}
                    className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300 hover:shadow dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                >
                    <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                        Content entries
                    </span>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        Create and edit pages and content.
                    </p>
                </Link>
                <Link
                    href={`/admin/settings?space=${space.id}`}
                    className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300 hover:shadow dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                >
                    <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                        Settings
                    </span>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        Tokens, sharing, and space options.
                    </p>
                </Link>
            </div>
        </div>
    );
}
