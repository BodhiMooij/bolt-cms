import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import { getSessionUser, resolveDefaultSpaceForUser, canAccessSpace } from "@/lib/api-auth";
import { EntriesListClient } from "./entries-list-client";

export const metadata: Metadata = {
    title: "Entries",
};

export default async function AdminEntriesPage({
    searchParams,
}: {
    searchParams: Promise<{ space?: string }>;
}) {
    const user = await getSessionUser();
    if (!user) redirect("/login");
    const { space: spaceId } = await searchParams;
    let entries: Array<{
        id: string;
        slug: string;
        name: string;
        isPublished: boolean;
        updatedAt: Date;
        contentType: { type: string };
        createdBy: { id: string; name: string | null; email: string | null; image: string | null } | null;
    }> = [];
    let spaceName: string | null = null;
    let error: string | null = null;

    try {
        const space = spaceId
            ? await prisma.space.findFirst({ where: { id: spaceId } })
            : await resolveDefaultSpaceForUser(user.id);
        if (!space) {
            error = "No space found. Create one from My spaces.";
        } else {
            const access = await canAccessSpace(space.id, user.id);
            if (!access.ok) {
                error = access.error;
                spaceName = null;
            } else {
                spaceName = space.name;
                entries = await prisma.entry.findMany({
                    where: { spaceId: space.id },
                    include: {
                        contentType: true,
                        createdBy: { select: { id: true, name: true, email: true, image: true } },
                    },
                    orderBy: { updatedAt: "desc" },
                });
            }
        }
    } catch (e) {
        error = e instanceof Error ? e.message : "Failed to load entries";
    }

    const serializedEntries = entries.map((e) => ({
        id: e.id,
        slug: e.slug,
        name: e.name,
        isPublished: e.isPublished,
        updatedAtLabel: e.updatedAt.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        }),
        contentType: e.contentType,
        createdBy: e.createdBy,
    }));

    return (
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
            <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-2xl">
                        Entries
                    </h1>
                    {spaceName && (
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                            All pages and blocks in {spaceName}
                        </p>
                    )}
                </div>
                <Link
                    href={spaceId ? `/admin/entries/new?space=${spaceId}` : "/admin/entries/new"}
                    className="min-h-[44px] shrink-0 rounded-lg bg-zinc-900 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                    New entry
                </Link>
            </div>

            {error && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                    {error}
                </div>
            )}

            {!error && (
                <EntriesListClient entries={serializedEntries} spaceId={spaceId ?? null} />
            )}
        </div>
    );
}
