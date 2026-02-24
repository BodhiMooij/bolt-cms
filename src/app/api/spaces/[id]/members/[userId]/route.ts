import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, canEditSpace } from "@/lib/api-auth";

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string; userId: string }> }
) {
    const session = await requireSession();
    if (!session.ok) {
        return NextResponse.json({ error: session.error }, { status: session.status });
    }
    const { id: spaceId, userId: targetUserId } = await params;
    const access = await canEditSpace(spaceId, session.userId);
    if (!access.ok) {
        return NextResponse.json({ error: access.error }, { status: access.status });
    }
    const deleted = await prisma.spaceMember.deleteMany({
        where: { spaceId, userId: targetUserId },
    });
    if (deleted.count === 0) {
        return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
}
