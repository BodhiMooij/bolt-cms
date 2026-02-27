"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Space = {
    id: string;
    name: string;
    identifier: string;
    updatedAt: string;
    ownerImage: string | null;
    ownerName: string | null;
    sharedWith: Array<{ name: string | null; image: string | null }>;
    _count: { entries: number; components: number; contentTypes: number };
};

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

function OwnerAvatar({
    image,
    name,
    size = "md",
    className,
}: {
    image: string | null;
    name: string | null;
    size?: "sm" | "md";
    className?: string;
}) {
    const sizeClass = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
    if (image) {
        return (
            <img
                src={image}
                alt={name ? "" : "Space owner"}
                className={`rounded-lg object-cover ${sizeClass} ${className ?? ""}`}
            />
        );
    }
    const initials = name
        ? name
              .trim()
              .split(/\s+/)
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase() || "?"
        : "?";
    return (
        <span
            className={`flex items-center justify-center rounded-full bg-amber-100 font-medium text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 ${sizeClass} ${className ?? ""}`}
            aria-hidden
        >
            {initials}
        </span>
    );
}

function slugFromName(name: string): string {
    const s = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "");
    return s || "space";
}

function StarIcon({ filled, className }: { filled: boolean; className?: string }) {
    return filled ? (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
    ) : (
        <svg
            className={className}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            aria-hidden
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
            />
        </svg>
    );
}

function SpaceCard({
    space,
    isFavorite,
    isTogglingFavorite,
    onToggleFavorite,
    onEdit,
}: {
    space: Space;
    isFavorite: boolean;
    isTogglingFavorite: boolean;
    onToggleFavorite: (spaceId: string) => void;
    onEdit: (space: Space) => void;
}) {
    return (
        <li className="relative">
            <Link
                href={`/admin/dashboard?space=${space.id}`}
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
                <div className="mt-3 flex items-center -space-x-2 transition-[gap,margin] duration-300 ease-out hover:space-x-0 hover:gap-2 [&>*]:transition-[margin] [&>*]:duration-300 [&>*]:ease-out">
                    <span className="rounded-lg relative z-10 ring-2 ring-white dark:ring-zinc-900">
                        <OwnerAvatar
                            image={space.ownerImage}
                            name={space.ownerName}
                            size="sm"
                        />
                    </span>
                    {space.sharedWith.map((member, i) => (
                        <span key={i} className="rounded-lg relative z-0 ring-2 ring-white dark:ring-zinc-900">
                            <OwnerAvatar
                                image={member.image}
                                name={member.name}
                                size="sm"
                            />
                        </span>
                    ))}
                </div>
                <dl className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                    <span>{space._count.entries} entries</span>
                    <span>{space._count.components} components</span>
                    <span>{space._count.contentTypes} content types</span>
                    {space.updatedAt && (
                        <span>
                            Updated{" "}
                            {new Date(space.updatedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                            })}
                        </span>
                    )}
                </dl>
            </Link>
            <div className="absolute right-4 top-4 flex gap-1">
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onToggleFavorite(space.id);
                    }}
                    disabled={isTogglingFavorite}
                    className="rounded p-1.5 text-amber-500 hover:bg-amber-50 hover:text-amber-600 disabled:opacity-50 dark:hover:bg-amber-950/30 dark:hover:text-amber-400"
                    title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                    aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                    <StarIcon filled={isFavorite} className="h-5 w-5" />
                </button>
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onEdit(space);
                    }}
                    className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                    title="Edit project"
                    aria-label={`Edit ${space.name}`}
                >
                    <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
                        />
                    </svg>
                </button>
            </div>
        </li>
    );
}

