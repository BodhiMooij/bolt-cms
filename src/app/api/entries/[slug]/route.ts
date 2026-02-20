import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireReadAccess } from "@/lib/access-token";
import { requireSession } from "@/lib/api-auth";

const DEFAULT_SPACE = "default";

async function getSpace(spaceId: string | null, tokenSpaceId: string | null) {
    const id = spaceId ?? tokenSpaceId ?? null;
    return id
        ? prisma.space.findFirst({ where: { id } })
        : prisma.space.findFirst({ where: { identifier: DEFAULT_SPACE } });
}

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const access = await requireReadAccess();
    if (!access.allowed) {
        return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const slug = decodeURIComponent((await params).slug);
    const space = await getSpace(null, access.spaceId);
    if (!space) {
        return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }
    const entry = await prisma.entry.findFirst({
        where: { spaceId: space.id, slug },
        include: { contentType: true },
    });
    if (!entry) {
        return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }
    const content = typeof entry.content === "string" ? JSON.parse(entry.content) : entry.content;
    return NextResponse.json({ ...entry, content });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const session = await requireSession();
    if (!session.ok) {
        return NextResponse.json({ error: session.error }, { status: session.status });
    }

    const slug = decodeURIComponent((await params).slug);
    const body = await request.json();
    const space = await getSpace(body.spaceId ?? null, null);
    if (!space) {
        return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }
    const existing = await prisma.entry.findFirst({
        where: { spaceId: space.id, slug },
    });
    if (!existing) {
        return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }
    const content =
        body.content !== undefined
            ? typeof body.content === "string"
                ? body.content
                : JSON.stringify(body.content)
            : undefined;
    const entry = await prisma.entry.update({
        where: { id: existing.id },
        data: {
            ...(body.name !== undefined && { name: body.name }),
            ...(body.slug !== undefined && { slug: body.slug }),
            ...(content !== undefined && { content }),
            ...(body.isPublished !== undefined && {
                isPublished: body.isPublished,
                publishedAt: body.isPublished ? new Date() : null,
            }),
        },
        include: { contentType: true },
    });
    return NextResponse.json(entry);
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const session = await requireSession();
    if (!session.ok) {
        return NextResponse.json({ error: session.error }, { status: session.status });
    }

    const slug = decodeURIComponent((await params).slug);
    const space = await getSpace(null, null);
    if (!space) {
        return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }
    const existing = await prisma.entry.findFirst({
        where: { spaceId: space.id, slug },
    });
    if (!existing) {
        return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }
    await prisma.entry.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true });
}
