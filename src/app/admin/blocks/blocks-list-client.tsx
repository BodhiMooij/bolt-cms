"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

export type BlockItem = {
    id: string;
    name: string;
    type: string;
    updatedAtLabel: string;
    isRoot: boolean;
    isNestable: boolean;
};

export function BlocksListClient({
    initialBlocks,
    spaceId,
    spaceName,
}: {
    initialBlocks: BlockItem[];
    spaceId: string | null;
    spaceName: string | null;
}) {
    const router = useRouter();
    const [blocks, setBlocks] = useState(initialBlocks);
    const [query, setQuery] = useState("");
    const [createOpen, setCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [name, setName] = useState("");
    const [type, setType] = useState("");
    const [createError, setCreateError] = useState<string | null>(null);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return blocks;
        return blocks.filter(
            (b) => b.name.toLowerCase().includes(q) || b.type.toLowerCase().includes(q)
        );
    }, [blocks, query]);

    async function removeBlock(block: BlockItem, e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm(`Remove "${block.name}"? This cannot be undone.`)) return;
        const res = await fetch(`/api/components/${block.id}`, { method: "DELETE" });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            alert(data.error ?? "Failed to remove block");
            return;
        }
        setBlocks((prev) => prev.filter((b) => b.id !== block.id));
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError(null);
        setCreating(true);
        try {
            const res = await fetch("/api/components", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim() || "Untitled block",
                    type: type.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") || "block",
                    ...(spaceId && { spaceId }),
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setCreateError(data.error ?? "Failed to create block");
                return;
            }
            setCreateOpen(false);
            setName("");
            setType("");
            const updatedLabel = data.updatedAt
                ? new Date(data.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : "Just now";
            setBlocks((prev) => [
                { id: data.id, name: data.name, type: data.type, updatedAtLabel: updatedLabel, isRoot: data.isRoot ?? false, isNestable: data.isNestable !== false },
                ...prev,
            ]);
            router.refresh();
        } finally {
            setCreating(false);
        }
    };

    const openCreate = () => {
        setCreateOpen(true);
        setCreateError(null);
        setName("Page block");
        setType("page_block");
    };

    return (
        <>
            <div className="mb-8 flex flex-row items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-2xl">
                        Block library
                    </h1>
                    {spaceName && (
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                            Reusable blocks in {spaceName}. Add them to entries.
                        </p>
                    )}
                </div>
                <button
                    type="button"
                    onClick={openCreate}
                    className="min-h-[44px] shrink-0 flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
                >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New block
                </button>
            </div>

            {createOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => !creating && setCreateOpen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="new-block-title"
                >
                    <div
                        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 id="new-block-title" className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                            Create new block
                        </h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label htmlFor="block-type" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                    Technical name
                                </label>
                                <input
                                    id="block-type"
                                    type="text"
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    placeholder="e.g. page_block"
                                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                                    required
                                    autoFocus
                                />
                                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                                    Used in the JSON as block name.
                                </p>
                            </div>
                            <div>
                                <label htmlFor="block-name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                    Name or description
                                </label>
                                <input
                                    id="block-name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Page block"
                                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                                />
                            </div>
                            {createError && (
                                <p className="text-sm text-red-600 dark:text-red-400">{createError}</p>
                            )}
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setCreateOpen(false)}
                                    disabled={creating}
                                    className="rounded-lg border border-zinc-300 px-4 py-2 text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-700 disabled:opacity-50 dark:bg-amber-500 dark:hover:bg-amber-600"
                                >
                                    {creating ? "Creating…" : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search blocks by name or type…"
                        aria-label="Search blocks"
                        className="w-full rounded-lg border border-zinc-300 bg-white py-2.5 pl-10 pr-3 text-zinc-900 placeholder-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                    />
                </div>

                {filtered.length === 0 ? (
                    <p className="rounded-lg border border-zinc-200 bg-white py-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                        {query.trim() ? "No blocks match your search." : "No blocks yet. Create one to get started."}
                    </p>
                ) : (
                    <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white shadow-sm dark:divide-zinc-700 dark:border-zinc-800 dark:bg-zinc-900">
                        {filtered.map((block) => (
                            <li key={block.id}>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                                    <div className="min-w-0 flex-1 flex items-center gap-4 shrink-0">
                                        <span className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                                            {block.name}
                                        </span>
                                        <span className="rounded bg-zinc-100 px-2 py-0.5 text-sm font-mono shrink-0 dark:bg-zinc-800 dark:text-zinc-300">
                                            {block.type}
                                        </span>
                                        <span className="text-sm text-zinc-500 dark:text-zinc-400 shrink-0">
                                            Updated {block.updatedAtLabel}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => removeBlock(block, e)}
                                        className="shrink-0 rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                                        title="Remove block"
                                        aria-label={`Remove ${block.name}`}
                                    >
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
}
