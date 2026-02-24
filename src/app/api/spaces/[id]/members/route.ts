import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, canEditSpace } from "@/lib/api-auth";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await requireSession();
    if (!session.ok) {
        return NextResponse.json({ error: session.error }, { status: session.status });
    }
    const { id: spaceId } = await params;
    const access = await canEditSpace(spaceId, session.userId);
    if (!access.ok) {
        return NextResponse.json({ error: access.error }, { status: access.status });
    }
    const members = await prisma.spaceMember.findMany({
        where: { spaceId },
        include: { user: { select: { id: true, email: true, name: true, image: true } } },
        orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(members);
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await requireSession();
    if (!session.ok) {
        return NextResponse.json({ error: session.error }, { status: session.status });
    }
    const { id: spaceId } = await params;
    const access = await canEditSpace(spaceId, session.userId);
    if (!access.ok) {
        return NextResponse.json({ error: access.error }, { status: access.status });
    }
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const role = typeof body.role === "string" && (body.role === "editor" || body.role === "viewer") ? body.role : "editor";
    if (!email) {
        return NextResponse.json({ error: "email is required" }, { status: 400 });
    }
    const inviteUser = await prisma.user.findUnique({ where: { email } });
    if (!inviteUser) {
        return NextResponse.json(
            { error: "No account found with that email. They must sign in once to create an account." },
            { status: 404 }
        );
    }
    if (inviteUser.id === session.userId) {
        return NextResponse.json({ error: "You already own or have access to this space." }, { status: 400 });
    }
    const space = await prisma.space.findUnique({ where: { id: spaceId }, select: { userId: true } });
    if (!space || space.userId === inviteUser.id) {
        return NextResponse.json({ error: "Cannot add the space owner as a member." }, { status: 400 });
    }
    try {
        const member = await prisma.spaceMember.upsert({
            where: { spaceId_userId: { spaceId, userId: inviteUser.id } },
            update: { role },
            create: { spaceId, userId: inviteUser.id, role },
            include: { user: { select: { id: true, email: true, name: true, image: true } } },
        });
        return NextResponse.json(member);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
    }
}
