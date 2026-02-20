import Link from "next/link";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entries",
};

export default async function AdminEntriesPage({
  searchParams,
}: {
  searchParams: Promise<{ space?: string }>;
}) {
  const { space: spaceId } = await searchParams;
  let entries: Array<{
    id: string;
    slug: string;
    name: string;
    isPublished: boolean;
    contentType: { type: string };
  }> = [];
  let spaceName: string | null = null;
  let error: string | null = null;

  try {
    const space = spaceId
      ? await prisma.space.findFirst({ where: { id: spaceId } })
      : await prisma.space.findFirst({ where: { identifier: "default" } });
    if (!space) {
      error = "Space not found. Run: npm run db:seed";
    } else {
      spaceName = space.name;
      entries = await prisma.entry.findMany({
        where: { spaceId: space.id },
        include: { contentType: true },
        orderBy: { updatedAt: "desc" },
      });
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load entries";
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Content entries
          </h1>
          {spaceName && (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {spaceName}
            </p>
          )}
        </div>
        <Link
          href="/admin/entries/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          New entry
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          {error}
        </div>
      )}

      {!error && entries.length === 0 && (
        <p className="text-zinc-500 dark:text-zinc-400">
          No entries yet. Create one to get started.
        </p>
      )}

      {!error && entries.length > 0 && (
        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white shadow-sm dark:divide-zinc-700 dark:border-zinc-800 dark:bg-zinc-900">
          {entries.map((entry) => (
            <li key={entry.id}>
              <Link
                href={`/admin/entries/${encodeURIComponent(entry.slug)}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {entry.name}
                </span>
                <span className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                  <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono dark:bg-zinc-800 dark:text-zinc-300">
                    {entry.contentType.type}
                  </span>
                  {entry.isPublished ? (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Published
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400">
                      Draft
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
