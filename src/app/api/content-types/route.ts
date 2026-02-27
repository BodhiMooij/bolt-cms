import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireReadAccess } from "@/lib/access-token";
import { resolveDefaultSpaceForUser, canAccessSpace } from "@/lib/api-auth";

async function resolveSpaceForRequest(
    spaceIdParam: string | undefined,
    tokenSpaceId: string | null,
    sessionUserId: string | undefined
) {
    const id = spaceIdParam ?? tokenSpaceId ?? undefined;
    if (id) return prisma.space.findFirst({ where: { id } });
    if (sessionUserId) return resolveDefaultSpaceForUser(sessionUserId);
    return null;
}

export async function GET(request: NextRequest) {
    const access = await requireReadAccess();
    if (!access.allowed) {
        return NextResponse.json({ error: access.error }, { status: access.status });
    }
    const { searchParams } = new URL(request.url);
    const spaceIdParam = access.spaceId ? undefined : (searchParams.get("space") ?? undefined);
    const space = await resolveSpaceForRequest(
        spaceIdParam,
        access.spaceId,
        access.userId
    );
    if (!space) {
        return NextResponse.json(
            { error: "Space not found. Create a space in the admin or use an API token." },
            { status: 404 }
        );
    }
    if (access.userId) {
        const ok = await canAccessSpace(space.id, access.userId);
        if (!ok.ok) {
            return NextResponse.json({ error: ok.error }, { status: ok.status });
        }
    }
    const contentTypes = await prisma.contentType.findMany({
        where: { spaceId: space.id },
        orderBy: { name: "asc" },
        select: { id: true, name: true, type: true },
    });
    return NextResponse.json(contentTypes);
}
