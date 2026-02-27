import Link from "next/link";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { TokensClient } from "../tokens/tokens-client";
import { DangerZoneClient } from "./danger-zone-client";
import { SpaceMembersClient } from "./space-members-client";
import { SpaceNameClient } from "./space-name-client";
import { getSessionUser, canAccessSpace, canEditSpace, getSpacesForUser } from "@/lib/api-auth";

export const metadata: Metadata = {
    title: "Space settings",
};

export default async function AdminSettingsPage({
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
                    <p>Select a space to view its settings.</p>
                    <Link href="/admin" className="mt-2 inline-block text-sm font-medium underline">
                        Back to My spaces
                    </Link>
                </div>
            </div>
        );
    }

    const access = await canAccessSpace(spaceId, user.id);
    if (!access.ok) notFound();
    const editAccess = await canEditSpace(spaceId, user.id);
    const space = await prisma.space.findUnique({
        where: { id: spaceId },
        select: {
            id: true,
            name: true,
            identifier: true,
            userId: true,
            user: { select: { id: true, email: true, name: true, image: true } },
            spaceMembers: {
                orderBy: { createdAt: "asc" },
                include: { user: { select: { id: true, email: true, name: true, image: true } } },
            },
        },
    });
    if (!space) notFound();

    const spaces = await getSpacesForUser(user.id);
    const tokens = await prisma.accessToken.findMany({
        where: { spaceId: space.id },
        orderBy: { createdAt: "desc" },
        include: { space: { select: { id: true, name: true, identifier: true } } },
    });

    return (
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
            <div className="mb-6 sm:mb-8">
                <h1 className="mt-2 text-xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-2xl">
                    Settings — {space.name}
                </h1>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{space.identifier}</p>
            </div>

            <SpaceNameClient
                spaceId={space.id}
                initialName={space.name}
                canEdit={editAccess.ok}
            />

            {/* Access tokens for this space */}
            <section className="mb-10">
                <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    Access tokens
                </h2>
                <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                    Create and manage API tokens scoped to this space. Use them in frontends to read
                    content.
                </p>
                <TokensClient
                    initialTokens={tokens.map((t) => ({
                        id: t.id,
                        name: t.name,
                        tokenPrefix: t.tokenPrefix,
                        spaceId: t.spaceId,
                        space: t.space,
                        createdAt: t.createdAt.toISOString(),
                        lastUsedAt: t.lastUsedAt?.toISOString() ?? null,
                    }))}
                    spaces={spaces}
                    defaultSpaceId={space.id}
                />
            </section>

            {/* Shared with */}
            <section className="mb-10">
                <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    Shared with
                </h2>
                <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                    Invite other accounts by email to view or edit this space. They must have signed in at least once.
                </p>
                <SpaceMembersClient
                    spaceId={space.id}
                    currentUserId={user.id}
                    canManage={editAccess.ok}
                    owner={{ id: space.user.id, email: space.user.email, name: space.user.name, image: space.user.image }}
                    initialMembers={space.spaceMembers.map((m) => ({
                        id: m.id,
                        userId: m.userId,
                        role: m.role,
                        user: m.user,
                    }))}
                />
            </section>

            {/* Roles — placeholder */}
            <section className="mb-10">
                <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    Roles
                </h2>
                <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Define roles (e.g. Editor, Publisher) and assign them to users in this
                        space. Coming soon.
                    </p>
                </div>
            </section>

            {/* Danger zone */}
            <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <DangerZoneClient
                    spaceId={space.id}
                    spaceName={space.name}
                    canEdit={editAccess.ok}
                />
            </section>
        </div>
    );
}
