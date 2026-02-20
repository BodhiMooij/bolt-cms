import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api-auth";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await requireSession();
    if (!session.ok) {
        return NextResponse.json({ error: session.error }, { status: session.status });
    }

    const id = (await params).id;
    await prisma.accessToken.deleteMany({ where: { id } });
    return NextResponse.json({ ok: true });
}
