import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireReadAccess } from "@/lib/access-token";
import { resolveDefaultSpaceForUser, canAccessSpace } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
    const access = await requireReadAccess();
    if (!access.allowed) {
        return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { searchParams } = new URL(request.url);
    const spaceIdParam = access.spaceId ? undefined : (searchParams.get("space") ?? undefined);
    const spaceId = spaceIdParam ?? access.spaceId ?? undefined;
    const space = spaceId
        ? await prisma.space.findFirst({ where: { id: spaceId } })
        : access.userId
          ? await resolveDefaultSpaceForUser(access.userId)
          : null;
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

    const components = await prisma.component.findMany({
        where: { spaceId: space.id },
        orderBy: { name: "asc" },
    });
    return NextResponse.json(
        components.map((c) => ({
            ...c,
            schema: typeof c.schema === "string" ? JSON.parse(c.schema) : c.schema,
        }))
    );
}
