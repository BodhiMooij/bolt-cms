import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, getSpacesForUser, canEditSpace } from "@/lib/api-auth";
import { generateTokenSecret } from "@/lib/access-token";

export async function GET() {
    const session = await requireSession();
    if (!session.ok) {
        return NextResponse.json({ error: session.error }, { status: session.status });
    }

    const spaceIds = (await getSpacesForUser(session.userId)).map((s) => s.id);
    const tokens = await prisma.accessToken.findMany({
        where: { spaceId: { in: spaceIds } },
        orderBy: { createdAt: "desc" },
        include: { space: { select: { id: true, name: true, identifier: true } } },
    });
    return NextResponse.json(
        tokens.map((t) => ({
            id: t.id,
            name: t.name,
            tokenPrefix: t.tokenPrefix,
            spaceId: t.spaceId,
            space: t.space,
            createdAt: t.createdAt,
            lastUsedAt: t.lastUsedAt,
        }))
    );
}

export async function POST(request: NextRequest) {
    const session = await requireSession();
    if (!session.ok) {
        return NextResponse.json({ error: session.error }, { status: session.status });
    }

    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "Unnamed token";
    const spaceId = typeof body.spaceId === "string" ? body.spaceId || null : null;

    if (spaceId) {
        const edit = await canEditSpace(spaceId, session.userId);
        if (!edit.ok) {
            return NextResponse.json({ error: edit.error ?? "Space not found" }, { status: 400 });
        }
    }

    const { secret, hash, prefix } = generateTokenSecret();
    const token = await prisma.accessToken.create({
        data: { name, tokenHash: hash, tokenPrefix: prefix, spaceId },
        include: { space: { select: { id: true, name: true, identifier: true } } },
    });

    return NextResponse.json({
        id: token.id,
        name: token.name,
        tokenPrefix: token.tokenPrefix,
        spaceId: token.spaceId,
        space: token.space,
        createdAt: token.createdAt,
        token: secret,
    });
}
