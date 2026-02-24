import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession, canEditSpace } from "@/lib/api-auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await requireSession();
    if (!session.ok) {
        return NextResponse.json({ error: session.error }, { status: session.status });
    }
    const { id } = await params;
    const access = await canEditSpace(id, session.userId);
    if (!access.ok) {
        return NextResponse.json({ error: access.error }, { status: access.status });
    }
    try {
        const space = await prisma.space.findUnique({ where: { id } });
        if (!space) {
            return NextResponse.json({ error: "Space not found" }, { status: 404 });
        }
        const body = await request.json();
        const { name, identifier } = body;
        const data: { name?: string; identifier?: string } = {};
        if (name !== undefined) {
            if (typeof name !== "string" || !name.trim()) {
                return NextResponse.json(
                    { error: "name must be a non-empty string" },
                    { status: 400 }
                );
            }
            data.name = name.trim();
        }
        if (identifier !== undefined) {
            if (typeof identifier !== "string") {
                return NextResponse.json({ error: "identifier must be a string" }, { status: 400 });
            }
            const normalized = identifier
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-_]/g, "");
            if (!normalized) {
                return NextResponse.json(
                    {
                        error: "identifier must contain at least one letter, number, hyphen or underscore",
                    },
                    { status: 400 }
                );
            }
            const existing = await prisma.space.findFirst({
                where: {
                    userId: space.userId,
                    identifier: normalized,
                    id: { not: id },
                },
            });
            if (existing) {
                return NextResponse.json(
                    { error: "You already have a space with this identifier" },
                    { status: 409 }
                );
            }
            data.identifier = normalized;
        }
        if (Object.keys(data).length === 0) {
            return NextResponse.json(space);
        }
        const updated = await prisma.space.update({
            where: { id },
            data,
        });
        revalidatePath("/admin");
        revalidatePath("/api/spaces");
        return NextResponse.json(updated);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to update space" }, { status: 500 });
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await requireSession();
    if (!session.ok) {
        return NextResponse.json({ error: session.error }, { status: session.status });
    }
    const { id } = await params;
    const space = await prisma.space.findUnique({ where: { id }, select: { userId: true } });
    if (!space) {
        return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }
    if (space.userId !== session.userId) {
        return NextResponse.json(
            { error: "Only the space owner can delete it" },
            { status: 403 }
        );
    }
    try {
        await prisma.space.delete({ where: { id } });
        revalidatePath("/admin");
        revalidatePath("/api/spaces");
        return new NextResponse(null, { status: 204 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to delete space" }, { status: 500 });
    }
}
