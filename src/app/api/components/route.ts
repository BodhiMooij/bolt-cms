import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireReadAccess } from "@/lib/access-token";

const DEFAULT_SPACE = "default";

export async function GET(request: NextRequest) {
  const access = await requireReadAccess();
  if (!access.allowed) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status }
    );
  }

  const { searchParams } = new URL(request.url);
  const spaceIdParam = access.spaceId ? undefined : searchParams.get("space") ?? undefined;
  const spaceId = spaceIdParam ?? access.spaceId ?? undefined;
  const space = spaceId
    ? await prisma.space.findFirst({ where: { id: spaceId } })
    : await prisma.space.findFirst({ where: { identifier: DEFAULT_SPACE } });
  if (!space) {
    return NextResponse.json(
      { error: "Space not found. Run: npx prisma db seed" },
      { status: 404 }
    );
  }

  const components = await prisma.component.findMany({
    where: { spaceId: space.id },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(
    components.map((c) => ({
      ...c,
      schema: typeof c.schema === "string" ? JSON.parse(c.schema) : c.schema,
    }))
  );
}
