import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireReadAccess } from "@/lib/access-token";
import { requireSession, resolveDefaultSpaceForUser, canAccessSpace, canEditSpace } from "@/lib/api-auth";

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

export async function POST(request: NextRequest) {
    const session = await requireSession();
    if (!session.ok) {
        return NextResponse.json({ error: session.error }, { status: session.status });
    }
    const body = await request.json().catch(() => ({}));
    const { name, type, spaceId: bodySpaceId } = body;
    const space = bodySpaceId
        ? await prisma.space.findFirst({ where: { id: bodySpaceId } })
        : await resolveDefaultSpaceForUser(session.userId);
    if (!space) {
        return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }
    const edit = await canEditSpace(space.id, session.userId);
    if (!edit.ok) {
        return NextResponse.json({ error: edit.error }, { status: edit.status });
    }
    const displayName = typeof name === "string" && name.trim() ? name.trim() : "Untitled block";
    const machineType =
        typeof type === "string" && type.trim()
            ? type.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") || "block"
            : "block";
    const existing = await prisma.component.findUnique({
        where: { spaceId_type: { spaceId: space.id, type: machineType } },
    });
    if (existing) {
        return NextResponse.json(
            { error: "A block with this type already exists in this space" },
            { status: 409 }
        );
    }
    const schema = typeof body.schema === "object" ? JSON.stringify(body.schema) : "{}";
    const component = await prisma.component.create({
        data: {
            spaceId: space.id,
            name: displayName,
            type: machineType,
            schema,
            isRoot: body.isRoot === true,
            isNestable: body.isNestable !== false,
        },
    });
    return NextResponse.json({
        ...component,
        schema: typeof component.schema === "string" ? JSON.parse(component.schema) : component.schema,
    });
}
