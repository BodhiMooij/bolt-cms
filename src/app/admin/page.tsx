import Link from "next/link";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My spaces",
};

async function getSpaces() {
  return prisma.space.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { entries: true, components: true, contentTypes: true },
      },
    },
  });
}

function SpaceIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </svg>
  );
}

export default async function AdminSpacesPage() {
  let spaces: Awaited<ReturnType<typeof getSpaces>> = [];
  let error: string | null = null;
  try {
    spaces = await getSpaces();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load spaces";
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 md:py-16">
      <div className="w-full max-w-3xl">
        <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          My spaces
        </h1>
        <p className="mb-8 text-zinc-600 dark:text-zinc-400">
          Overview of your projects. Each space has its own entries, components, and content types.
        </p>

        {error && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            {error}
          </div>
        )}

        {!error && spaces.length === 0 && (
          <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <SpaceIcon className="mx-auto mb-4 h-12 w-12 text-zinc-400 dark:text-zinc-500" />
            <p className="text-zinc-600 dark:text-zinc-400">
              No spaces yet. Run <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-sm dark:bg-zinc-800">npm run db:seed</code> to create the default space.
            </p>
          </div>
        )}

        {!error && spaces.length > 0 && (
          <ul className="grid gap-4 sm:grid-cols-2">
            {spaces.map((space: (typeof spaces)[number]) => (
              <li key={space.id}>
                <Link
                  href={`/admin/entries?space=${space.id}`}
                  className="block rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300 hover:shadow dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                      <SpaceIcon className="h-5 w-5" />
                    </span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                      {space.name}
                    </span>
                  </span>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {space.identifier}
                  </p>
                  <dl className="mt-4 flex gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                    <span>{space._count.entries} entries</span>
                    <span>{space._count.components} components</span>
                    <span>{space._count.contentTypes} content types</span>
                  </dl>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
