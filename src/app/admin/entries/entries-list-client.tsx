"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";

export type EntryItem = {
    id: string;
    slug: string;
    name: string;
    isPublished: boolean;
    updatedAtLabel: string;
    contentType: { type: string };
    createdBy: { id: string; name: string | null; email: string | null; image: string | null } | null;
};

export function EntriesListClient({
    entries: initialEntries,
    spaceId,
}: {
    entries: EntryItem[];
    spaceId: string | null;
}) {
    const [query, setQuery] = useState("");
    const [entries, setEntries] = useState(initialEntries);
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dropIndicator, setDropIndicator] = useState<{ entryId: string; position: "before" | "after" } | null>(null);
    const [reordering, setReordering] = useState(false);
    const [hoveredEntryId, setHoveredEntryId] = useState<string | null>(null);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return entries;
        return entries.filter(
            (e) =>
                e.name.toLowerCase().includes(q) ||
                e.slug.toLowerCase().includes(q) ||
                e.contentType.type.toLowerCase().includes(q)
        );
    }, [entries, query]);

    const canReorder = !query.trim() && spaceId && entries.length > 1;

    async function reorderEntries(newOrder: EntryItem[]) {
        if (!spaceId) return;
        setReordering(true);
        try {
            const res = await fetch("/api/entries/reorder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ spaceId, entryIds: newOrder.map((e) => e.id) }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                alert(data.error ?? "Failed to reorder");
                return;
            }
            setEntries(newOrder);
        } finally {
            setReordering(false);
        }
    }

    function handleDragStart(e: React.DragEvent, entry: EntryItem) {
        setDraggedId(entry.id);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", entry.id);
        e.dataTransfer.setData("application/json", JSON.stringify({ id: entry.id }));
    }

    function handleDragOver(e: React.DragEvent, entry: EntryItem) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (!draggedId || draggedId === entry.id) return;
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        const position = e.clientY < mid ? "before" : "after";
        setDropIndicator({ entryId: entry.id, position });
    }

    function handleDragLeave() {
        setDropIndicator(null);
    }

    function handleDragEnd() {
        setDraggedId(null);
        setDropIndicator(null);
    }

    function handleDrop(e: React.DragEvent, dropTarget: EntryItem) {
        e.preventDefault();
        const id = e.dataTransfer.getData("text/plain");
        if (!id || id === dropTarget.id || !canReorder) {
            setDraggedId(null);
            setDropIndicator(null);
            return;
        }
        const fromIndex = entries.findIndex((e) => e.id === id);
        const toIndex = entries.findIndex((e) => e.id === dropTarget.id);
        if (fromIndex === -1 || toIndex === -1) {
            setDraggedId(null);
            setDropIndicator(null);
            return;
        }
        const position = dropIndicator?.entryId === dropTarget.id ? dropIndicator.position : "after";
        let insertAt = position === "before" ? toIndex : toIndex + 1;
        if (fromIndex < insertAt) insertAt -= 1;
        const newOrder = [...entries];
        const [removed] = newOrder.splice(fromIndex, 1);
        newOrder.splice(insertAt, 0, removed);
        setDraggedId(null);
        setDropIndicator(null);
        reorderEntries(newOrder);
    }

    async function removeEntry(entry: EntryItem, e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm(`Remove "${entry.name}"? This cannot be undone.`)) return;
        const url = `/api/entries/${encodeURIComponent(entry.slug)}${spaceId ? `?space=${spaceId}` : ""}`;
        const res = await fetch(url, { method: "DELETE" });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            alert(data.error ?? "Failed to remove entry");
            return;
        }
        setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    }

    return (
        <div className="space-y-4">
            <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
                    <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                </span>
                <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search entries by name, slug, or content type…"
                    aria-label="Search entries"
                    className="w-full rounded-lg border border-zinc-300 bg-white py-2.5 pl-10 pr-3 text-zinc-900 placeholder-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                />
            </div>

            {filtered.length === 0 ? (
                <p className="rounded-lg border border-zinc-200 bg-white py-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                    {query.trim() ? "No entries match your search." : "No entries yet."}
                </p>
            ) : (
                <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white shadow-sm dark:divide-zinc-700 dark:border-zinc-800 dark:bg-zinc-900">
                    {filtered.flatMap((entry) => {
                        const showLineBefore =
                            dropIndicator?.entryId === entry.id && dropIndicator?.position === "before";
                        const showLineAfter =
                            dropIndicator?.entryId === entry.id && dropIndicator?.position === "after";
                        const dropLine = (pos: "before" | "after") => (
                            <motion.li
                                key={`line-${pos}-${entry.id}`}
                                className="list-none"
                                aria-hidden
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.15 }}
                            >
                                <div className="h-0.5 bg-amber-500 mx-4 rounded-full" />
                            </motion.li>
                        );
                        return [
                            showLineBefore ? dropLine("before") : null,
                            <li
                                key={entry.id}
                                onMouseEnter={() => setHoveredEntryId(entry.id)}
                                onMouseLeave={() => setHoveredEntryId(null)}
                                onDragOver={(e) => handleDragOver(e, entry)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, entry)}
                                className={`transition-opacity duration-150 ${draggedId === entry.id ? "opacity-50" : ""}`}
                            >
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                                <Link
                                    href={`/admin/entries/${encodeURIComponent(entry.slug)}${spaceId ? `?space=${spaceId}` : ""}`}
                                    className="min-w-0 flex-1 flex items-center gap-4 shrink-0"
                                >
                                    <span className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                                        {entry.name}
                                    </span>
                                    <span className="rounded bg-zinc-100 px-2 py-0.5 text-sm font-mono shrink-0 dark:bg-zinc-800 dark:text-zinc-300">
                                        {entry.contentType.type}
                                    </span>
                                    {entry.isPublished ? (
                                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                            Published
                                        </span>
                                    ) : (
                                        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                            Draft
                                        </span>
                                    )}
                                    <span className="text-sm text-zinc-500 dark:text-zinc-400 shrink-0">
                                        Updated {entry.updatedAtLabel}
                                    </span>
                                </Link>
                                <div className="flex items-center gap-2 shrink-0">
                                    {entry.createdBy && (
                                        <span className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                                            {entry.createdBy.image ? (
                                                <img
                                                    src={entry.createdBy.image}
                                                    alt=""
                                                    className="h-7 w-7 rounded-full object-cover"
                                                />
                                            ) : (
                                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                                                    {(entry.createdBy.name ?? entry.createdBy.email ?? "?")[0].toUpperCase()}
                                                </span>
                                            )}
                                        </span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => removeEntry(entry, e)}
                                    className="shrink-0 rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                                    title="Remove entry"
                                    aria-label={`Remove ${entry.name}`}
                                >
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                    </svg>
                                </button>
                                {canReorder && hoveredEntryId === entry.id && (
                                    <span
                                        draggable={!reordering}
                                        onDragStart={(e) => handleDragStart(e, entry)}
                                        onDragEnd={handleDragEnd}
                                        className="cursor-grab touch-none shrink-0 rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 active:cursor-grabbing dark:hover:bg-zinc-700 dark:hover:text-zinc-300 transition-opacity duration-150"
                                        title="Drag to reorder"
                                        aria-hidden
                                        onPointerDown={(e) => e.stopPropagation()}
                                    >
                                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                                            <path d="M8 6a2 2 0 11-4 0 2 2 0 014 0zm0 6a2 2 0 11-4 0 2 2 0 014 0zm0 6a2 2 0 11-4 0 2 2 0 014 0zm6-12a2 2 0 11-4 0 2 2 0 014 0zm0 6a2 2 0 11-4 0 2 2 0 014 0zm0 6a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </span>
                                )}
                            </div>
                        </li>,
                            showLineAfter ? dropLine("after") : null,
                        ].filter(Boolean);
                    })}
                </ul>
            )}
        </div>
    );
}
