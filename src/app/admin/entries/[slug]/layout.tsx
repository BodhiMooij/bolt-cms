import { prisma } from "@/lib/db";
import type { Metadata } from "next";

async function getEntryTitle(slug: string): Promise<string | null> {
    if (slug === "new") return "New entry";
    const space = await prisma.space.findFirst({
        where: { identifier: "default" },
    });
    if (!space) return null;
    const entry = await prisma.entry.findFirst({
        where: { spaceId: space.id, slug },
        select: { name: true },
    });
    return entry?.name ?? null;
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const slug = decodeURIComponent((await params).slug);
    const name = await getEntryTitle(slug);
    const title = name ? `Edit: ${name}` : slug === "new" ? "New entry" : "Edit entry";
    return { title };
}

export default function EntryLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
