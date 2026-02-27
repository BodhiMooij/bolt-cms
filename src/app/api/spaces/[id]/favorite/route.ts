import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, canAccessSpace } from "@/lib/api-auth";

export async function POST(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await requireSession();
    if (!session.ok) {
        return NextResponse.json({ error: session.error }, { status: session.status });
    }
    const { id: spaceId } = await params;
    const access = await canAccessSpace(spaceId, session.userId);
    if (!access.ok) {
        return NextResponse.json({ error: access.error }, { status: access.status });
    }
    try {
        await prisma.spaceFavorite.upsert({
            where: {
                userId_spaceId: { userId: session.userId, spaceId },
            },
            create: { userId: session.userId, spaceId },
            update: {},
        });
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: "Failed to add favorite" }, { status: 500 });
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await requireSession();
    if (!session.ok) {
        return NextResponse.json({ error: session.error }, { status: session.status });
    }
    const { id: spaceId } = await params;
    const access = await canAccessSpace(spaceId, session.userId);
    if (!access.ok) {
        return NextResponse.json({ error: access.error }, { status: access.status });
    }
    try {
        await prisma.spaceFavorite.deleteMany({
            where: { userId: session.userId, spaceId },
        });
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: "Failed to remove favorite" }, { status: 500 });
    }
}
