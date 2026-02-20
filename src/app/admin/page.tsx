import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import { SpacesClient } from "./spaces-client";

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
                    Overview of your projects. Each space has its own entries, components, and
                    content types.
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
                            No projects yet. Create one below or run{" "}
                            <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-sm dark:bg-zinc-800">
                                npm run db:seed
                            </code>{" "}
                            for the default space.
                        </p>
                    </div>
                )}

                {!error && <SpacesClient spaces={spaces} />}
            </div>
        </div>
    );
}
