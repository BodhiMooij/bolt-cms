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
        select: {
            id: true,
            name: true,
            updatedAt: true,
            _count: { select: { entries: true, components: true } },
            spaceMembers: {
                select: {
                    user: {
                        select: { name: true, email: true, image: true },
                    },
                },
            },
        },
    });
    if (!space) redirect("/admin");

    const sharedWith = space.spaceMembers.map((m) => ({
        name: m.user?.name ?? m.user?.email ?? null,
        image: m.user?.image ?? null,
    }));

    const lastUpdated = space.updatedAt.toLocaleDateString("en-US", {
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
                    className="shrink-0 flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
                >
                    <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        aria-hidden
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                    </svg>
                    Space settings
                </Link>
            </div>

            {sharedWith.length > 0 && (
                <div className="mb-8 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                    <h2 className="mb-3 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                        Shared with
                    </h2>
                    <div className="flex flex-wrap items-center gap-3">
                        {sharedWith.map((member, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-2 rounded-full bg-zinc-100 py-1 pl-1 pr-3 dark:bg-zinc-800"
                            >
                                {member.image ? (
                                    <img
                                        src={member.image}
                                        alt=""
                                        className="h-8 w-8 rounded-full object-cover"
                                    />
                                ) : (
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-xs font-medium text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                                        {(member.name ?? "?")
                                            .trim()
                                            .split(/\s+/)
                                            .map((w) => w[0])
                                            .slice(0, 2)
                                            .join("")
                                            .toUpperCase() || "?"}
                                    </span>
                                )}
                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                    {member.name ?? "Unknown"}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
                <Link
                    href={`/admin/entries?space=${space.id}`}
                    className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300 hover:shadow dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                >
                    <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                        Entries
                    </span>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                        {space._count.entries}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        Create and edit pages and content.
                    </p>
                </Link>
                <Link
                    href={`/admin/blocks?space=${space.id}`}
                    className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300 hover:shadow dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                >
                    <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                        Blocks
                    </span>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                        {space._count.components}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        Reusable blocks for your entries.
                    </p>
                </Link>
            </div>
        </div>
    );
}
