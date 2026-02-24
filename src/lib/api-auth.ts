import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export type SessionUser = { id: string; email: string | null };

/** Get current user from session (our DB user id). Returns null if not logged in. */
export async function getSessionUser(): Promise<SessionUser | null> {
    const session = await auth();
    const authUser = session?.user;
    if (!authUser?.email) return null;

    const dbUserId = (authUser as { dbUserId?: string }).dbUserId;
    if (dbUserId) {
        const user = await prisma.user.findUnique({
            where: { id: dbUserId },
            select: { id: true, email: true },
        });
        if (user) return user;
    }

    // Session exists but DB user missing (e.g. first login, stale token, or DB was reset): find or create by email
    try {
        const user = await prisma.user.upsert({
            where: { email: authUser.email },
            create: {
                email: authUser.email,
                name: authUser.name ?? null,
                image: authUser.image ?? null,
            },
            update: {},
            select: { id: true, email: true },
        });
        return user;
    } catch {
        return null;
    }
}

/** Require admin session for write operations. Returns 401 if not logged in. */
export async function requireSession(): Promise<
    | { ok: true; userId: string }
    | { ok: false; status: number; error: string }
> {
    const user = await getSessionUser();
    if (user) return { ok: true, userId: user.id };
    return {
        ok: false,
        status: 401,
        error: "Authentication required. Use the admin to create or edit content.",
    };
}

/** Check if the current user can access the space (owner or member). */
export async function canAccessSpace(
    spaceId: string,
    userId: string
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
    const space = await prisma.space.findUnique({
        where: { id: spaceId },
        select: { userId: true, spaceMembers: { where: { userId }, select: { id: true } } },
    });
    if (!space) return { ok: false, status: 404, error: "Space not found" };
    const isOwner = space.userId === userId;
    const isMember = space.spaceMembers.length > 0;
    if (isOwner || isMember) return { ok: true };
    return { ok: false, status: 403, error: "You do not have access to this space" };
}

/** Check if the current user can edit the space (owner or editor member). */
export async function canEditSpace(
    spaceId: string,
    userId: string
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
    const space = await prisma.space.findUnique({
        where: { id: spaceId },
        select: {
            userId: true,
            spaceMembers: { where: { userId }, select: { role: true } },
        },
    });
    if (!space) return { ok: false, status: 404, error: "Space not found" };
    if (space.userId === userId) return { ok: true };
    const member = space.spaceMembers[0];
    if (member && member.role === "editor") return { ok: true };
    return { ok: false, status: 403, error: "You do not have permission to edit this space" };
}

const DEFAULT_SPACE_IDENTIFIER = "default";

/** Spaces the user can access (owned or shared). */
export async function getSpacesForUser(userId: string) {
    return prisma.space.findMany({
        where: {
            OR: [
                { userId },
                { spaceMembers: { some: { userId } } },
            ],
        },
        orderBy: { name: "asc" },
    });
}

/** Resolve "default" space for a user: first space with identifier "default" they can access, or first space. */
export async function resolveDefaultSpaceForUser(userId: string) {
    const spaces = await getSpacesForUser(userId);
    return (
        spaces.find((s) => s.identifier === DEFAULT_SPACE_IDENTIFIER) ??
        spaces[0] ??
        null
    );
}
