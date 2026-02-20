import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const spaces = await prisma.space.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(spaces);
}