export function SpacesClient({
    spaces,
    favoriteIds = [],
    title,
    subtitle,
}: {
    spaces: Space[];
    favoriteIds?: string[];
    title?: string;
    subtitle?: string;
}) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [togglingFavoriteId, setTogglingFavoriteId] = useState<string | null>(null);
    const favoriteSet = new Set(favoriteIds);
    const [createOpen, setCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [name, setName] = useState("");
    const [createError, setCreateError] = useState<string | null>(null);
    const [editingSpace, setEditingSpace] = useState<Space | null>(null);
    const [editName, setEditName] = useState("");
    const [editError, setEditError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const q = searchQuery.trim().toLowerCase();
    const filteredSpaces = q
        ? spaces.filter(
              (s) =>
                  s.name.toLowerCase().includes(q) || s.identifier.toLowerCase().includes(q)
          )
        : spaces;
    const favoriteSpaces = filteredSpaces.filter((s) => favoriteSet.has(s.id));
    const otherSpaces = filteredSpaces.filter((s) => !favoriteSet.has(s.id));

    const handleToggleFavorite = async (spaceId: string) => {
        const isFav = favoriteSet.has(spaceId);
        setTogglingFavoriteId(spaceId);
        try {
            const res = isFav
                ? await fetch(`/api/spaces/${spaceId}/favorite`, { method: "DELETE" })
                : await fetch(`/api/spaces/${spaceId}/favorite`, { method: "POST" });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                alert(data.error ?? "Failed to update favorite");
                return;
            }
            router.refresh();
        } finally {
            setTogglingFavoriteId(null);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError(null);
        setCreating(true);
        try {
            const res = await fetch("/api/spaces", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    identifier: slugFromName(name),
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setCreateError(data.error ?? "Failed to create project");
                return;
            }
            setName("");
            setCreateOpen(false);
            router.refresh();
        } finally {
            setCreating(false);
        }
    };

    const openEdit = (space: Space) => {
        setEditingSpace(space);
        setEditName(space.name);
        setEditError(null);
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSpace) return;
        setEditError(null);
        setSaving(true);
        try {
            const res = await fetch(`/api/spaces/${editingSpace.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: editName.trim() }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setEditError(data.error ?? "Failed to update project");
                return;
            }
            setEditingSpace(null);
            router.refresh();
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <div className="mb-8 flex flex-row items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    {title && (
                        <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                            {title}
                        </h1>
                    )}
                    {subtitle && (
                        <p className="text-zinc-600 dark:text-zinc-400">{subtitle}</p>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setCreateOpen(true);
                        setCreateError(null);
                        setName("");
                    }}
                    className="shrink-0 rounded-lg bg-amber-600 px-4 py-2.5 font-medium text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
                >
                    New project
                </button>
            </div>
            <div className="relative mb-6">
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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search projects…"
                    aria-label="Search projects"
                    className="w-full rounded-lg border border-zinc-300 bg-white py-2.5 pl-10 pr-3 text-zinc-900 placeholder-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                />
            </div>

            {createOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => !creating && setCreateOpen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="new-space-title"
                >
                    <div
                        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2
                            id="new-space-title"
                            className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50"
                        >
                            New project
                        </h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label
                                    htmlFor="new-space-name"
                                    className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                                >
                                    Name
                                </label>
                                <input
                                    id="new-space-name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Marketing"
                                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
                                    required
                                    autoFocus
                                />
                            </div>
                            {createError && (
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    {createError}
                                </p>
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

            {filteredSpaces.length === 0 && (
                <p className="rounded-xl border border-zinc-200 bg-white py-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                    {q ? "No projects match your search." : "No projects yet."}
                </p>
            )}

            {favoriteSpaces.length > 0 && (
                <section className="mb-8" aria-label="Favorite spaces">
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Favorite spaces
                    </h2>
                    <ul className="grid gap-4 sm:grid-cols-2">
                        {favoriteSpaces.map((space) => (
                            <SpaceCard
                                key={space.id}
                                space={space}
                                isFavorite={true}
                                isTogglingFavorite={togglingFavoriteId === space.id}
                                onToggleFavorite={handleToggleFavorite}
                                onEdit={openEdit}
                            />
                        ))}
                    </ul>
                </section>
            )}

            {otherSpaces.length > 0 && (
                <section aria-label={favoriteSpaces.length > 0 ? "Other projects" : "All projects"}>
                    {favoriteSpaces.length > 0 && (
                        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Other projects
                        </h2>
                    )}
                    <ul className="grid gap-4 sm:grid-cols-2">
                        {otherSpaces.map((space) => (
                            <SpaceCard
                                key={space.id}
                                space={space}
                                isFavorite={false}
                                isTogglingFavorite={togglingFavoriteId === space.id}
                                onToggleFavorite={handleToggleFavorite}
                                onEdit={openEdit}
                            />
                        ))}
                    </ul>
                </section>
            )}

            {editingSpace && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => !saving && setEditingSpace(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="edit-space-title"
                >
                    <div
                        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2
                            id="edit-space-title"
                            className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50"
                        >
                            Edit project
                        </h2>
                        <form onSubmit={handleEdit} className="space-y-4">
                            <div>
                                <label
                                    htmlFor="edit-space-name"
                                    className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                                >
                                    Name
                                </label>
                                <input
                                    id="edit-space-name"
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                                    required
                                />
                            </div>
                            {editError && (
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    {editError}
                                </p>
                            )}
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingSpace(null)}
                                    disabled={saving}
                                    className="rounded-lg border border-zinc-300 px-4 py-2 text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-700 disabled:opacity-50 dark:bg-amber-500 dark:hover:bg-amber-600"
                                >
                                    {saving ? "Saving…" : "Save"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
