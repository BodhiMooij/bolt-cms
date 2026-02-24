import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, canEditSpace } from "@/lib/api-auth";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await requireSession();
    if (!session.ok) {
        return NextResponse.json({ error: session.error }, { status: session.status });
    }

    const id = (await params).id;
    const token = await prisma.accessToken.findUnique({
        where: { id },
        select: { spaceId: true },
    });
    if (!token) {
        return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }
    if (token.spaceId) {
        const access = await canEditSpace(token.spaceId, session.userId);
        if (!access.ok) {
            return NextResponse.json({ error: access.error }, { status: access.status });
        }
    }
    await prisma.accessToken.deleteMany({ where: { id } });
    return NextResponse.json({ ok: true });
}
