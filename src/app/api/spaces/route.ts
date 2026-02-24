import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession, getSpacesForUser } from "@/lib/api-auth";
import { ensureSpaceHasContentTypes } from "@/lib/seed-space-defaults";

export async function GET() {
    const session = await requireSession();
    if (!session.ok) {
        return NextResponse.json({ error: session.error }, { status: session.status });
    }
    const spaces = await getSpacesForUser(session.userId);
    return NextResponse.json(spaces);
}

export async function POST(request: NextRequest) {
    const session = await requireSession();
    if (!session.ok) {
        return NextResponse.json({ error: session.error }, { status: session.status });
    }
    try {
        const body = await request.json();
        const { name, identifier } = body;
        if (!name || typeof name !== "string" || !identifier || typeof identifier !== "string") {
            return NextResponse.json(
                { error: "name and identifier are required" },
                { status: 400 }
            );
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
        const existing = await prisma.space.findUnique({
            where: { userId_identifier: { userId: session.userId, identifier: normalized } },
        });
        if (existing) {
            return NextResponse.json(
                { error: "You already have a space with this identifier" },
                { status: 409 }
            );
        }
        const space = await prisma.space.create({
            data: { userId: session.userId, name: name.trim(), identifier: normalized },
        });
        await ensureSpaceHasContentTypes(space.id);
        revalidatePath("/admin");
        revalidatePath("/api/spaces");
        return NextResponse.json(space);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to create space" }, { status: 500 });
    }
}
