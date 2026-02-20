import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireReadAccess } from "@/lib/access-token";
import { requireSession } from "@/lib/api-auth";

const DEFAULT_SPACE = "default";

async function resolveSpace(spaceIdParam: string | undefined, tokenSpaceId: string | null) {
    const id = spaceIdParam ?? tokenSpaceId ?? undefined;
    return id
        ? prisma.space.findFirst({ where: { id } })
        : prisma.space.findFirst({ where: { identifier: DEFAULT_SPACE } });
}

export async function GET(request: NextRequest) {
    const access = await requireReadAccess();
    if (!access.allowed) {
        return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { searchParams } = new URL(request.url);
    const spaceIdParam = access.spaceId ? undefined : (searchParams.get("space") ?? undefined);
    const published = searchParams.get("published");

    try {
        const space = await resolveSpace(spaceIdParam, access.spaceId);
        if (!space) {
            return NextResponse.json(
                { error: "Space not found. Run: npx prisma db seed" },
                { status: 404 }
            );
        }

        const entries = await prisma.entry.findMany({
            where: {
                spaceId: space.id,
                ...(published === "true" ? { isPublished: true } : {}),
            },
            include: { contentType: true },
            orderBy: { updatedAt: "desc" },
        });
        return NextResponse.json(entries);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to list entries" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const session = await requireSession();
    if (!session.ok) {
        return NextResponse.json({ error: session.error }, { status: session.status });
    }

    try {
        const body = await request.json();
        const { slug, name, contentTypeId, content, spaceId: bodySpaceId } = body;

        const space = bodySpaceId
            ? await prisma.space.findFirst({ where: { id: bodySpaceId } })
            : await prisma.space.findFirst({ where: { identifier: DEFAULT_SPACE } });
        if (!space) {
            return NextResponse.json({ error: "Space not found" }, { status: 404 });
        }

        const contentType = contentTypeId
            ? await prisma.contentType.findFirst({
                  where: { id: contentTypeId, spaceId: space.id },
              })
            : await prisma.contentType.findFirst({
                  where: { spaceId: space.id, type: "page" },
              });
        if (!contentType) {
            return NextResponse.json({ error: "Content type not found" }, { status: 400 });
        }

        const entry = await prisma.entry.create({
            data: {
                spaceId: space.id,
                contentTypeId: contentType.id,
                slug: slug ?? "untitled",
                name: name ?? "Untitled",
                content: typeof content === "string" ? content : JSON.stringify(content ?? {}),
            },
            include: { contentType: true },
        });
        return NextResponse.json(entry);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to create entry" }, { status: 500 });
    }
}
