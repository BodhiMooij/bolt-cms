import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { SpacesClient } from "./spaces-client";

export const metadata: Metadata = {
    title: "My spaces",
};

async function getSpaces() {
    const user = await getSessionUser();
    if (!user) return [];
    return prisma.space.findMany({
        where: {
            OR: [
                { userId: user.id },
                { spaceMembers: { some: { userId: user.id } } },
            ],
        },
        orderBy: { name: "asc" },
        select: {
            id: true,
            name: true,
            identifier: true,
            userId: true,
            updatedAt: true,
            user: {
                select: { name: true, email: true, image: true },
            },
            spaceMembers: {
                select: {
                    user: {
                        select: { name: true, email: true, image: true },
                    },
                },
            },
            _count: {
                select: {
                    entries: true,
                    components: true,
                    contentTypes: true,
                },
            },
        },
    });
}

async function getFavoriteSpaceIds(userId: string): Promise<string[]> {
    const rows = await prisma.spaceFavorite.findMany({
        where: { userId },
        select: { spaceId: true },
    });
    return rows.map((r: { spaceId: string }) => r.spaceId);
}

export default async function AdminSpacesPage() {
    const user = await getSessionUser();
    if (!user) redirect("/login");
    let spaces: Awaited<ReturnType<typeof getSpaces>> = [];
    let favoriteIds: string[] = [];
    let error: string | null = null;
    try {
        [spaces, favoriteIds] = await Promise.all([
            getSpaces(),
            getFavoriteSpaceIds(user.id),
        ]);
    } catch (e) {
        error = e instanceof Error ? e.message : "Failed to load spaces";
    }

    return (
        <div className="flex flex-1 flex-col items-center px-4 py-8 sm:px-6 md:py-12 lg:py-16">
            <div className="w-full max-w-3xl">
                {error && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                        {error}
                    </div>
                )}

                {!error && (
                    <SpacesClient
                        spaces={spaces.map((s) => {
                            const { user: _owner, spaceMembers, ...rest } = s;
                            return {
                                ...rest,
                                updatedAt: s.updatedAt.toISOString(),
                                ownerImage: s.user?.image ?? null,
                                ownerName: s.user?.name ?? s.user?.email ?? null,
                                sharedWith: spaceMembers.map((m) => ({
                                    name: m.user?.name ?? m.user?.email ?? null,
                                    image: m.user?.image ?? null,
                                })),
                            };
                        })}
                        favoriteIds={favoriteIds}
                        title="My spaces"
                        subtitle="Overview of your projects. Each space has its own entries, components, and content types."
                    />
                )}
            </div>
        </div>
    );
}
