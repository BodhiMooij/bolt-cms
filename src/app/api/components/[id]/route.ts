import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, canEditSpace } from "@/lib/api-auth";

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await requireSession();
    if (!session.ok) {
        return NextResponse.json({ error: session.error }, { status: session.status });
    }
    const { id } = await params;
    const component = await prisma.component.findUnique({
        where: { id },
        select: { id: true, spaceId: true },
    });
    if (!component) {
        return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }
    const edit = await canEditSpace(component.spaceId, session.userId);
    if (!edit.ok) {
        return NextResponse.json({ error: edit.error }, { status: edit.status });
    }
    await prisma.component.delete({ where: { id } });
    return NextResponse.json({ ok: true });
}
