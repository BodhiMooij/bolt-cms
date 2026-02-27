import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import { getSessionUser, resolveDefaultSpaceForUser, canAccessSpace } from "@/lib/api-auth";
import { BlocksListClient } from "./blocks-list-client";

export const metadata: Metadata = {
    title: "Block library",
};

export default async function AdminBlocksPage({
    searchParams,
}: {
    searchParams: Promise<{ space?: string }>;
}) {
    const user = await getSessionUser();
    if (!user) redirect("/login");
    const { space: spaceId } = await searchParams;
    let blocks: Array<{
        id: string;
        name: string;
        type: string;
        updatedAt: Date;
        isRoot: boolean;
        isNestable: boolean;
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
                blocks = await prisma.component.findMany({
                    where: { spaceId: space.id },
                    orderBy: { updatedAt: "desc" },
                    select: { id: true, name: true, type: true, updatedAt: true, isRoot: true, isNestable: true },
                });
            }
        }
    } catch (e) {
        error = e instanceof Error ? e.message : "Failed to load blocks";
    }

    const serializedBlocks = blocks.map((b) => ({
        id: b.id,
        name: b.name,
        type: b.type,
        updatedAtLabel: b.updatedAt.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        }),
        isRoot: b.isRoot,
        isNestable: b.isNestable,
    }));

    return (
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
            {error && (
                <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                    {error}
                </div>
            )}

            {!error && (
                <BlocksListClient
                    initialBlocks={serializedBlocks}
                    spaceId={spaceId ?? null}
                    spaceName={spaceName}
                />
            )}
        </div>
    );
}
