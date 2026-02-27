import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireReadAccess } from "@/lib/access-token";
import { requireSession, resolveDefaultSpaceForUser, canAccessSpace, canEditSpace } from "@/lib/api-auth";

async function getSpaceForRequest(
    spaceIdParam: string | null | undefined,
    tokenSpaceId: string | null,
    sessionUserId: string | undefined
) {
    const id = spaceIdParam ?? tokenSpaceId ?? undefined;
    if (id) return prisma.space.findFirst({ where: { id } });
    if (sessionUserId) return resolveDefaultSpaceForUser(sessionUserId);
    return null;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const access = await requireReadAccess();
    if (!access.allowed) {
        return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const slug = decodeURIComponent((await params).slug);
    const spaceIdFromQuery = request.nextUrl.searchParams.get("space") ?? undefined;
    const space = await getSpaceForRequest(
        spaceIdFromQuery ?? null,
        access.spaceId,
        access.userId
    );
    if (!space) {
        return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }
    if (access.userId) {
        const ok = await canAccessSpace(space.id, access.userId);
        if (!ok.ok) return NextResponse.json({ error: ok.error }, { status: ok.status });
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
    const space = await getSpaceForRequest(body.spaceId ?? null, null, session.userId);
    if (!space) {
        return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }
    const edit = await canEditSpace(space.id, session.userId);
    if (!edit.ok) {
        return NextResponse.json({ error: edit.error }, { status: edit.status });
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
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const session = await requireSession();
    if (!session.ok) {
        return NextResponse.json({ error: session.error }, { status: session.status });
    }

    const slug = decodeURIComponent((await params).slug);
    const spaceIdFromQuery = request.nextUrl.searchParams.get("space") ?? undefined;
    const space = await getSpaceForRequest(spaceIdFromQuery ?? null, null, session.userId);
    if (!space) {
        return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }
    const edit = await canEditSpace(space.id, session.userId);
    if (!edit.ok) {
        return NextResponse.json({ error: edit.error }, { status: edit.status });
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
