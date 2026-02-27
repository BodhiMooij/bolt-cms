import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, resolveDefaultSpaceForUser, canEditSpace } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
    const session = await requireSession();
    if (!session.ok) {
        return NextResponse.json({ error: session.error }, { status: session.status });
    }
    const body = await request.json().catch(() => ({}));
    const { spaceId: bodySpaceId, entryIds } = body;
    if (!Array.isArray(entryIds) || entryIds.length === 0) {
        return NextResponse.json(
            { error: "entryIds must be a non-empty array of entry ids" },
            { status: 400 }
        );
    }
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
    const ids = entryIds.filter((id: unknown) => typeof id === "string") as string[];
    const entriesInSpace = await prisma.entry.findMany({
        where: { id: { in: ids }, spaceId: space.id },
        select: { id: true },
    });
    const validIds = new Set(entriesInSpace.map((e) => e.id));
    if (ids.some((id) => !validIds.has(id))) {
        return NextResponse.json(
            { error: "All entry ids must belong to this space" },
            { status: 400 }
        );
    }
    await prisma.$transaction(
        ids.map((id, index) =>
            prisma.entry.update({
                where: { id },
                data: { position: index },
            })
        )
    );
    return NextResponse.json({ ok: true });
}
